import React, { useContext } from 'react';
import { motion } from 'framer-motion';
import { ThemeContext } from '../App';
import './FeatureCard.css';

const FeatureCard = ({ icon, title, description, delay = 0 }) => {
  const { darkMode } = useContext(ThemeContext);
  
  return (
    <motion.div 
      className={`feature-card ${darkMode ? 'dark' : 'light'}`}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      viewport={{ once: true, margin: "-100px" }}
    >
      <div className="feature-icon">
        {icon}
      </div>
      <h3 className="feature-title">{title}</h3>
      <p className="feature-description">{description}</p>
    </motion.div>
  );
};

export default FeatureCard; 