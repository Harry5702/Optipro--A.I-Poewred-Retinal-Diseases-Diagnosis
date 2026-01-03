import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PatientPortal from './PatientPortal';
import PatientAuthModal from '../components/PatientAuthModal';

const PatientPortalPage = () => {
  const [currentPatient, setCurrentPatient] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if patient is already logged in
    const savedPatient = localStorage.getItem('currentPatient');
    if (savedPatient) {
      try {
        setCurrentPatient(JSON.parse(savedPatient));
      } catch (error) {
        console.error('Error parsing saved patient:', error);
        localStorage.removeItem('currentPatient');
        setShowAuth(true);
      }
    } else {
      setShowAuth(true);
    }
  }, []);

  const handleLoginSuccess = (patient) => {
    setCurrentPatient(patient);
    setShowAuth(false);
  };

  const handleClose = () => {
    navigate('/');
  };

  if (showAuth) {
    return (
      <PatientAuthModal 
        closeModal={handleClose}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  if (currentPatient) {
    return (
      <div style={{ minHeight: '100vh', paddingTop: '80px' }}>
        <PatientPortal
          closeModal={handleClose}
          patient={currentPatient}
          isFullPage={true}
        />
      </div>
    );
  }

  return null;
};

export default PatientPortalPage;