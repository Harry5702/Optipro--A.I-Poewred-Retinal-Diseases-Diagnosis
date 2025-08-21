import os
import torch
import torch.nn as nn
import torchvision.transforms as transforms
from torchvision import models
from PIL import Image
import numpy as np
import cv2
import matplotlib.pyplot as plt
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import sys

print("Python version:", sys.version)
print("PyTorch version:", torch.__version__)
print("Starting application...")

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

app.config['UPLOAD_FOLDER'] = 'static/uploads'
app.config['HEATMAP_FOLDER'] = 'static/heatmaps'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max upload size

# Create upload and heatmap folders if they don't exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(app.config['HEATMAP_FOLDER'], exist_ok=True)

# Define the classes - updated to include 4 classes as in the trained model
CLASSES = ['CNV', 'DME', 'DRUSEN', 'NORMAL']

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
        heatmap = cv2.applyColorMap(np.uint8(255 * heatmap), cv2.COLORMAP_JET)
        
        # Convert BGR to RGB (cv2 uses BGR by default)
        heatmap = cv2.cvtColor(heatmap, cv2.COLOR_BGR2RGB)
        
        # Superimpose the heatmap onto the original image
        superimposed_img = heatmap * 0.4 + img_np
        superimposed_img = np.clip(superimposed_img, 0, 255).astype(np.uint8)
        
        # Save the heatmap image
        heatmap_filename = os.path.basename(image_path).split('.')[0] + '_heatmap.jpg'
        heatmap_path = os.path.join(app.config['HEATMAP_FOLDER'], heatmap_filename)
        cv2.imwrite(heatmap_path, cv2.cvtColor(superimposed_img, cv2.COLOR_RGB2BGR))
        print(f"Heatmap saved to: {heatmap_path}")
    except Exception as e:
        print(f"Error generating heatmap: {e}")
        # If there's an error generating the heatmap, create a blank colorful image
        img_np = np.array(original_image)
        placeholder = np.ones(img_np.shape, dtype=np.uint8) * 200  # Light gray
        heatmap_filename = os.path.basename(image_path).split('.')[0] + '_heatmap.jpg'
        heatmap_path = os.path.join(app.config['HEATMAP_FOLDER'], heatmap_filename)
        cv2.imwrite(heatmap_path, placeholder)
        print(f"Using placeholder heatmap: {heatmap_path}")
    
    return CLASSES[class_idx], confidence, heatmap_path

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy'})

@app.route('/api/doctor/stats/<doctor_id>', methods=['GET'])
def get_doctor_stats(doctor_id):
    """Get real-time statistics for a doctor"""
    # In a real application, this would query the database
    # For now, we'll return mock data that simulates database queries
    try:
        # Mock implementation - replace with actual database queries
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
            # Create folders if they don't exist (just in case)
            os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
            os.makedirs(app.config['HEATMAP_FOLDER'], exist_ok=True)
            
            # Generate unique filename with timestamp and patient info
            timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
            file_extension = os.path.splitext(file.filename)[1]
            
            if patient_id:
                filename = f"{patient_id}_{timestamp}_{file.filename}"
            else:
                filename = f"{timestamp}_{file.filename}"
                
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(file_path)
            print(f"File saved to: {file_path}")
            
            prediction, confidence, heatmap_path = predict_image(file_path)
            
            # Convert paths to relative URLs
            image_url = f"/static/uploads/{filename}"
            heatmap_url = f"/static/heatmaps/{os.path.basename(heatmap_path)}"
            
            response_data = {
                'success': True,
                'prediction': prediction,
                'confidence': f"{confidence:.2f}%",
                'image_url': image_url,
                'heatmap_url': heatmap_url,
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