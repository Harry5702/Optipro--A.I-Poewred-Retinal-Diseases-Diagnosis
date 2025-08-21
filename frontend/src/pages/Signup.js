import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaUser, FaLock, FaEnvelope, FaUserPlus } from 'react-icons/fa';
import { ThemeContext } from '../App';
import './AuthForms.css';

const Signup = () => {
  const { darkMode } = useContext(ThemeContext);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
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
    setIsLoading(true);
    setError('');
    
    // Validate form
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all fields');
      setIsLoading(false);
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }
    
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setIsLoading(false);
      return;
    }
    
    // Simulate signup request
    setTimeout(() => {
      setIsLoading(false);
      navigate('/login');
    }, 1500);
  };
  
  return (
    <div className={`auth-container ${darkMode ? 'dark' : 'light'}`}>
      <div className="container">
        <motion.div 
          className="auth-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="auth-header">
            <FaUserPlus className="auth-icon" />
            <h2>Create an Account</h2>
            <p>Sign up to access OptiPro's advanced eye disease detection</p>
          </div>
          
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group input-icon-group">
              <span className="input-icon"><FaUser /></span>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                required
              />
            </div>
            
            <div className="form-group input-icon-group">
              <span className="input-icon"><FaEnvelope /></span>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
              />
            </div>
            
            <div className="form-group input-icon-group">
              <span className="input-icon"><FaLock /></span>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a password"
                required
              />
            </div>
            
            <div className="form-group input-icon-group">
              <span className="input-icon"><FaLock /></span>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                required
              />
            </div>
            
            <div className="form-options">
              <div className="checkbox-container">
                <input type="checkbox" id="terms" required />
                <label htmlFor="terms">I agree to the <Link to="/">Terms of Service</Link></label>
              </div>
            </div>
            
            {error && <div className="auth-error">{error}</div>}
            
            <button
              type="submit"
              className="auth-button"
              disabled={isLoading}
            >
              {isLoading ? 'Creating Account...' : 'Sign Up'}
            </button>
            
            <div className="auth-footer">
              <p>
                Already have an account? <Link to="/login">Login</Link>
              </p>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default Signup; 