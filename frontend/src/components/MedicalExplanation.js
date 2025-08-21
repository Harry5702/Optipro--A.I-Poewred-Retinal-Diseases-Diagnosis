import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaRobot, FaSpinner, FaExclamationTriangle, FaInfoCircle, FaStethoscope, FaPills, FaEye } from 'react-icons/fa';
import { getMedicalExplanation } from '../services/geminiService';
import './MedicalExplanation.css';

const MedicalExplanation = ({ diagnosis, confidence, isVisible, onClose }) => {
  const [explanation, setExplanation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isVisible && diagnosis) {
      generateExplanation();
    }
  }, [isVisible, diagnosis]);

  const generateExplanation = async () => {
    setLoading(true);
    setError('');
    
    try {
      console.log('Generating explanation for:', diagnosis, 'with confidence:', confidence);
      const result = await getMedicalExplanation(diagnosis, confidence);
      console.log('Gemini service result:', result);
      
      setExplanation(result);
    } catch (err) {
      setError('Failed to generate medical explanation');
      console.error('Medical explanation error:', err);
      setExplanation('Unable to generate medical explanation at this time.');
    } finally {
      setLoading(false);
    }
  };

  const formatExplanation = (text) => {
    if (!text) return '';
    
    const textString = typeof text === 'string' ? text : String(text);
    
    // Convert the concise format to HTML with better styling and proper headings
    return textString
      .replace(/\*\*(Symptoms):\*\*/g, '<div class="section-header symptoms-header"><div class="section-icon-wrapper"><FaEye class="section-icon"/></div><h3 class="section-title">$1</h3></div>')
      .replace(/\*\*(Medications):\*\*/g, '<div class="section-header medications-header"><div class="section-icon-wrapper"><FaPills class="section-icon"/></div><h3 class="section-title">$1</h3></div>')
      .replace(/\*\*(Recommendations):\*\*/g, '<div class="section-header recommendations-header"><div class="section-icon-wrapper"><FaStethoscope class="section-icon"/></div><h3 class="section-title">Clinical Recommendations</h3></div>')
      .replace(/• (.*)/g, '<div class="bullet-point"><span class="bullet-icon">•</span><span class="bullet-text">$1</span></div>')
      .replace(/\*Note:(.*)\*/g, '<div class="disclaimer-note"><div class="note-icon-wrapper"><FaInfoCircle class="note-icon"/></div><em class="note-text">$1</em></div>')
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n/g, '<br>');
  };

  if (!isVisible) return null;

  return (
    <motion.div 
      className="medical-explanation-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className="medical-explanation-modal"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
      >
        <div className="modal-header">
          <div className="header-content">
            <FaRobot className="ai-icon" />
            <div>
              <h2>AI Medical Analysis</h2>
              <p>Diagnosis: <strong>{diagnosis}</strong> ({confidence}% confidence)</p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-content">
          {loading && (
            <div className="loading-state">
              <FaSpinner className="loading-spinner" />
              <p>Generating medical analysis...</p>
            </div>
          )}

          {error && (
            <div className="error-state">
              <FaExclamationTriangle className="error-icon" />
              <p>Using offline medical database: {error}</p>
            </div>
          )}

          {explanation && !loading && (
            <div className="explanation-content">
              <div className="content-icons">
                <FaStethoscope className="content-icon" />
                <FaEye className="content-icon" />
                <FaPills className="content-icon" />
              </div>
              
              <div 
                className="formatted-explanation concise-format"
                dangerouslySetInnerHTML={{ __html: formatExplanation(explanation) }}
              />
              
              <div className="disclaimer-footer">
                <FaInfoCircle className="info-icon" />
                <p><strong>Medical Disclaimer:</strong> This AI-generated information is for educational purposes only. Always consult with a qualified healthcare professional for medical advice, diagnosis, and treatment decisions.</p>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="action-btn secondary" onClick={onClose}>
            Close
          </button>
          <button className="action-btn primary" onClick={generateExplanation} disabled={loading}>
            {loading ? 'Generating...' : 'Regenerate Analysis'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default MedicalExplanation;
