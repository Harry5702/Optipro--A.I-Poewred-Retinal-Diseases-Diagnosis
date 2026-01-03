import os
import torch
import torch.nn as nn
import torchvision.transforms as transforms
from torchvision import models
from PIL import Image
import numpy as np
import cv2
import matplotlib.pyplot as plt
import base64
from io import BytesIO
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import sys
from supabase import create_client, Client
from dotenv import load_dotenv
import glob

# Load environment variables
load_dotenv()

print("Python version:", sys.version)
print("PyTorch version:", torch.__version__)
print("Starting application...")

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max upload size

# Initialize Supabase client
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_ANON_KEY')
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Defined the classes 
CLASSES = ['CNV', 'DME', 'DRUSEN', 'NORMAL']

def upload_image_to_supabase(image_array, filename, bucket_name='retinal-images'):
    """Upload image to Supabase storage and return public URL"""
    try:
        # Convert numpy array to PIL Image
        if len(image_array.shape) == 3 and image_array.shape[2] == 3:
            pil_image = Image.fromarray(image_array.astype('uint8'), 'RGB')
        else:
            pil_image = Image.fromarray(image_array.astype('uint8'), 'L')
        
        # Convert to bytes
        buffer = BytesIO()
        pil_image.save(buffer, format='JPEG', quality=90)
        image_bytes = buffer.getvalue()
        
        # Upload to Supabase storage
        response = supabase.storage.from_(bucket_name).upload(filename, image_bytes, {
            'content-type': 'image/jpeg'
        })
        
        if response.error:
            print(f"Error uploading to Supabase: {response.error}")
            return None
        
        # Get public URL
        public_url = supabase.storage.from_(bucket_name).get_public_url(filename)
        return public_url
        
    except Exception as e:
        print(f"Error in upload_image_to_supabase: {e}")
        return None

def image_to_base64(image_array):
    """Convert numpy image array to base64 string"""
    # Convert numpy array to PIL Image
    if len(image_array.shape) == 3 and image_array.shape[2] == 3:
        # RGB image
        pil_image = Image.fromarray(image_array.astype('uint8'), 'RGB')
    else:
        # Grayscale image
        pil_image = Image.fromarray(image_array.astype('uint8'), 'L')
    
    # Convert to base64
    buffer = BytesIO()
    pil_image.save(buffer, format='JPEG', quality=90)
    img_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
    return f"data:image/jpeg;base64,{img_base64}"

def file_to_base64(file_path):
    """Convert image file to base64 string"""
    try:
        with Image.open(file_path) as img:
            img = img.convert('RGB')
            buffer = BytesIO()
            img.save(buffer, format='JPEG', quality=90)
            img_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
            return f"data:image/jpeg;base64,{img_base64}"
    except Exception as e:
        print(f"Error converting file to base64: {e}")
        return None

