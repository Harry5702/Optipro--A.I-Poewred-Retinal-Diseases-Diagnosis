import React, { useContext } from 'react';
import { motion } from 'framer-motion';
import { FaEye, FaBrain, FaInfoCircle, FaChartBar } from 'react-icons/fa';
import { ThemeContext } from '../App';
import ImageUploader from '../components/ImageUploader';
import './ScanNow.css';

const ScanNow = () => {
  const { darkMode } = useContext(ThemeContext);
  
  return (
    <div className={`scan-now ${darkMode ? 'dark' : 'light'}`}>
      <div className="container">
        <motion.div 
          className="scan-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="scan-title">AI Eye Disease Detection</h1>
          <p className="scan-subtitle">
            Upload your retinal images for instant AI-powered analysis and get detailed results with heatmap visualization.
          </p>
        </motion.div>
        
        <div className="scan-steps">
          <motion.div 
            className="step-card"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="step-number">1</div>
            <div className="step-icon">
              <FaEye />
            </div>
            <h3>Upload Image</h3>
            <p>Select a high-quality retinal scan image from your device</p>
          </motion.div>
          
          <motion.div 
            className="step-card"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="step-number">2</div>
            <div className="step-icon">
              <FaBrain />
            </div>
            <h3>AI Analysis</h3>
            <p>Our deep learning model instantly analyzes the retinal image</p>
          </motion.div>
          
          <motion.div 
            className="step-card"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <div className="step-number">3</div>
            <div className="step-icon">
              <FaChartBar />
            </div>
            <h3>View Results</h3>
            <p>Get diagnosis with confidence score, heatmap visualization and metrics</p>
          </motion.div>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="uploader-container"
        >
          <div className="uploader-header">
            <h2><FaEye className="uploader-icon" /> Scan Your Retina</h2>
            <p>Upload your image below to receive instant AI-based analysis</p>
          </div>
          <ImageUploader />
        </motion.div>
        
        <motion.div 
          className="scan-features"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1 }}
        >
          <h3><span>Key Features</span></h3>
          
          <div className="features-grid">
            <div className="feature-item">
              <FaInfoCircle className="feature-icon" />
              <h4>Advanced Detection</h4>
              <p>Detects CNV, DME, Drusen, and normal retinas with high accuracy</p>
            </div>
            
            <div className="feature-item">
              <FaInfoCircle className="feature-icon" />
              <h4>Heatmap Visualization</h4>
              <p>Visual highlighting of affected areas using Grad-CAM technology</p>
            </div>
            
            <div className="feature-item">
              <FaInfoCircle className="feature-icon" />
              <h4>Performance Metrics</h4>
              <p>View model's confidence and confusion matrix analytics</p>
            </div>
            
            <div className="feature-item">
              <FaInfoCircle className="feature-icon" />
              <h4>Quick Analysis</h4>
              <p>Results in seconds with detailed explanation of findings</p>
            </div>
          </div>
        </motion.div>
        
        <motion.div 
          className="scan-disclaimer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1 }}
        >
          <h3>Important Disclaimer</h3>
          <p>
            The OptiPro AI detection system is designed to assist healthcare professionals in identifying potential eye diseases, 
            but it is not a substitute for professional medical advice, diagnosis, or treatment. 
            Always consult with a qualified healthcare provider for any medical concerns.
          </p>
        </motion.div>
        
        <motion.div 
          className="scan-faq"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1.2 }}
        >
          <h3>Frequently Asked Questions</h3>
          
          <div className="faq-items">
            <div className="faq-item">
              <h4>What types of eye diseases can OptiPro detect?</h4>
              <p>
                OptiPro can detect Choroidal Neovascularization (CNV), Diabetic Macular Edema (DME), Drusen (early signs of Age-related Macular Degeneration), 
                and distinguish normal retinas.
              </p>
            </div>
            
            <div className="faq-item">
              <h4>How accurate is the AI detection?</h4>
              <p>
                OptiPro's AI has been trained on thousands of retinal images and validated by ophthalmologists. 
                While it achieves high accuracy, it's designed to be a supportive tool for healthcare professionals, not a replacement for clinical expertise.
              </p>
            </div>
            
            <div className="faq-item">
              <h4>What image formats are supported?</h4>
              <p>
                OptiPro supports common image formats including JPG, PNG, and TIFF. For best results, use high-resolution 
                retinal scan images with clear visibility of the retina.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ScanNow; 