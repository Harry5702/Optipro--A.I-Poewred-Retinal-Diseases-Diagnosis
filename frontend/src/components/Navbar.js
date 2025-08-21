import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaSun, FaMoon, FaBars, FaTimes } from 'react-icons/fa';
import { ThemeContext } from '../App';
import './Navbar.css';
import AuthModal, { AuthContext } from './AuthModal';

const Navbar = () => {
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);
  const { isAuthenticated } = useContext(AuthContext);
  const [isOpen, setIsOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const navigate = useNavigate();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <nav className={`navbar ${darkMode ? 'dark' : 'light'}`}>
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          OptiPro
        </Link>
        
        <div className="menu-icon" onClick={toggleMenu}>
          {isOpen ? <FaTimes /> : <FaBars />}
        </div>
        
        <ul className={isOpen ? 'nav-menu active' : 'nav-menu'}>
          <li className="nav-item">
            <Link to="/" className="nav-link" onClick={() => setIsOpen(false)}>
              Home
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/scan" className="nav-link" onClick={() => setIsOpen(false)}>
              Scan Now
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/contact" className="nav-link" onClick={() => setIsOpen(false)}>
              Contact Us
            </Link>
          </li>
        </ul>
        
        <div className="navbar-buttons">
          <button className="theme-toggle" onClick={toggleDarkMode}>
            {darkMode ? <FaSun /> : <FaMoon />}
          </button>
          
          <div className="auth-buttons">
            <button 
              className="btn-auth" 
              onClick={() => isAuthenticated ? navigate('/doctor-panel') : setShowAuthModal(true)}
            >
              <span>Doctor's Panel</span>
            </button>
          </div>
          
          {showAuthModal && (
            <div className="modal-overlay" onClick={() => setShowAuthModal(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <AuthModal closeModal={() => setShowAuthModal(false)} />
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;