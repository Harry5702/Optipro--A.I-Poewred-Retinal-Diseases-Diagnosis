import React, { useContext } from 'react';
import { motion } from 'framer-motion';
import { FaEye, FaBrain, FaChartLine, FaLaptopMedical } from 'react-icons/fa';
import { ThemeContext } from '../App';
import Hero from '../components/Hero';
import FeatureCard from '../components/FeatureCard';
import TestimonialSlider from '../components/TestimonialSlider';
import './Home.css';

const Home = () => {
  const { darkMode } = useContext(ThemeContext);
  
  const features = [
    {
      icon: <FaEye />,
      title: 'Advanced Eye Scanning',
      description: 'Upload retinal images for immediate analysis using our cutting-edge AI detection technology.',
    },
    {
      icon: <FaBrain />,
      title: 'AI-Powered Detection',
      description: 'Our deep learning algorithms can identify CNV, DME, Drusen, and other eye conditions with high accuracy.',
    },
    {
      icon: <FaChartLine />,
      title: 'Detailed Analytics',
      description: 'Receive comprehensive reports with confidence scores and visual heatmaps highlighting affected areas.',
    },
    {
      icon: <FaLaptopMedical />,
      title: 'Telemedicine Ready',
      description: 'Easily share results with healthcare providers for timely consultation and treatment planning.',
    },
  ];
  
  return (
    <div className={`home ${darkMode ? 'dark' : 'light'}`}>
      <Hero />
      
      <section className="info-section">
        <div className="container">
          <motion.div 
            className="section-header"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="section-title">About OptiPro</h2>
            <div className="section-subtitle">Revolutionizing Eye Disease Detection</div>
          </motion.div>
          
          <motion.div 
            className="about-content"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <p>
              OptiPro is an innovative AI-powered platform designed to assist healthcare professionals in early detection and diagnosis of retinal diseases. 
              Our technology can detect conditions like Choroidal Neovascularization (CNV), Diabetic Macular Edema (DME), and Drusen, providing crucial insights 
              through advanced visualization and analysis.
            </p>
            <p>
              By combining deep learning algorithms with medical expertise, OptiPro delivers unprecedented accuracy in identifying subtle patterns and anomalies 
              that might be missed in conventional examinations, potentially saving sight through early intervention.
            </p>
          </motion.div>
        </div>
      </section>
      
      <section className="features-section">
        <div className="container">
          <motion.div 
            className="section-header"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="section-title">Features</h2>
            <div className="section-subtitle">Why Choose OptiPro</div>
          </motion.div>
          
          <div className="features-grid">
            {features.map((feature, index) => (
              <FeatureCard 
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                delay={index * 0.1}
              />
            ))}
          </div>
        </div>
      </section>
      
      <TestimonialSlider />
      
      <section className="cta-section">
        <div className="container">
          <motion.div 
            className="cta-content"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2>Ready to Experience the Future of Eye Care?</h2>
            <p>
              Try OptiPro today and see the difference our technology can make in detecting eye diseases early.
            </p>
            <button className="cta-button" onClick={() => window.location.href = '/scan'}>
              Start Scanning Now
            </button>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home; 