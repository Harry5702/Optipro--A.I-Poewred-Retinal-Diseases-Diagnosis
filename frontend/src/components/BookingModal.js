import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PatientAuthModal from './PatientAuthModal';

const BookingModal = ({ closeModal }) => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if patient is already logged in
    const savedPatient = localStorage.getItem('currentPatient');
    if (savedPatient) {
      // If patient is already logged in, navigate directly to patient portal
      closeModal();
      navigate('/patient-portal');
    }
  }, [navigate, closeModal]);

  const handleLoginSuccess = (patient) => {
    closeModal();
    navigate('/patient-portal');
  };

  return (
    <PatientAuthModal 
      closeModal={closeModal}
      onLoginSuccess={handleLoginSuccess}
    />
  );
};

export default BookingModal;