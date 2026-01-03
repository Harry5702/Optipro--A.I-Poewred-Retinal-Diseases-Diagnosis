import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Page Components
import Home from './pages/Home';
import ScanNow from './pages/ScanNow';
import ContactUs from './pages/ContactUs';
import DoctorPanel from './pages/DoctorPanel';
import PatientPortalPage from './pages/PatientPortalPage';

// Layout Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import { AuthProvider } from './components/AuthModal';

// Theme context
export const ThemeContext = React.createContext();

function App() {
  // Always start with light mode
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Set light mode in localStorage to ensure consistency
    localStorage.setItem('darkMode', 'false');
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', String(newDarkMode));
  };

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      <div className={`app ${darkMode ? 'dark-mode' : 'light-mode'}`}>
        <Router>
          <AuthProvider>
            <ScrollToTop />
            <Navbar />
            <div className="content">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/scan" element={<ScanNow />} />
                <Route path="/contact" element={<ContactUs />} />
                <Route path="/doctor-panel" element={<DoctorPanel />} />
                <Route path="/patient-portal" element={<PatientPortalPage />} />
              </Routes>
            </div>
            <Footer />
          </AuthProvider>
        </Router>
      </div>
    </ThemeContext.Provider>
  );
}

export default App;
