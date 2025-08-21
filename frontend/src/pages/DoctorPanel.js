import React, { useContext, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaUser, FaUserPlus, FaEye, FaSearch, FaTrash,
  FaBirthdayCake, FaPhone, FaEnvelope, FaEdit,
  FaFileImage, FaChartLine, FaStethoscope
} from 'react-icons/fa';
import { AuthContext } from '../components/AuthModal';
import { ThemeContext } from '../App';
import { supabaseHelpers } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';
import './DoctorPanel.css';
import ImageUploader from '../components/ImageUploader';
import EnhancedMedicalAnalysis from '../components/EnhancedMedicalAnalysis';
import { generatePatientReport } from '../services/pdfService';

const DoctorPanel = () => {
  const { currentUser, logout } = useContext(AuthContext);
  const { darkMode } = useContext(ThemeContext);
  const [activeView, setActiveView] = useState('dashboard');
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  // Separate loading flag for the Add Patient form to avoid blocking on global refreshes
  const [isAddingPatient, setIsAddingPatient] = useState(false);
  const [patientScans, setPatientScans] = useState([]);
  const [showDetailedRecord, setShowDetailedRecord] = useState(false);
  const [selectedScan, setSelectedScan] = useState(null);
  const [doctorStats, setDoctorStats] = useState({
    total_patients: 0,
    total_scans: 0,
    recent_analysis: 0,
    scan_distribution: { CNV: 0, DME: 0, DRUSEN: 0, NORMAL: 0 }
  });

  const [newPatient, setNewPatient] = useState({
    name: '',
    email: '',
    phone: '',
    age: '',
    gender: '',
    address: '',
    medical_history: '',
    emergency_contact: ''
  });

  //
  // handleAddPatient is the only add flow; keep this single source of truth
  //

  const handleAddPatient = async (e) => {
    console.log('handleAddPatient called - Form submitted successfully!');
    
    if (!currentUser?.id) {
      toast.error('User not authenticated');
      return;
    }

    // Validate required fields
    if (!newPatient.name || !newPatient.email || !newPatient.age || !newPatient.gender) {
      toast.error('Please fill in all required fields');
      return;
    }

  setIsAddingPatient(true);
    console.log('Starting patient creation...', { newPatient, currentUser: currentUser.id });
    
    try {
      const patientData = {
        id: uuidv4(),
        doctor_id: currentUser.id,
        full_name: newPatient.name,
        email: newPatient.email,
        phone: newPatient.phone,
        age: parseInt(newPatient.age),
        gender: newPatient.gender,
        address: newPatient.address,
        medical_history: newPatient.medical_history,
        emergency_contact: newPatient.emergency_contact,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('Adding patient with data:', patientData);
      
      // Check if Supabase is properly configured
      const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
      console.log('Supabase URL check:', supabaseUrl);
      
      if (!supabaseUrl || supabaseUrl === 'YOUR_SUPABASE_URL') {
        console.warn('Supabase not configured, using local storage fallback');
        
        // Local storage fallback for development
        const localPatients = JSON.parse(localStorage.getItem('localPatients') || '[]');
        const newLocalPatient = { ...patientData, id: Date.now().toString() };
        localPatients.unshift(newLocalPatient);
        localStorage.setItem('localPatients', JSON.stringify(localPatients));
        
        toast.success('Patient added successfully! (Local storage)');
        setPatients(prevPatients => [newLocalPatient, ...prevPatients]);
        
        // Reset form and close modal
        setNewPatient({
          name: '',
          email: '',
          phone: '',
          age: '',
          gender: '',
          address: '',
          medical_history: '',
          emergency_contact: ''
        });
  setShowAddPatient(false);
  setIsAddingPatient(false);
        return;
      }
      
      // Try Supabase first
      console.log('Attempting to use Supabase...');
      const { data, error } = await supabaseHelpers.createPatient(patientData);
      
      if (error) {
        console.error('Supabase error:', error);
        
        // Fallback to local storage if Supabase fails
        console.log('Falling back to local storage due to Supabase error');
        const localPatients = JSON.parse(localStorage.getItem('localPatients') || '[]');
        const newLocalPatient = { ...patientData, id: Date.now().toString() };
        localPatients.unshift(newLocalPatient);
        localStorage.setItem('localPatients', JSON.stringify(localPatients));
        
        toast.success('Patient added successfully! (Local fallback due to database connection issue)');
        setPatients(prevPatients => [newLocalPatient, ...prevPatients]);
      } else {
        console.log('Patient added successfully to Supabase:', data);
        toast.success('Patient added successfully!');
        
        // Update local state
        setPatients(prevPatients => [data, ...prevPatients]);
      }
      
      // Reset form and close modal regardless of method used
      setNewPatient({
        name: '',
        email: '',
        phone: '',
        age: '',
        gender: '',
        address: '',
        medical_history: '',
        emergency_contact: ''
      });
  setShowAddPatient(false);
      
      // Refresh the data
      try {
        await refreshAllData();
      } catch (refreshError) {
        console.error('Error refreshing data:', refreshError);
      }
      
  } catch (error) {
      console.error('Catch block error:', error);
      
      // Final fallback to local storage
      try {
        console.log('Final fallback to local storage');
        const patientData = {
          id: Date.now().toString(),
          doctor_id: currentUser.id,
          full_name: newPatient.name,
          email: newPatient.email,
          phone: newPatient.phone,
          age: parseInt(newPatient.age),
          gender: newPatient.gender,
          address: newPatient.address,
          medical_history: newPatient.medical_history,
          emergency_contact: newPatient.emergency_contact,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        const localPatients = JSON.parse(localStorage.getItem('localPatients') || '[]');
        localPatients.unshift(patientData);
        localStorage.setItem('localPatients', JSON.stringify(localPatients));
        
        setPatients(prevPatients => [patientData, ...prevPatients]);
        
        // Reset form and close modal
        setNewPatient({
          name: '',
          email: '',
          phone: '',
          age: '',
          gender: '',
          address: '',
          medical_history: '',
          emergency_contact: ''
        });
        setShowAddPatient(false);
        
        toast.success('Patient added successfully! (Local storage fallback)');
      } catch (localError) {
        console.error('Local storage fallback failed:', localError);
        toast.error(`Failed to add patient: ${error.message || 'Unknown error'}`);
      }
    } finally {
      console.log('Setting loading to false');
      setIsAddingPatient(false);
    }
  };

  // Auto-logout functionality
  useEffect(() => {
    let activityTimer;
    let warningTimer;
    const INACTIVITY_TIME = 30 * 60 * 1000; // 30 minutes
    const WARNING_TIME = 25 * 60 * 1000; // 25 minutes

    const resetTimer = () => {
      clearTimeout(activityTimer);
      clearTimeout(warningTimer);
      
      // Set warning timer
      warningTimer = setTimeout(() => {
        const shouldStay = window.confirm(
          'Your session will expire in 5 minutes due to inactivity. Click OK to stay logged in.'
        );
        if (!shouldStay) {
          handleLogout();
        }
      }, WARNING_TIME);

      // Set logout timer
      activityTimer = setTimeout(() => {
        toast.error('Session expired due to inactivity');
        handleLogout();
      }, INACTIVITY_TIME);
    };

    const handleActivity = () => {
      resetTimer();
    };

    const handleLogout = () => {
      logout();
      // Clear any local storage or session data
      localStorage.removeItem('doctorSession');
      sessionStorage.clear();
    };

    // Track user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Initialize timer
    resetTimer();

    // Cleanup on unmount
    return () => {
      clearTimeout(activityTimer);
      clearTimeout(warningTimer);
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  }, [logout]);

  const loadDoctorStats = useCallback(async () => {
    if (!currentUser?.id) return;
    
    try {
      // For now, calculate stats from patient data
      // In production, this would be a separate API endpoint
      const stats = {
        total_patients: patients.length,
        total_scans: patients.reduce((total, patient) => {
          return total + (patientScans.length || 0);
        }, 0),
        recent_analysis: patientScans.filter(scan => {
          const scanDate = new Date(scan.created_at);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return scanDate > weekAgo;
        }).length,
        scan_distribution: {
          CNV: patientScans.filter(scan => scan.diagnosis === 'CNV').length,
          DME: patientScans.filter(scan => scan.diagnosis === 'DME').length,
          DRUSEN: patientScans.filter(scan => scan.diagnosis === 'DRUSEN').length,
          NORMAL: patientScans.filter(scan => scan.diagnosis === 'NORMAL').length
        }
      };
      setDoctorStats(stats);
    } catch (error) {
      console.error('Error loading doctor stats:', error);
    }
  }, [currentUser?.id, patients, patientScans]);

  const loadPatients = useCallback(async () => {
    if (!currentUser?.id) return;
    
    setIsLoading(true);
    try {
      // Check if Supabase is configured
      const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
      if (!supabaseUrl || supabaseUrl === 'YOUR_SUPABASE_URL') {
        console.warn('Supabase not configured, loading from local storage');
        const localPatients = JSON.parse(localStorage.getItem('localPatients') || '[]');
        setPatients(localPatients);
        loadDoctorStats();
        return;
      }

      const { data, error } = await supabaseHelpers.getPatientsByDoctor(currentUser.id);
      if (error) {
        toast.error('Failed to load patients');
        console.error('Error loading patients:', error);
        
        // Fallback to local storage if Supabase fails
        const localPatients = JSON.parse(localStorage.getItem('localPatients') || '[]');
        setPatients(localPatients);
      } else {
        setPatients(data || []);
        // Load stats after patients are loaded
        loadDoctorStats();
      }
    } catch (error) {
      toast.error('Failed to load patients');
      console.error('Error loading patients:', error);
      // Fallback to local storage on error
      const localPatients = JSON.parse(localStorage.getItem('localPatients') || '[]');
      setPatients(localPatients);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.id, loadDoctorStats]);

  // Load patients when component mounts
  useEffect(() => {
    if (currentUser?.id) {
      console.log('Loading patients for user:', currentUser.id);
      loadPatients();
      // Also refresh stats on login
      setTimeout(() => {
        loadDoctorStats();
      }, 1000); // Small delay to ensure data is loaded
    }
  }, [currentUser, loadPatients, loadDoctorStats]);

  // Update stats when patients or scans change
  useEffect(() => {
    if (patients.length > 0 || patientScans.length > 0) {
      loadDoctorStats();
    }
  }, [patients, patientScans, loadDoctorStats]);

  // Add refresh function for real-time updates
  const refreshAllData = useCallback(async () => {
    if (currentUser?.id) {
      setIsLoading(true);
      try {
        await loadPatients();
        await loadDoctorStats();
        toast.success('Dashboard updated successfully');
      } catch (error) {
        console.error('Error refreshing data:', error);
        toast.error('Failed to refresh dashboard');
      } finally {
        setIsLoading(false);
      }
    }
  }, [currentUser?.id, loadPatients, loadDoctorStats]);

  const loadPatientScans = async (patientId) => {
    try {
      const { data, error } = await supabaseHelpers.getRetinalScansByPatient(patientId);
      if (error) {
        toast.error('Failed to load scans');
        console.error('Error loading scans:', error);
      } else {
        setPatientScans(data || []);
      }
    } catch (error) {
      toast.error('Failed to load scans');
      console.error('Error loading scans:', error);
    }
  };

  const handleDeletePatient = async (patientId, patientName) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete patient "${patientName}"? This will also delete all their scan records and cannot be undone.`
    );
    
    if (!confirmDelete) return;

    setIsLoading(true);
    try {
      // First delete all patient's scans
      const { error: scansError } = await supabaseHelpers.deletePatientScans(patientId);
      if (scansError) throw scansError;

      // Then delete the patient
      const { error: patientError } = await supabaseHelpers.deletePatient(patientId);
      if (patientError) throw patientError;

      // Update local state
      setPatients(prev => prev.filter(p => p.id !== patientId));
      
      // If this was the selected patient, clear selection
      if (selectedPatient?.id === patientId) {
        setSelectedPatient(null);
        setActiveView('dashboard');
      }

      toast.success(`Patient "${patientName}" deleted successfully`);
      await refreshAllData(); // Refresh dashboard stats
    } catch (error) {
      console.error('Error deleting patient:', error);
      toast.error('Failed to delete patient');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    setActiveView('patient-profile');
    loadPatientScans(patient.id);
  };

  const handleViewDetailedRecord = (scan) => {
    setSelectedScan(scan);
    setShowDetailedRecord(true);
  };

  const handleGenerateReport = async (scan) => {
    try {
      const result = await generatePatientReport(
        scan,
        currentUser,
        selectedPatient,
        scan.ai_explanation || '',
        scan.doctor_notes || ''
      );
      
      if (result.success) {
        toast.success(`Report generated: ${result.filename}`);
      } else {
        toast.error('Failed to generate report');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    }
  };

  const filteredPatients = patients.filter(patient =>
    patient.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderDashboard = () => (
    <motion.div 
      className="dashboard-view"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="dashboard-stats">
        <motion.div className="stat-card" whileHover={{ scale: 1.05 }}>
          <FaUser className="stat-icon patients" />
          <div className="stat-info">
            <h3>{doctorStats.total_patients}</h3>
            <p>Total Patients</p>
          </div>
        </motion.div>
        
        <motion.div className="stat-card" whileHover={{ scale: 1.05 }}>
          <FaEye className="stat-icon scans" />
          <div className="stat-info">
            <h3>{doctorStats.total_scans}</h3>
            <p>Retinal Scans</p>
          </div>
        </motion.div>
        
        <motion.div className="stat-card" whileHover={{ scale: 1.05 }}>
          <FaChartLine className="stat-icon analysis" />
          <div className="stat-info">
            <h3>{doctorStats.recent_analysis}</h3>
            <p>Recent Analysis</p>
          </div>
        </motion.div>
        
        <motion.div className="stat-card" whileHover={{ scale: 1.05 }}>
          <FaStethoscope className="stat-icon conditions" />
          <div className="stat-info">
            <h3>{Object.values(doctorStats.scan_distribution).reduce((a, b) => a + b, 0)}</h3>
            <p>Total Diagnoses</p>
          </div>
        </motion.div>
      </div>

      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="action-buttons">
          <motion.button
            className="action-btn add-patient"
            onClick={() => setShowAddPatient(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FaUserPlus />
            Add New Patient
          </motion.button>
          
          <motion.button
            className="action-btn scan-retina"
            onClick={() => setActiveView('scan')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FaEye />
            Scan Retina
          </motion.button>
        </div>
      </div>

      <div className="recent-patients">
        <h3>Recent Patients</h3>
        <div className="patient-list-preview">
          {patients.slice(0, 5).map(patient => (
            <motion.div
              key={patient.id}
              className="patient-card-mini"
              onClick={() => handlePatientSelect(patient)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="patient-avatar">
                {patient.full_name.charAt(0)}
              </div>
              <div className="patient-info-mini">
                <h4>{patient.full_name}</h4>
                <p>{patient.age} years • {patient.gender}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );

  const renderPatientsList = () => (
    <motion.div 
      className="patients-view"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="patients-header">
        <h3>All Patients</h3>
        <div className="patients-controls">
          <div className="search-bar">
            <FaSearch />
            <input
              type="text"
              placeholder="Search patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <motion.button
            className="add-patient-btn"
            onClick={() => setShowAddPatient(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FaUserPlus />
            Add Patient
          </motion.button>
        </div>
      </div>

      <div className="patients-grid">
        {filteredPatients.map(patient => (
          <motion.div
            key={patient.id}
            className="patient-card"
            whileHover={{ scale: 1.02, y: -5 }}
            whileTap={{ scale: 0.98 }}
            layout
          >
            <div className="patient-card-header">
              <div className="patient-avatar-large">
                {patient.full_name.charAt(0)}
              </div>
              <div className="patient-actions">
                <button 
                  className="delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeletePatient(patient.id, patient.full_name);
                  }}
                  title="Delete Patient"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
            <div 
              className="patient-details"
              onClick={() => handlePatientSelect(patient)}
            >
              <h4>{patient.full_name}</h4>
              <p><FaBirthdayCake /> {patient.age} years</p>
              <p><FaEnvelope /> {patient.email}</p>
              <p><FaPhone /> {patient.phone}</p>
              <div className="patient-meta">
                <span className="last-visit">
                  Last visit: {patient.last_scan_date ? new Date(patient.last_scan_date).toLocaleDateString() : 'Never'}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );

  const renderPatientProfile = () => (
    <motion.div 
      className="patient-profile-view"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {selectedPatient && (
        <>
          <div className="profile-header">
            <div className="patient-info-header">
              <div className="patient-avatar-xl">
                {selectedPatient.full_name.charAt(0)}
              </div>
              <div className="patient-details-header">
                <h2>{selectedPatient.full_name}</h2>
                <p>{selectedPatient.age} years • {selectedPatient.gender}</p>
                <p><FaEnvelope /> {selectedPatient.email}</p>
                <p><FaPhone /> {selectedPatient.phone}</p>
              </div>
            </div>
            <div className="profile-actions">
              <motion.button
                className="scan-btn"
                onClick={() => setActiveView('scan')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaEye />
                New Scan
              </motion.button>
            </div>
          </div>

          <div className="profile-content">
            <div className="patient-info-section">
              <h3>Patient Information</h3>
              <div className="info-grid">
                <div className="info-item">
                  <label>Address:</label>
                  <span>{selectedPatient.address || 'Not provided'}</span>
                </div>
                <div className="info-item">
                  <label>Emergency Contact:</label>
                  <span>{selectedPatient.emergency_contact || 'Not provided'}</span>
                </div>
                <div className="info-item">
                  <label>Medical History:</label>
                  <span>{selectedPatient.medical_history || 'None recorded'}</span>
                </div>
                <div className="info-item">
                  <label>Registered:</label>
                  <span>{new Date(selectedPatient.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div className="scans-section">
              <h3>Retinal Scans History</h3>
              <div className="scans-grid">
                {patientScans.length > 0 ? (
                  patientScans.map(scan => (
                    <motion.div
                      key={scan.id}
                      className="scan-card"
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="scan-image">
                        {scan.image_url ? (
                          <img 
                            src={scan.image_url.startsWith('http') ? scan.image_url : `http://localhost:5000${scan.image_url}`} 
                            alt="Retinal scan" 
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className="scan-overlay" style={{ display: scan.image_url ? 'none' : 'flex' }}>
                          <FaFileImage />
                        </div>
                      </div>
                      <div className="scan-info">
                        <h4>Scan #{patientScans.indexOf(scan) + 1}</h4>
                        <p><strong>Result:</strong> {scan.diagnosis}</p>
                        <p><strong>Confidence:</strong> {scan.confidence}%</p>
                        <p><strong>Date:</strong> {new Date(scan.created_at).toLocaleDateString()}</p>
                        
                        <div className="scan-actions">
                          {scan.heatmap_url && (
                            <motion.button
                              className="view-heatmap-btn"
                              whileHover={{ scale: 1.05 }}
                              onClick={() => window.open(
                                scan.heatmap_url.startsWith('http') ? 
                                  scan.heatmap_url : 
                                  `http://localhost:5000${scan.heatmap_url}`, 
                                '_blank'
                              )}
                            >
                              🔥 Heatmap
                            </motion.button>
                          )}
                          
                          <motion.button
                            className="view-details-btn"
                            whileHover={{ scale: 1.05 }}
                            onClick={() => handleViewDetailedRecord(scan)}
                          >
                            📋 Full Record
                          </motion.button>
                          
                          <motion.button
                            className="generate-report-btn"
                            whileHover={{ scale: 1.05 }}
                            onClick={() => handleGenerateReport(scan)}
                          >
                            📄 PDF Report
                          </motion.button>
                        </div>
                        
                        {scan.doctor_notes && (
                          <div className="scan-notes">
                            <p><strong>Notes:</strong> {scan.doctor_notes}</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="no-scans">
                    <FaEye className="no-scans-icon" />
                    <p>No retinal scans yet</p>
                    <motion.button
                      className="first-scan-btn"
                      onClick={() => setActiveView('scan')}
                      whileHover={{ scale: 1.05 }}
                    >
                      Perform First Scan
                    </motion.button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );

  const renderAddPatientModal = () => (
    <AnimatePresence>
      {showAddPatient && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowAddPatient(false)}
        >
          <motion.div
            className="add-patient-modal"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Add New Patient</h3>
            <form onSubmit={(e) => {
              console.log('Form onSubmit triggered', e);
              e.preventDefault(); // Prevent default form submission
              handleAddPatient(e);
            }}>
              <div className="form-row">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    value={newPatient.name}
                    onChange={(e) => setNewPatient({...newPatient, name: e.target.value})}
                    required
                    placeholder="Enter patient's full name"
                  />
                </div>
                <div className="form-group">
                  <label>Age *</label>
                  <input
                    type="number"
                    value={newPatient.age}
                    onChange={(e) => setNewPatient({...newPatient, age: e.target.value})}
                    required
                    min="1"
                    max="120"
                    placeholder="Age"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={newPatient.email}
                    onChange={(e) => setNewPatient({...newPatient, email: e.target.value})}
                    required
                    placeholder="patient@email.com"
                  />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={newPatient.phone}
                    onChange={(e) => setNewPatient({...newPatient, phone: e.target.value})}
                    placeholder="Phone number"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Gender *</label>
                  <select
                    value={newPatient.gender}
                    onChange={(e) => setNewPatient({...newPatient, gender: e.target.value})}
                    required
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Emergency Contact</label>
                  <input
                    type="text"
                    value={newPatient.emergency_contact}
                    onChange={(e) => setNewPatient({...newPatient, emergency_contact: e.target.value})}
                    placeholder="Emergency contact name and phone"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Address</label>
                <textarea
                  value={newPatient.address}
                  onChange={(e) => setNewPatient({...newPatient, address: e.target.value})}
                  rows="2"
                />
              </div>

              <div className="form-group">
                <label>Medical History</label>
                <textarea
                  value={newPatient.medical_history}
                  onChange={(e) => setNewPatient({...newPatient, medical_history: e.target.value})}
                  rows="3"
                  placeholder="Any relevant medical history, previous conditions, medications, etc."
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowAddPatient(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="save-btn"
                  disabled={isAddingPatient}
                >
                  {isAddingPatient ? 'Adding...' : 'Add Patient'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const renderScanView = () => (
    <motion.div 
      className="scan-view"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="scan-header">
        <h3>Retinal Scan Analysis</h3>
        {selectedPatient && (
          <p>Patient: <strong>{selectedPatient.full_name}</strong></p>
        )}
      </div>
      <ImageUploader 
        patientId={selectedPatient?.id}
        showDetailedMetrics={true}
        onScanComplete={(result) => {
          if (selectedPatient) {
            loadPatientScans(selectedPatient.id);
          }
          // Refresh stats and patients list
          loadPatients();
          loadDoctorStats();
          toast.success('Scan completed successfully!');
        }}
      />
    </motion.div>
  );

  const renderDetailedRecordModal = () => (
    <AnimatePresence>
      {showDetailedRecord && selectedScan && (
        <motion.div
          className="detailed-record-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowDetailedRecord(false)}
        >
          <motion.div
            className="detailed-record-modal"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="record-header">
              <h2>📋 Complete Medical Record</h2>
              <button 
                className="close-btn"
                onClick={() => setShowDetailedRecord(false)}
              >
                ✕
              </button>
            </div>

            <div className="record-content">
              {/* Patient Information */}
              <div className="record-section">
                <h3>👤 Patient Information</h3>
                <div className="patient-info-grid">
                  <div><strong>Name:</strong> {selectedPatient.full_name}</div>
                  <div><strong>Age:</strong> {selectedPatient.age} years</div>
                  <div><strong>Gender:</strong> {selectedPatient.gender}</div>
                  <div><strong>Email:</strong> {selectedPatient.email}</div>
                  <div><strong>Phone:</strong> {selectedPatient.phone}</div>
                  <div><strong>Scan Date:</strong> {new Date(selectedScan.created_at).toLocaleString()}</div>
                </div>
              </div>

              {/* Scan Results */}
              <div className="record-section">
                <h3>🔬 AI Analysis Results</h3>
                <div className="analysis-results">
                  <div className="result-card">
                    <div className="result-label">Diagnosis</div>
                    <div className={`result-value diagnosis-${selectedScan.diagnosis?.toLowerCase()}`}>
                      {selectedScan.diagnosis}
                    </div>
                  </div>
                  <div className="result-card">
                    <div className="result-label">Confidence</div>
                    <div className="result-value">{selectedScan.confidence}%</div>
                  </div>
                  <div className="result-card">
                    <div className="result-label">Risk Level</div>
                    <div className={`result-value risk-${
                      selectedScan.diagnosis === 'NORMAL' ? 'low' :
                      selectedScan.diagnosis === 'DRUSEN' ? 'medium' :
                      selectedScan.diagnosis === 'DME' ? 'high' : 'critical'
                    }`}>
                      {selectedScan.diagnosis === 'NORMAL' ? 'Low Risk' :
                       selectedScan.diagnosis === 'DRUSEN' ? 'Medium Risk' :
                       selectedScan.diagnosis === 'DME' ? 'High Risk' : 'Critical'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Images Section */}
              <div className="record-section">
                <h3>🖼️ Medical Images</h3>
                <div className="images-grid">
                  {selectedScan.image_url && (
                    <div className="image-card">
                      <h4>Original Scan</h4>
                      <img 
                        src={selectedScan.image_url.startsWith('http') ? 
                             selectedScan.image_url : 
                             `http://localhost:5000${selectedScan.image_url}`} 
                        alt="Original retinal scan"
                        className="record-image"
                      />
                    </div>
                  )}
                  {selectedScan.heatmap_url && (
                    <div className="image-card">
                      <h4>AI Heatmap Analysis</h4>
                      <img 
                        src={selectedScan.heatmap_url.startsWith('http') ? 
                             selectedScan.heatmap_url : 
                             `http://localhost:5000${selectedScan.heatmap_url}`} 
                        alt="AI heatmap analysis"
                        className="record-image"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="record-actions">
                <motion.button
                  className="action-btn primary"
                  whileHover={{ scale: 1.05 }}
                  onClick={() => handleGenerateReport(selectedScan)}
                >
                  📄 Generate PDF Report
                </motion.button>
                <motion.button
                  className="action-btn secondary"
                  whileHover={{ scale: 1.05 }}
                  onClick={() => window.print()}
                >
                  🖨️ Print Record
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className={`doctor-panel ${darkMode ? 'dark' : ''}`}>
      <div className="panel-header">
        <div className="header-left">
          <h1>OptiPro Doctor Panel</h1>
          {currentUser && (
            <div className="user-info">
              <div className="doctor-avatar">
                <FaStethoscope />
              </div>
              <div className="doctor-details">
                <h3>Dr. {currentUser.name}</h3>
                <p>{currentUser.specialization || 'Medical Professional'}</p>
                <small>License: {currentUser.license_number || 'N/A'}</small>
              </div>
            </div>
          )}
        </div>
        <div className="header-actions">
          <motion.button 
            className="logout-btn" 
            onClick={logout}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Logout
          </motion.button>
        </div>
      </div>

      <div className="panel-navigation">
        <motion.button
          className={`nav-btn ${activeView === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveView('dashboard')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <FaChartLine />
          Dashboard
        </motion.button>
        
        <motion.button
          className={`nav-btn ${activeView === 'patients' ? 'active' : ''}`}
          onClick={() => setActiveView('patients')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <FaUser />
          Patients
        </motion.button>
        
        <motion.button
          className={`nav-btn ${activeView === 'scan' ? 'active' : ''}`}
          onClick={() => setActiveView('scan')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <FaEye />
          Scan Retina
        </motion.button>
        
        {selectedPatient && (
          <motion.button
            className={`nav-btn ${activeView === 'patient-profile' ? 'active' : ''}`}
            onClick={() => setActiveView('patient-profile')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FaUser />
            {selectedPatient.full_name}
          </motion.button>
        )}
      </div>

      <div className="panel-content">
        {activeView === 'dashboard' && renderDashboard()}
        {activeView === 'patients' && renderPatientsList()}
        {activeView === 'patient-profile' && renderPatientProfile()}
        {activeView === 'scan' && renderScanView()}
      </div>

      {renderAddPatientModal()}
      {renderDetailedRecordModal()}
    </div>
  );
};

export default DoctorPanel;