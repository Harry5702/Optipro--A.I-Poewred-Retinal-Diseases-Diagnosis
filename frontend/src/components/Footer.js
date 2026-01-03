import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from 'react-icons/fa';
import { ThemeContext } from '../App';
import './Footer.css';

const Footer = () => {
  const { darkMode } = useContext(ThemeContext);
  
  return (
    <footer className={`footer ${darkMode ? 'dark' : 'light'}`}>
      <div className="footer-container">
        <div className="footer-row">
          <div className="footer-col">
            <h3>OptiPro</h3>
            <p>
              Advanced eye disease detection powered by AI technology to provide
              early diagnosis and treatment recommendations.
            </p>
          </div>
          
          <div className="footer-col">
            <h3>Quick Links</h3>
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/scan">Scan Now</Link></li>
              <li><Link to="/contact">Contact Us</Link></li>
            </ul>
          </div>
          
          <div className="footer-col">
            <h3>Contact Info</h3>
            <ul className="contact-info">
              <li>Bahria University Islamabad</li>
              <li>contact@optipro.com</li>
              <li>+1 (555) 123-4567</li>
            </ul>
          </div>
          
          <div className="footer-col">
            <h3>Follow Us</h3>
            <div className="social-links">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
                <FaFacebook />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
                <FaTwitter />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
                <FaInstagram />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
                <FaLinkedin />
              </a>
            </div>
          </div>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} OptiPro. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer; 