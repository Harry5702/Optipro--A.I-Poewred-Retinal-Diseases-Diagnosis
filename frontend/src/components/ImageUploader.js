import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { FaCloudUploadAlt, FaSpinner, FaTimes, FaInfoCircle, FaExclamationTriangle, FaEye, FaSave, FaRobot, FaFilePdf, FaDownload } from 'react-icons/fa';
import { ThemeContext } from '../App';
import { AuthContext } from './AuthModal';
import { supabaseHelpers } from '../lib/supabase';
import EnhancedMedicalAnalysis from './EnhancedMedicalAnalysis';
import { generatePatientReport } from '../services/pdfService';
import { getMedicalExplanation } from '../services/geminiService';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';
import './ImageUploader.css';

const API_URL = 'http://localhost:5000';
const SAMPLE_RETINA_IMAGE = '/assets/sample-retina.jpg'; // Sample retina image path
const SAMPLE_IMAGE_INSTRUCTIONS = "Note: You need to add a valid retinal scan image named 'sample-retina.jpg' to your project's public/assets folder for this example to display properly.";

const ImageUploader = ({ patientId, onScanComplete, showDetailedMetrics = false }) => {
  const { darkMode } = useContext(ThemeContext);
  const { currentUser } = useContext(AuthContext);
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [confusionMatrix, setConfusionMatrix] = useState(null);
  const [isValidRetinalImage, setIsValidRetinalImage] = useState(true);
  const [showMedicalExplanation, setShowMedicalExplanation] = useState(false);
  const [showSaveOptions, setShowSaveOptions] = useState(false);
  const [saveToDatabase, setSaveToDatabase] = useState(true);
  const [doctorNotes, setDoctorNotes] = useState('');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Sample confusion matrix data (in a real app, this would come from the backend)
  useEffect(() => {
    // This simulates fetching confusion matrix data
    const sampleConfusionMatrix = {
      labels: ['CNV', 'DME', 'DRUSEN', 'NORMAL'],
      matrix: [
        [95, 2, 1, 2],    // CNV
        [3, 92, 3, 2],    // DME
        [2, 4, 90, 4],    // DRUSEN
        [1, 2, 2, 95]     // NORMAL
      ]
    };
    
    setConfusionMatrix(sampleConfusionMatrix);
  }, []);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check if file is an image
    if (!file.type.match('image.*')) {
      setError('Please select an image file');
      setIsValidRetinalImage(false);
      return;
    }

    // Clear previous results and errors
    setResult(null);
    setError(null);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);
    
    // For demonstration purposes, we accept all images as valid retinal scans
    // In a production environment, you would implement sophisticated ML-based validation
    
    // Set the file for processing
    setSelectedFile(file);
    setIsValidRetinalImage(true);
  };

  const handleCancelImage = () => {
    setSelectedFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    setIsValidRetinalImage(true);
    
    // Reset the file input
    const fileInput = document.getElementById('file-input');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedFile) {
      setError('Please select a valid retinal scan image first');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    const formData = new FormData();
    formData.append('file', selectedFile);
    
    try {
      console.log('Sending image to API:', API_URL + '/api/predict');
      const response = await axios.post(`${API_URL}/api/predict`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('API response:', response.data);
      
      if (response.data) {
        const analysisResult = {
          prediction: response.data.prediction || 'Unknown',
          confidence: response.data.confidence || '0%',
          imageUrl: response.data.image_url,
          heatmapUrl: response.data.heatmap_url,
          timestamp: new Date().toISOString()
        };
        
        setResult(analysisResult);
        setShowSaveOptions(true);
        
        // Auto-save if patient is selected and save option is enabled
        if (patientId && saveToDatabase) {
          await saveScanToDatabase(analysisResult);
        }
      } else {
        setError('Failed to analyze image - no data returned');
      }
    } catch (err) {
      console.error('Error uploading image:', err);
      if (err.response) {
        console.error('Response data:', err.response.data);
        console.error('Response status:', err.response.status);
        setError(`Server error: ${err.response.status} - ${err.response.data.error || 'Unknown error'}`);
      } else if (err.request) {
        console.error('No response received:', err.request);
        setError('No response from server. Is the backend running?');
      } else {
        console.error('Error message:', err.message);
        setError(`Error: ${err.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const saveScanToDatabase = async (scanResult) => {
    if (!currentUser?.id || !patientId) {
      toast.error('Cannot save scan: missing doctor or patient information');
      return;
    }

    try {
      const scanData = {
        id: uuidv4(),
        patient_id: patientId,
        doctor_id: currentUser.id,
        image_url: scanResult.imageUrl || '',
        diagnosis: scanResult.prediction || 'Unknown',
        confidence: parseFloat(scanResult.confidence?.replace('%', '') || 0),
        doctor_notes: doctorNotes || '',
        scan_date: new Date().toISOString(),
        created_at: new Date().toISOString()
      };

      console.log('Saving scan data:', scanData);
      const { data, error } = await supabaseHelpers.createRetinalScan(scanData);
      
      if (error) {
        console.error('Error saving scan:', error);
        toast.error(`Failed to save scan: ${error.message}`);
      } else {
        console.log('Scan saved successfully:', data);
        toast.success('Scan saved successfully!');
        if (onScanComplete) {
          onScanComplete(data);
        }
      }
    } catch (error) {
      console.error('Error saving scan:', error);
      toast.error('Failed to save scan to database');
    }
  };

  const handleManualSave = async () => {
    if (result) {
      await saveScanToDatabase(result);
      setShowSaveOptions(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!result || !currentUser || !patientId) {
      toast.error('Cannot generate PDF: Missing scan data, doctor, or patient information');
      return;
    }

    setIsGeneratingPDF(true);
    
    try {
      // Get patient data
      const patientData = await supabaseHelpers.getPatientById(patientId);
      if (!patientData) {
        toast.error('Cannot find patient information');
        return;
      }

      // Get AI explanation
      let aiExplanation = '';
      try {
        aiExplanation = await getMedicalExplanation(result.prediction, result.confidence);
      } catch (error) {
        console.log('Could not get AI explanation for PDF:', error);
        aiExplanation = 'AI analysis unavailable';
      }

      // Prepare doctor data
      const doctorData = {
        name: currentUser.name || 'Unknown Doctor',
        specialization: currentUser.specialization || 'Ophthalmology',
        license: currentUser.license_number || 'N/A'
      };

      // Generate PDF
      const pdfResult = await generatePatientReport(
        result,
        doctorData, 
        patientData,
        aiExplanation,
        doctorNotes
      );

      if (pdfResult.success) {
        toast.success(`PDF report downloaded: ${pdfResult.filename}`);
      } else {
        toast.error(`PDF generation failed: ${pdfResult.error}`);
      }
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF report');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const renderConfusionMatrix = () => {
    if (!confusionMatrix || !showDetailedMetrics) return null;
    
    return (
      <div className="confusion-matrix-container">
        <h4>Performance Metrics: Confusion Matrix</h4>
        <div className="confusion-matrix-info">
          <FaInfoCircle className="info-icon" />
          <span>Shows model accuracy across different classes</span>
        </div>
        <div className="confusion-matrix">
          <div className="matrix-row matrix-header">
            <div className="matrix-cell corner-cell">Actual ↓ / Predicted →</div>
            {confusionMatrix.labels.map((label, index) => (
              <div key={`header-${index}`} className="matrix-cell header-cell">{label}</div>
            ))}
          </div>
          
          {confusionMatrix.matrix.map((row, rowIndex) => (
            <div key={`row-${rowIndex}`} className="matrix-row">
              <div className="matrix-cell header-cell">{confusionMatrix.labels[rowIndex]}</div>
              {row.map((cell, cellIndex) => (
                <div 
                  key={`cell-${rowIndex}-${cellIndex}`} 
                  className={`matrix-cell ${rowIndex === cellIndex ? 'diagonal-cell' : ''}`}
                  style={{
                    backgroundColor: rowIndex === cellIndex 
                      ? `rgba(46, 204, 113, ${cell/100})` 
                      : `rgba(231, 76, 60, ${cell/100})`
                  }}
                >
                  {cell}%
                </div>
              ))}
            </div>
          ))}
        </div>
        <p className="matrix-explanation">
          Higher numbers on the diagonal indicate better classification accuracy for that category.
        </p>
      </div>
    );
  };

  return (
    <div className={`image-uploader ${darkMode ? 'dark' : 'light'}`}>
      <form onSubmit={handleSubmit}>
        <div className="upload-container">
          <div className="upload-area-wrapper">
            <div className="upload-area" onClick={() => document.getElementById('file-input').click()}>
              {preview ? (
                <>
                  <img src={preview} alt="Preview" className="image-preview" />
                  <div className="image-overlay">
                    <div className="overlay-text">Click to change image</div>
                  </div>
                </>
              ) : (
                <div className="upload-placeholder">
                  <FaCloudUploadAlt className="upload-icon" />
                  <p>Click to select or drop a retinal scan image</p>
                  <span className="upload-formats">Supports: JPG, PNG, TIFF</span>
                </div>
              )}
              <input
                type="file"
                id="file-input"
                onChange={handleFileChange}
                accept="image/*"
                className="file-input"
              />
            </div>
            
            {preview && (
              <button 
                type="button"
                className="cancel-button"
                onClick={handleCancelImage}
                aria-label="Cancel image selection"
              >
                <FaTimes />
              </button>
            )}
          </div>
          
          <div className="button-container">
            <button 
              type="submit" 
              className="upload-button"
              disabled={isLoading || !selectedFile || !isValidRetinalImage}
            >
              {isLoading ? <><FaSpinner className="spinner" /> Analyzing...</> : 'Analyze Image'}
            </button>
          </div>
          
          {error && (
            <div className="error-container">
              <p className="error-message"><FaExclamationTriangle /> {error}</p>
              {!isValidRetinalImage && (
                <div className="sample-image-container">
                  <p className="sample-image-label">Example of a valid retinal scan image:</p>
                  <img 
                    src={SAMPLE_RETINA_IMAGE} 
                    alt="Sample retinal scan" 
                    className="sample-image" 
                  />
                  <p className="sample-image-instructions">{SAMPLE_IMAGE_INSTRUCTIONS}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </form>
      
      {result && (
        <div className="result-container">
          <div className="result-header">
            <h3>Analysis Results</h3>
            {patientId && showSaveOptions && (
              <div className="save-options">
                <div className="save-controls">
                  <label className="save-checkbox">
                    <input
                      type="checkbox"
                      checked={saveToDatabase}
                      onChange={(e) => setSaveToDatabase(e.target.checked)}
                    />
                    Auto-save to patient record
                  </label>
                  {!saveToDatabase && (
                    <button 
                      className="manual-save-btn"
                      onClick={handleManualSave}
                    >
                      <FaSave />
                      Save to Record
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="result-images">
            <div className="result-image-card">
              <h4>Original Image</h4>
              <img src={`${API_URL}${result.imageUrl}`} alt="Original" className="result-image" />
            </div>
            <div className="result-image-card">
              <h4>Heatmap Analysis</h4>
              <img src={`${API_URL}${result.heatmapUrl}`} alt="Heatmap" className="result-image" />
            </div>
          </div>
          
          <div className="result-metrics">
            <div className="result-details">
              <div className="result-item">
                <span className="result-label">Diagnosis:</span>
                <span className={`result-value diagnosis-${result.prediction.toLowerCase()}`}>
                  {result.prediction}
                </span>
              </div>
              <div className="result-item">
                <span className="result-label">Confidence:</span>
                <span className="result-value confidence-bar">
                  <div className="confidence-background">
                    <div 
                      className="confidence-fill" 
                      style={{ width: result.confidence }}
                    ></div>
                  </div>
                  {result.confidence}
                </span>
              </div>
              <div className="result-item">
                <span className="result-label">Scan Time:</span>
                <span className="result-value">
                  {result.timestamp ? new Date(result.timestamp).toLocaleString() : 'N/A'}
                </span>
              </div>
            </div>
            
            {showDetailedMetrics && (
              <div className="ai-explanation-section">
                <button 
                  className="ai-explanation-btn enhanced"
                  onClick={() => setShowMedicalExplanation(true)}
                >
                  <FaRobot />
                  Get Enhanced AI Medical Analysis
                </button>
              </div>
            )}

            {patientId && (
              <div className="pdf-download-section">
                <button 
                  className="pdf-download-btn"
                  onClick={handleDownloadPDF}
                  disabled={isGeneratingPDF}
                >
                  {isGeneratingPDF ? (
                    <>
                      <FaSpinner className="spinner" />
                      Generating PDF...
                    </>
                  ) : (
                    <>
                      <FaFilePdf />
                      Download Patient Report
                    </>
                  )}
                </button>
              </div>
            )}
            
            {patientId && (
              <div className="doctor-notes-section">
                <label htmlFor="doctor-notes">Doctor's Notes:</label>
                <textarea
                  id="doctor-notes"
                  value={doctorNotes}
                  onChange={(e) => setDoctorNotes(e.target.value)}
                  placeholder="Add your clinical observations and recommendations..."
                  rows="4"
                  className="doctor-notes-input"
                />
              </div>
            )}
            
            {renderConfusionMatrix()}
          </div>
          
          <div className="diagnosis-info">
            <h4><FaEye /> Clinical Information</h4>
            {result.prediction === 'CNV' && (
              <div className="diagnosis-details cnv">
                <h5>Choroidal Neovascularization (CNV)</h5>
                <p><strong>Description:</strong> Formation of new blood vessels in the choroid layer beneath the retina.</p>
                <p><strong>Symptoms:</strong> Central vision loss, distorted vision, blind spots</p>
                <p><strong>Recommended Action:</strong> Immediate referral to retinal specialist for anti-VEGF treatment consideration</p>
                <p><strong>Urgency:</strong> High - treatment within 1-2 weeks optimal</p>
              </div>
            )}
            {result.prediction === 'DME' && (
              <div className="diagnosis-details dme">
                <h5>Diabetic Macular Edema (DME)</h5>
                <p><strong>Description:</strong> Fluid accumulation in the macula due to diabetic retinopathy.</p>
                <p><strong>Symptoms:</strong> Blurred central vision, difficulty reading</p>
                <p><strong>Recommended Action:</strong> Optimize diabetes control, consider anti-VEGF or steroid injections</p>
                <p><strong>Urgency:</strong> Moderate to High - treatment within 2-4 weeks</p>
              </div>
            )}
            {result.prediction === 'DRUSEN' && (
              <div className="diagnosis-details drusen">
                <h5>Drusen</h5>
                <p><strong>Description:</strong> Yellow deposits under the retina, early sign of AMD.</p>
                <p><strong>Symptoms:</strong> May be asymptomatic in early stages</p>
                <p><strong>Recommended Action:</strong> Regular monitoring, lifestyle modifications, AREDS supplements</p>
                <p><strong>Urgency:</strong> Low to Moderate - follow-up in 3-6 months</p>
              </div>
            )}
            {result.prediction === 'NORMAL' && (
              <div className="diagnosis-details normal">
                <h5>Normal Retina</h5>
                <p><strong>Description:</strong> No significant pathological changes detected.</p>
                <p><strong>Recommendation:</strong> Continue routine eye examinations</p>
                <p><strong>Next Screening:</strong> 1-2 years for adults, annually for diabetics or high-risk patients</p>
              </div>
            )}
          </div>
        </div>
      )}
      
      <EnhancedMedicalAnalysis
        prediction={result?.prediction}
        confidence={result?.confidence}
        isOpen={showMedicalExplanation}
        onClose={() => setShowMedicalExplanation(false)}
        patientData={patientId ? { id: patientId } : null}
      />
    </div>
  );
};

export default ImageUploader; 