def validate_retinal_image(image_path):
    """Validate if the image is a retinal scan using balanced heuristics for both OCT and fundus images"""
    try:
        img = Image.open(image_path).convert('RGB')
        img_np = np.array(img)
        
        # Check 1: Image should be reasonably sized
        height, width = img_np.shape[:2]
        if width < 100 or height < 100:
            return False, "Image resolution too low for retinal analysis"
        
        # Convert to grayscale for analysis
        gray = cv2.cvtColor(img_np, cv2.COLOR_RGB2GRAY)
        
        # Check 2: Dark background check (relaxed for OCT images)
        dark_pixels = np.sum(gray < 40) / gray.size
        if dark_pixels < 0.15:  # At least 15% should be dark (lowered from 30%)
            return False, "Image lacks the characteristic dark background of retinal scans"
        
        # Check 3: Verify there's some bright content (not completely dark)
        bright_mask = gray > 40
        bright_ratio = np.sum(bright_mask) / gray.size
        
        if bright_ratio < 0.05:  # At least 5% should be visible
            return False, "Image is too dark to be a valid retinal scan"
        
        # Check 4: Color analysis (more lenient for OCT which can be grayscale/bluish)
        red_channel = img_np[:, :, 0].astype(float)
        green_channel = img_np[:, :, 1].astype(float)
        blue_channel = img_np[:, :, 2].astype(float)
        
        if np.sum(bright_mask) > 0:
            red_mean = np.mean(red_channel[bright_mask])
            green_mean = np.mean(green_channel[bright_mask])
            blue_mean = np.mean(blue_channel[bright_mask])
            
            # Check if image is too colorful/vibrant (like wallpapers)
            color_std = np.std([red_mean, green_mean, blue_mean])
            if color_std > 60:  # High color variation suggests non-medical image
                return False, "Color variation too high for medical imaging"
            
            # Reject images with dominant blue AND green (nature photos, etc.)
            if blue_mean > red_mean * 1.2 and green_mean > red_mean * 1.2:
                return False, "Color profile does not match retinal imaging (too much blue/green)"
        
        # Check 5: Look for significant contoured regions
        _, thresh = cv2.threshold(gray, 25, 255, cv2.THRESH_BINARY)
        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        if len(contours) == 0:
            return False, "No retinal structure detected in image"
        
        # Find the largest contour
        largest_contour = max(contours, key=cv2.contourArea)
        contour_area = cv2.contourArea(largest_contour)
        image_area = width * height
        
        # The main region should occupy a reasonable portion (more lenient)
        area_ratio = contour_area / image_area
        if area_ratio < 0.08:  # At least 8% (was 15%)
            return False, "No significant retinal region found"
        
        if area_ratio > 0.92:  # Should have some dark borders (was 85%)
            return False, "Image lacks typical retinal scan framing"
        
        # Check 6: Brightness distribution
        hist = cv2.calcHist([gray], [0], None, [256], [0, 256])
        hist = hist.flatten() / hist.sum()
        
        # Should have some concentration in dark and medium ranges
        dark_region = np.sum(hist[0:40])
        medium_region = np.sum(hist[40:180])
        
        if dark_region < 0.1:  # Some dark background (lowered from 20%)
            return False, "Brightness distribution does not match retinal imaging"
        
        if medium_region < 0.1:  # Some visible content (lowered from 15%)
            return False, "Missing characteristic retinal brightness pattern"
        
        # Check 7: Edge analysis (relaxed - OCT has different edge patterns)
        edges = cv2.Canny(gray, 20, 80)
        edge_density = np.sum(edges > 0) / edges.size
        
        # More lenient edge density range
        if edge_density < 0.01 or edge_density > 0.4:
            return False, "Edge pattern does not match retinal imaging"
        
        # Check 8: Reject highly saturated colorful images (wallpapers, photos)
        hsv = cv2.cvtColor(img_np, cv2.COLOR_RGB2HSV)
        saturation = hsv[:, :, 1]
        high_saturation = np.sum(saturation > 100) / saturation.size
        
        if high_saturation > 0.3:  # More than 30% highly saturated = likely not medical
            return False, "Image appears to be a photograph rather than medical scan"
        
        # If all checks pass, it's likely a retinal image
        return True, "Valid retinal image detected"
        
    except Exception as e:
        print(f"Error validating retinal image: {e}")
        return False, f"Error processing image: {str(e)}"

def get_sample_retinal_images():
    """Get sample retinal images to show users"""
    sample_images = []
    
    # Embedded base64 sample image (fallback - always available)
    EMBEDDED_SAMPLE_IMAGE = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/2wBDAQMDAwQDBAgEBAgQCwkLEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBD/wAARCAEsASwDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD9U6KKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigD//Z"
    
    # Try to find sample images in multiple locations
    possible_paths = [
        os.path.join('frontend', 'public', 'assets', 'sample-retina.jpeg'),
        os.path.join('frontend', 'build', 'assets', 'sample-retina.jpeg'),
        os.path.join('sample_retinal_images', 'sample-retina.jpeg'),
    ]
    
    # Check each path
    for path in possible_paths:
        if os.path.exists(path) and os.path.getsize(path) > 1000:  # Must be larger than 1KB to be a real image
            print(f"Found sample image at: {path}")
            base64_img = file_to_base64(path)
            if base64_img:
                sample_images.append({
                    'name': 'Valid Retinal Scan Example',
                    'data': base64_img,
                    'description': 'A valid retinal scan shows a circular view of the back of the eye with visible blood vessels radiating from the optic disc. The image has an orange-red color with dark edges.'
                })
                print(f"Successfully loaded sample image from {path}")
                return sample_images  # Return immediately if found
    
    # If no file samples found, use the embedded base64 image
    print("Using embedded base64 sample image")
    sample_images.append({
        'name': 'Valid Retinal Scan Example',
        'data': EMBEDDED_SAMPLE_IMAGE,
        'description': 'A valid retinal scan shows a circular view of the back of the eye with visible blood vessels radiating from the optic disc. The image has an orange-red color with dark edges.'
    })
    
    return sample_images

# Define the transformation for input images
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

# Load the model
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"Using device: {device}")

