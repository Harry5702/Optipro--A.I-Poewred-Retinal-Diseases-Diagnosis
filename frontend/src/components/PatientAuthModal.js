import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaTimes, FaUser, FaEnvelope, FaLock, FaPhone, FaUserPlus, FaSignInAlt } from 'react-icons/fa';
import toast from 'react-hot-toast';
import './PatientAuthModal.css';

const PatientAuthModal = ({ closeModal, onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    age: '',
    gender: '',
    address: '',
    medicalHistory: '',
    emergencyContact: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      toast.error('Email and password are required');
      return false;
    }

    if (!validateEmail(formData.email)) {
      toast.error('Please enter a valid email address');
      return false;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return false;
    }

    if (!isLogin) {
      if (!formData.fullName) {
        toast.error('Full name is required for registration');
        return false;
      }

      if (formData.password !== formData.confirmPassword) {
        toast.error('Passwords do not match');
        return false;
      }
    }

    return true;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Get existing patient users from localStorage
      const existingPatients = JSON.parse(localStorage.getItem('patientUsers') || '[]');
      
      // Find user with matching email and password
      const user = existingPatients.find(
        p => p.email === formData.email && p.password === formData.password
      );

      if (user) {
        // Store current patient session
        localStorage.setItem('currentPatient', JSON.stringify(user));
        toast.success('Login successful!');
        onLoginSuccess(user);
        closeModal();
      } else {
        toast.error('Invalid email or password');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Get existing patient users from localStorage
      const existingPatients = JSON.parse(localStorage.getItem('patientUsers') || '[]');
      
      // Check if email already exists
      const existingUser = existingPatients.find(p => p.email === formData.email);
      if (existingUser) {
        toast.error('An account with this email already exists');
        setIsLoading(false);
        return;
      }

      // Create new patient user
      const newPatient = {
        id: `patient-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password, // In production, this should be hashed
        phone: formData.phone,
        age: formData.age ? parseInt(formData.age) : null,
        gender: formData.gender,
        address: formData.address,
        medicalHistory: formData.medicalHistory,
        emergencyContact: formData.emergencyContact,
        createdAt: new Date().toISOString()
      };

      // Save to localStorage
      existingPatients.push(newPatient);
      localStorage.setItem('patientUsers', JSON.stringify(existingPatients));

      toast.success('Registration successful! Please login with your credentials.');
      
      // Clear form and switch to login mode
      setFormData({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        age: '',
        gender: '',
        address: '',
        medicalHistory: '',
        emergencyContact: ''
      });
      setIsLogin(true);
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isLogin) {
      handleLogin();
    } else {
      handleRegister();
    }
  };

  return (
    <div className="patient-auth-modal-overlay" onClick={(e) => e.target === e.currentTarget && closeModal()}>
      <motion.div
        className="patient-auth-modal"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ duration: 0.3 }}
      >
        <div className="patient-auth-header">
          <h2>
            {isLogin ? <FaSignInAlt /> : <FaUserPlus />}
            {isLogin ? 'Patient Login' : 'Patient Registration'}
          </h2>
          <button 
            className="close-btn" 
            onClick={closeModal}
            disabled={isLoading}
          >
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="patient-auth-form">
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="fullName">
                <FaUser /> Full Name
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                placeholder="Enter your full name"
                required={!isLogin}
                disabled={isLoading}
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">
              <FaEnvelope /> Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Enter your email"
              required
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">
              <FaLock /> Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Enter your password"
              required
              disabled={isLoading}
              minLength={6}
            />
          </div>

          {!isLogin && (
            <>
              <div className="form-group">
                <label htmlFor="confirmPassword">
                  <FaLock /> Confirm Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirm your password"
                  required
                  disabled={isLoading}
                  minLength={6}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="phone">
                    <FaPhone /> Phone
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Your phone number"
                    disabled={isLoading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="age">Age</label>
                  <input
                    type="number"
                    id="age"
                    name="age"
                    value={formData.age}
                    onChange={handleInputChange}
                    placeholder="Your age"
                    min="1"
                    max="120"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="gender">Gender</label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  disabled={isLoading}
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer-not-to-say">Prefer not to say</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="address">Address</label>
                <textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Your address"
                  rows="2"
                  disabled={isLoading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="medicalHistory">Medical History</label>
                <textarea
                  id="medicalHistory"
                  name="medicalHistory"
                  value={formData.medicalHistory}
                  onChange={handleInputChange}
                  placeholder="Any relevant medical history"
                  rows="3"
                  disabled={isLoading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="emergencyContact">Emergency Contact</label>
                <input
                  type="text"
                  id="emergencyContact"
                  name="emergencyContact"
                  value={formData.emergencyContact}
                  onChange={handleInputChange}
                  placeholder="Emergency contact person and phone"
                  disabled={isLoading}
                />
              </div>
            </>
          )}

          <button 
            type="submit" 
            className="submit-btn"
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : (isLogin ? 'Login' : 'Register')}
          </button>

          <div className="auth-switch">
            {isLogin ? (
              <p>
                Don't have an account?{' '}
                <button 
                  type="button" 
                  onClick={() => setIsLogin(false)}
                  disabled={isLoading}
                >
                  Sign up here
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button 
                  type="button" 
                  onClick={() => setIsLogin(true)}
                  disabled={isLoading}
                >
                  Sign in here
                </button>
              </p>
            )}
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default PatientAuthModal;