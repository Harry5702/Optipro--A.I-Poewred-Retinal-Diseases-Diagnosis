import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ThemeContext } from '../App';
import './Hero.css';

const Hero = () => {
  const { darkMode } = useContext(ThemeContext);
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: "easeOut"
      }
    }
  };

  return (
    <div className={`hero ${darkMode ? 'dark' : 'light'}`}>
      <motion.div 
        className="hero-content"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.h1 variants={itemVariants} className="hero-title">
          Advanced Eye Disease Detection
        </motion.h1>
        
        <motion.div variants={itemVariants} className="hero-description">
          <p>
            OptiPro uses AI-powered technology to detect and analyze 
            various eye conditions, helping healthcare professionals 
            diagnose and treat eye diseases with greater accuracy and efficiency.
          </p>
        </motion.div>
        
        <motion.div variants={itemVariants} className="hero-buttons">
          <button 
            className="hero-btn primary"
            onClick={() => navigate('/scan')}
          >
            Start Scanning
          </button>
          <button 
            className="hero-btn secondary"
            onClick={() => navigate('/contact')}
          >
            Learn More
          </button>
        </motion.div>
      </motion.div>
      
      <motion.div 
        className="hero-image-container"
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.5 }}
      >
        <div className="hero-image">
          <div className="floating-icon icon-1">
            <span className="icon-pulse"></span>
          </div>
          <div className="floating-icon icon-2">
            <span className="icon-pulse"></span>
          </div>
          <div className="floating-icon icon-3">
            <span className="icon-pulse"></span>
          </div>
          <img 
            src="/eye-scan.svg" 
            alt="Eye Scanning Technology" 
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "https://via.placeholder.com/500x400?text=Eye+Scanning+Technology";
            }}
          />
        </div>
      </motion.div>
    </div>
  );
};

export default Hero; 