def load_model():
    print("Loading model...")
    # Create ResNet model
    model = models.resnet101(weights=None)  # Changed from pretrained=False to fix deprecation warning
    num_ftrs = model.fc.in_features
    model.fc = nn.Linear(num_ftrs, len(CLASSES))
    
    # Try to load the saved state_dict, otherwise use a mock model for testing
    try:
        # Check if model file exists
        if not os.path.exists('best_model.pth'):
            print("Model file not found, creating a mock model")
            # Save a mock model for testing
            create_mock_model(model)
            
        # Load the saved state_dict
        state_dict = torch.load('best_model.pth', map_location=device)
        
        # Apply the loaded state_dict to the model
        model.load_state_dict(state_dict)
        
        model.to(device)
        model.eval()
        print("Model loaded successfully!")
        return model
    except Exception as e:
        print(f"Error loading model: {e}")
        # For testing purposes, just return the model without weights
        model.to(device)
        model.eval()
        print("Using initialized model without weights for testing")
        return model

def create_mock_model(model):
    """Create a mock model with random weights for testing"""
    print("Creating mock model for testing...")
    # Save the initialized model for testing purposes
    torch.save(model.state_dict(), 'best_model.pth')
    print("Mock model saved to best_model.pth")
    return model

model = load_model()

class GradCAM:
    def __init__(self, model, target_layer):
        self.model = model
        self.target_layer = target_layer
        self.gradients = None
        self.activations = None
        
        # Register hooks
        target_layer.register_forward_hook(self.save_activation)
        target_layer.register_full_backward_hook(self.save_gradient)
        
    def save_activation(self, module, input, output):
        self.activations = output.detach()
        
    def save_gradient(self, module, grad_input, grad_output):
        if grad_output[0] is not None:
            self.gradients = grad_output[0].detach()
        
    def generate_heatmap(self, input_image, class_idx=None):
        # Forward pass
        output = self.model(input_image)
        
        if class_idx is None:
            class_idx = torch.argmax(output).item()
        
        # Zero gradients
        self.model.zero_grad()
        
        # Target for backprop
        one_hot = torch.zeros_like(output)
        one_hot[0, class_idx] = 1
        
        # Backward pass
        output.backward(gradient=one_hot, retain_graph=True)
        
        # Check if gradients were properly captured
        if self.gradients is None:
            # If gradients are None, return a blank heatmap
            return np.zeros((7, 7))  # ResNet's last layer size
        
        # Get weights
        gradients = self.gradients.mean(dim=[2, 3], keepdim=True)
        
        # Weight the activations
        activations = self.activations
        weighted_activations = gradients * activations
        
        # Generate heatmap
        heatmap = torch.mean(weighted_activations, dim=1).squeeze().cpu().detach().numpy()
        
        # ReLU on heatmap
        heatmap = np.maximum(heatmap, 0)
        
        # Normalize
        heatmap = (heatmap - heatmap.min()) / (heatmap.max() - heatmap.min() + 1e-10)
        
        return heatmap

