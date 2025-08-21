import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaUser, FaLock, FaSignInAlt } from 'react-icons/fa';
import { ThemeContext } from '../App';
import './AuthForms.css';

const Login = () => {
  const { darkMode } = useContext(ThemeContext);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
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
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      setIsLoading(false);
      return;
    }
    
    // Simulate login request
    setTimeout(() => {
      setIsLoading(false);
      
      // For demo purposes only, in a real app this would be an API call
      if (formData.email === 'demo@example.com' && formData.password === 'password') {
        navigate('/');
      } else {
        setError('Invalid email or password');
      }
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
            <FaSignInAlt className="auth-icon" />
            <h2>Login to OptiPro</h2>
            <p>Enter your credentials to access your account</p>
          </div>
          
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group input-icon-group">
              <span className="input-icon"><FaUser /></span>
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
                placeholder="Enter your password"
                required
              />
            </div>
            
            <div className="form-options">
              <div className="checkbox-container">
                <input type="checkbox" id="remember" />
                <label htmlFor="remember">Remember me</label>
              </div>
              <Link to="/" className="forgot-password">Forgot Password?</Link>
            </div>
            
            {error && <div className="auth-error">{error}</div>}
            
            <button
              type="submit"
              className="auth-button"
              disabled={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
            
            <div className="auth-footer">
              <p>
                Don't have an account? <Link to="/signup">Sign Up</Link>
              </p>
            </div>
          </form>
          
          <div className="demo-credentials">
            <p>Demo Credentials:</p>
            <p>Email: demo@example.com</p>
            <p>Password: password</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login; 