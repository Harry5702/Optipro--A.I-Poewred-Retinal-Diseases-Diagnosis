import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaUser, FaLock, FaEnvelope, FaUserPlus, FaSignInAlt, FaStethoscope, FaIdCard } from 'react-icons/fa';
import { ThemeContext } from '../App';
import { supabase, supabaseHelpers } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import toast, { Toaster } from 'react-hot-toast';
import './AuthModal.css';

// Create auth context
export const AuthContext = React.createContext();

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  React.useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setCurrentUser(JSON.parse(userData));
      setIsAuthenticated(true);
    }
    setAuthLoading(false);
  }, []);

  // Supabase-integrated login
  const login = async (email, password) => {
    try {
      const { data, error } = await supabaseHelpers.loginDoctor(email, password);
      
      if (error || !data) {
        return { success: false, error: 'Invalid email or password' };
      }
      
      const user = { 
        id: data.id,
        name: data.full_name, 
        email: data.email,
        specialization: data.specialization,
        license_number: data.license_number
      };
      
      localStorage.setItem('user', JSON.stringify(user));
      setCurrentUser(user);
      setIsAuthenticated(true);
      toast.success('Login successful!');
      return { success: true, user };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Login failed. Please try again.' };
    }
  };

  // Supabase-integrated register
  const register = async (doctorData) => {
    try {
      console.log('Starting registration process...');
      console.log('Doctor data:', { ...doctorData, password: '[REDACTED]' });
      
      // Test Supabase connection first
      console.log('Testing Supabase connection...');
      const connectionTest = await supabase.from('doctors').select('count').limit(1);
      console.log('Connection test result:', connectionTest);
      
      if (connectionTest.error) {
        console.error('Supabase connection failed:', connectionTest.error);
        return { success: false, error: `Database connection failed: ${connectionTest.error.message}` };
      }
      
      // Check if email already exists
      console.log('Checking if email exists...');
      const { data: existingDoctor, error: checkError } = await supabaseHelpers.getDoctorByEmail(doctorData.email);
      
      if (checkError) {
        console.error('Error checking existing email:', checkError);
        return { success: false, error: `Database query failed: ${checkError.message}` };
      }
      
      if (existingDoctor) {
        console.log('Email already exists:', existingDoctor);
        return { success: false, error: 'Email already registered' };
      }

      console.log('Email is available, proceeding with registration...');

      const newDoctor = {
        id: uuidv4(),
        full_name: doctorData.name,
        email: doctorData.email,
        password: doctorData.password, // In production, hash this password
        specialization: doctorData.specialization,
        license_number: doctorData.license_number,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('Creating doctor record with data:', { ...newDoctor, password: '[REDACTED]' });
      const { data, error } = await supabaseHelpers.createDoctor(newDoctor);
      
      if (error) {
        console.error('Registration error details:', {
          error,
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        return { success: false, error: `Registration failed: ${error.message}` };
      }

      if (!data) {
        console.error('No data returned from doctor creation');
        return { success: false, error: 'Registration failed: No data returned' };
      }

      console.log('Registration successful! Doctor created:', { ...data, password: '[REDACTED]' });
      toast.success('Account created successfully!');
      return { success: true, user: { id: data.id, name: data.full_name, email: data.email } };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Registration failed. Please try again.' };
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    setCurrentUser(null);
    setIsAuthenticated(false);
    toast.success('Logged out successfully');
    // Navigate to home page after logout
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{ currentUser, isAuthenticated, authLoading, login, register, logout }}>
      <Toaster position="top-right" />
      {children}
    </AuthContext.Provider>
  );
};

const AuthModal = ({ closeModal }) => {
  const { darkMode } = useContext(ThemeContext);
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    specialization: '',
    license_number: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const { login, register } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    if (isLogin) {
      if (!formData.email || !formData.password) {
        setError('Please fill in all fields');
        setIsLoading(false);
        return;
      }
      const result = await login(formData.email, formData.password);
      if (result.success) {
        setIsLoading(false);
        setSuccess('Login successful! Redirecting to doctor panel...');
        setTimeout(() => {
          navigate('/doctor-panel');
          closeModal();
        }, 1000);
      } else {
        setIsLoading(false);
        setError(result.error);
      }
    } else {
      if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword || !formData.specialization || !formData.license_number) {
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
      const result = await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        specialization: formData.specialization,
        license_number: formData.license_number
      });
      if (result.success) {
        setIsLoading(false);
        setSuccess('Account created successfully! Please login.');
        setTimeout(() => {
          setIsLogin(true);
          setSuccess('');
          setFormData({
            name: '',
            email: '',
            password: '',
            confirmPassword: '',
            specialization: '',
            license_number: '',
          });
        }, 1500);
      } else {
        setIsLoading(false);
        setError(result.error);
      }
    }
  };

  return (
    <div className={`auth-modal ${darkMode ? 'dark' : 'light'}`}>
      <div className="modal-header">
        <button className="close-button" onClick={closeModal}>&times;</button>
      </div>
      <div className="auth-card-container">
        <motion.div className="auth-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="auth-header">
            {isLogin ? (
              <>
                <FaSignInAlt className="auth-icon" />
                <h2>Login to OptiPro</h2>
                <p>Enter your credentials to access your account</p>
              </>
            ) : (
              <>
                <FaUserPlus className="auth-icon" />
                <h2>Create an Account</h2>
                <p>Sign up to access OptiPro's advanced eye disease detection</p>
              </>
            )}
          </div>

          <div className="auth-tabs">
            <button className={`auth-tab ${isLogin ? 'active' : ''}`} onClick={() => setIsLogin(true)}>Login</button>
            <button className={`auth-tab ${!isLogin ? 'active' : ''}`} onClick={() => setIsLogin(false)}>Sign Up</button>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {!isLogin && (
              <>
                <div className="form-group">
                  <label>
                    <FaUser />
                    <span>Full Name</span>
                  </label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Enter your full name" required={!isLogin} />
                </div>

                <div className="form-group">
                  <label>
                    <FaStethoscope />
                    <span>Specialization</span>
                  </label>
                  <select name="specialization" value={formData.specialization} onChange={handleChange} required={!isLogin}>
                    <option value="">Select your specialization</option>
                    <option value="Ophthalmologist">Ophthalmologist</option>
                    <option value="Retinal Specialist">Retinal Specialist</option>
                    <option value="General Practitioner">General Practitioner</option>
                    <option value="Optometrist">Optometrist</option>
                    <option value="Neurologist">Neurologist</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>
                    <FaIdCard />
                    <span>License Number</span>
                  </label>
                  <input type="text" name="license_number" value={formData.license_number} onChange={handleChange} placeholder="Enter your medical license number" required={!isLogin} />
                </div>
              </>
            )}

            <div className="form-group">
              <label>
                <FaEnvelope />
                <span>Email</span>
              </label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Enter your email" required />
            </div>

            <div className="form-group">
              <label>
                <FaLock />
                <span>Password</span>
              </label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder={isLogin ? 'Enter your password' : 'Create a password'} required />
            </div>

            {!isLogin && (
              <div className="form-group">
                <label>
                  <FaLock />
                  <span>Confirm Password</span>
                </label>
                <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Confirm your password" required={!isLogin} />
              </div>
            )}

            <div className="form-options">
              {isLogin ? (
                <>
                  <div className="checkbox-container">
                    <input type="checkbox" id="remember" />
                    <label htmlFor="remember">Remember me</label>
                  </div>
                  <Link to="/" className="forgot-password">Forgot Password?</Link>
                </>
              ) : (
                <div className="checkbox-container">
                  <input type="checkbox" id="terms" required={!isLogin} />
                  <label htmlFor="terms">I agree to the <Link to="/">Terms of Service</Link></label>
                </div>
              )}
            </div>

            {error && <div className="auth-error">{error}</div>}
            {success && <div className="auth-success">{success}</div>}

            <button type="submit" className="auth-button" disabled={isLoading}>
              {isLoading ? (isLogin ? 'Logging in...' : 'Creating Account...') : (isLogin ? 'Login' : 'Sign Up')}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default AuthModal;