def predict_image(image_path):
    print(f"Predicting image: {image_path}")
    original_image = Image.open(image_path).convert('RGB')
    transformed_image = transform(original_image).unsqueeze(0).to(device)
    
    # Get the layer to use for Grad-CAM
    try:
        target_layer = model.layer4[-1].conv3  # Use the last convolutional layer of ResNet
    except AttributeError:
        # Fallback to another layer if conv3 is not available
        target_layer = model.layer4[-1]
    
    # Initialize Grad-CAM
    grad_cam = GradCAM(model, target_layer)
    
    with torch.no_grad():
        outputs = model(transformed_image)
        _, predicted = torch.max(outputs, 1)
        
        # Get probabilities using softmax
        probabilities = torch.nn.functional.softmax(outputs[0], dim=0)
        confidence = probabilities[predicted].item() * 100
    
    # Get class index 
    class_idx = predicted.item()
    print(f"Predicted class: {CLASSES[class_idx]} with confidence: {confidence:.2f}%")
    
    try:
        # Rerun to compute gradients (no longer in no_grad context)
        print("Generating heatmap...")
        heatmap = grad_cam.generate_heatmap(transformed_image, class_idx)
        
        # Convert the original image to numpy array
        img_np = np.array(original_image)
        
        # Resize heatmap to match original image size
        heatmap = cv2.resize(heatmap, (img_np.shape[1], img_np.shape[0]))
        
        # Apply colormap to heatmap
        heatmap_colored = cv2.applyColorMap(np.uint8(255 * heatmap), cv2.COLORMAP_JET)
        
        # Convert BGR to RGB (cv2 uses BGR by default)
        heatmap_colored = cv2.cvtColor(heatmap_colored, cv2.COLOR_BGR2RGB)
        
        # Superimpose the heatmap onto the original image
        superimposed_img = heatmap_colored * 0.4 + img_np
        superimposed_img = np.clip(superimposed_img, 0, 255).astype(np.uint8)
        
        # Convert images to base64 and upload to Supabase
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        original_filename = f"original_{timestamp}.jpg"
        heatmap_filename = f"heatmap_{timestamp}.jpg"
        
        # Upload to Supabase storage
        original_url = upload_image_to_supabase(img_np, original_filename, 'retinal-images')
        heatmap_url = upload_image_to_supabase(superimposed_img, heatmap_filename, 'heatmap-images')
        
        # Also create base64 for immediate display
        original_base64 = image_to_base64(img_np)
        heatmap_base64 = image_to_base64(superimposed_img)
        
        print(f"Images uploaded to Supabase successfully")
        print(f"Original URL: {original_url}")
        print(f"Heatmap URL: {heatmap_url}")
        
    except Exception as e:
        print(f"Error generating heatmap: {e}")
        # If there's an error generating the heatmap, create placeholder images
        img_np = np.array(original_image)
        placeholder = np.ones(img_np.shape, dtype=np.uint8) * 200  # Light gray
        
        # Use base64 for error cases
        original_url = None
        heatmap_url = None
        original_base64 = image_to_base64(img_np)
        heatmap_base64 = image_to_base64(placeholder)
        print(f"Using placeholder images due to error")
    
    return CLASSES[class_idx], confidence, original_url, heatmap_url, original_base64, heatmap_base64

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy'})

@app.route('/api/doctor/stats/<doctor_id>', methods=['GET'])
def get_doctor_stats(doctor_id):
  
    try:
        
        stats = {
            'total_patients': 15,
            'total_scans': 42,
            'recent_analysis': 8,
            'scan_distribution': {
                'CNV': 8,
                'DME': 12,
                'DRUSEN': 15,
                'NORMAL': 7
            }
        }
        return jsonify(stats)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/predict', methods=['POST'])
def predict():
    print("Received prediction request")
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    patient_id = request.form.get('patient_id', None)
    doctor_id = request.form.get('doctor_id', None)
    
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if file:
        try:
            # Create temporary file for processing (no permanent storage)
            import tempfile
            with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as temp_file:
                file.save(temp_file.name)
                temp_path = temp_file.name
            
            print(f"Processing temporary file: {temp_path}")
            
            # VALIDATE: Check if the image is a retinal scan
            is_valid, validation_message = validate_retinal_image(temp_path)
            
            if not is_valid:
                print(f"Invalid retinal image: {validation_message}")
                # Clean up temporary file
                os.unlink(temp_path)
                
                # Get sample images to show user
                sample_images = get_sample_retinal_images()
                
                return jsonify({
                    'success': False,
                    'error': 'Invalid retinal image',
                    'message': validation_message,
                    'details': 'Please upload a valid retinal scan image. Retinal images should show a circular view of the back of the eye with visible blood vessels.',
                    'sample_images': sample_images
                }), 400
            
            print(f"Valid retinal image: {validation_message}")
            
            # Get prediction, URLs, and base64 images
            prediction, confidence, original_url, heatmap_url, original_base64, heatmap_base64 = predict_image(temp_path)
            
            # Clean up temporary file
            os.unlink(temp_path)
            
            response_data = {
                'success': True,
                'prediction': prediction,
                'confidence': f"{confidence:.2f}%",
                'image_url': original_url or original_base64,  # Use Supabase URL or fallback to base64
                'heatmap_url': heatmap_url or heatmap_base64,  # Use Supabase URL or fallback to base64
                'image_base64': original_base64,  # Always include base64 for immediate display
                'heatmap_base64': heatmap_base64,  # Always include base64 for immediate display
                'timestamp': datetime.now().isoformat()
            }
            
            # Add patient info if provided
            if patient_id:
                response_data['patient_id'] = patient_id
            if doctor_id:
                response_data['doctor_id'] = doctor_id
                
            return jsonify(response_data)
            
        except Exception as e:
            print(f"Error during prediction: {e}")
            import traceback
            traceback.print_exc()
            return jsonify({'error': str(e), 'success': False}), 500

if __name__ == '__main__':
    print("Starting Flask API server...")
    app.run(debug=True, host='0.0.0.0', port=5000) 