import React, { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { FaPhone, FaEnvelope, FaMapMarkerAlt, FaBuilding } from 'react-icons/fa';
import { ThemeContext } from '../App';
import './ContactUs.css';

const ContactUs = () => {
  const { darkMode } = useContext(ThemeContext);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    // Validate form
    if (!formData.name || !formData.email || !formData.message) {
      setError('Please fill in all required fields');
      setIsSubmitting(false);
      return;
    }
    
    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitSuccess(true);
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
      });
      
      // Reset success message after 5 seconds
      setTimeout(() => {
        setSubmitSuccess(false);
      }, 5000);
    }, 1500);
  };
  
  const contactInfo = [
    {
      icon: <FaPhone />,
      title: 'Phone',
      details: '+1 (555) 123-4567',
    },
    {
      icon: <FaEnvelope />,
      title: 'Email',
      details: 'contact@optipro.com',
    },
    {
      icon: <FaMapMarkerAlt />,
      title: 'Address',
      details: '123 Medical Center Dr, Healthcare City',
    },
    {
      icon: <FaBuilding />,
      title: 'Business Hours',
      details: 'Monday - Friday: 9am - 5pm',
    },
  ];
  
  return (
    <div className={`contact-us ${darkMode ? 'dark' : 'light'}`}>
      <div className="container">
        <motion.div 
          className="contact-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="contact-title">Contact Us</h1>
          <p className="contact-subtitle">
            Have questions about OptiPro? We're here to help! Reach out to our team through any of the channels below.
          </p>
        </motion.div>
        
        <div className="contact-content">
          <motion.div 
            className="contact-form-container"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2>Send Us a Message</h2>
            <form className="contact-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Your Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="email">Your Email *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="subject">Subject</label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="message">Your Message *</label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows="6"
                  required
                ></textarea>
              </div>
              
              {error && <div className="error-message">{error}</div>}
              {submitSuccess && (
                <div className="success-message">
                  Your message has been sent successfully. We'll get back to you soon!
                </div>
              )}
              
              <button
                type="submit"
                className="submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </motion.div>
          
          <motion.div 
            className="contact-info"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2>Contact Information</h2>
            <div className="info-container">
              {contactInfo.map((info, index) => (
                <div className="info-item" key={index}>
                  <div className="info-icon">{info.icon}</div>
                  <div className="info-content">
                    <h3>{info.title}</h3>
                    <p>{info.details}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="map-container">
              <iframe
                title="OptiPro Location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.1212423084017!2d-75.1651!3d39.9522!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMznCsDU3JzA3LjkiTiA3NcKwMDknNTQuNCJX!5e0!3m2!1sen!2sus!4v1620419123456!5m2!1sen!2sus"
                width="100%"
                height="250"
                style={{ border: 0, borderRadius: '8px' }}
                allowFullScreen=""
                loading="lazy"
              ></iframe>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ContactUs; 