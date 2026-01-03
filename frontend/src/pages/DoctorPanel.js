import React, { useContext, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaUser, FaUserPlus, FaEye, FaSearch,
  FaBirthdayCake, FaPhone, FaEnvelope,
  FaChartLine, FaStethoscope, FaBell, FaCalendarCheck
} from 'react-icons/fa';
import { AuthContext } from '../components/AuthModal';
import { ThemeContext } from '../App';
import { supabaseHelpers } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';
import './DoctorPanel.css';
import ImageUploader from '../components/ImageUploader';
import { generatePatientReport } from '../services/pdfService';

// Resolve asset URLs (base64, absolute, or relative to backend)
const resolveAssetUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('data:')) return url;
  if (url.startsWith('http')) return url;
  const base = process.env.REACT_APP_BACKEND_URL || window.location.origin.replace(/:\d+$/, ':5000');
  return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
};

const DoctorPanel = () => {
  const { currentUser, logout } = useContext(AuthContext);
  const { darkMode } = useContext(ThemeContext);
  const [activeView, setActiveView] = useState('dashboard');
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [, setIsLoading] = useState(false);
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
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [appointments, setAppointments] = useState([]);

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

  const loadNotifications = useCallback(() => {
    if (!currentUser?.id) return;
    try {
      // Load both old and new notification formats
      const oldNotifications = JSON.parse(localStorage.getItem(`notifications_${currentUser.id}`) || '[]');
      const newNotifications = JSON.parse(localStorage.getItem('doctorNotifications') || '[]');
      const filteredNewNotifications = newNotifications.filter(notif => notif.doctorId === currentUser.id);
      const allNotifications = [...oldNotifications, ...filteredNewNotifications];
      const uniqueNotifications = allNotifications.filter((notif, index, self) => index === self.findIndex(n => n.id === notif.id));
      setNotifications(uniqueNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }, [currentUser?.id]);

  const loadAppointments = useCallback(() => {
    if (!currentUser?.id) return;
    try {
      const allAppointments = JSON.parse(localStorage.getItem('appointments') || '[]');
      const doctorAppointments = allAppointments.filter(apt => apt.doctorId === currentUser.id || apt.doctor_id === currentUser.id);
      setAppointments(doctorAppointments);
    } catch (error) {
      console.error('Error loading appointments:', error);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    if (currentUser?.id) {
      loadNotifications();
      loadAppointments();
      const notificationInterval = setInterval(() => {
        loadNotifications();
        loadAppointments();
      }, 30000);
      return () => clearInterval(notificationInterval);
    }
  }, [currentUser?.id, loadNotifications, loadAppointments]);

  // (old implementations replaced by memoized versions above)

  const markNotificationAsRead = (notificationId) => {
    const updatedNotifications = notifications.map(notif => 
      notif.id === notificationId ? { ...notif, read: true } : notif
    );
    setNotifications(updatedNotifications);
    localStorage.setItem(`notifications_${currentUser.id}`, JSON.stringify(updatedNotifications));
  };

  const unreadNotificationsCount = notifications.filter(notif => !notif.read).length;

  // Auto-logout functionality with session validation
  useEffect(() => {
    let activityTimer;
    let warningTimer;
    let sessionCheckInterval;
    const INACTIVITY_TIME = 30 * 60 * 1000; // 30 minutes
    const WARNING_TIME = 25 * 60 * 1000; // 25 minutes
    const SESSION_CHECK_INTERVAL = 60 * 1000; // Check every minute

    const validateSession = () => {
      const loginTime = localStorage.getItem('loginTime');
      const userData = localStorage.getItem('user');
      
      if (!loginTime || !userData) {
        console.log('No session data found, logging out');
        handleLogout();
        return false;
      }
      
      const currentTime = Date.now();
      const sessionAge = currentTime - parseInt(loginTime);
      
      if (sessionAge > INACTIVITY_TIME) {
        console.log('Session expired, auto logout');
        toast.error('Session expired due to inactivity');
        handleLogout();
        return false;
      }
      
      return true;
    };

    const resetTimer = () => {
      if (!validateSession()) return;
      
      clearTimeout(activityTimer);
      clearTimeout(warningTimer);
      
      // Update last activity time
      localStorage.setItem('lastActivity', Date.now().toString());
      
      // Set warning timer
      warningTimer = setTimeout(() => {
        if (!validateSession()) return;
        
        const shouldStay = window.confirm(
          'Your session will expire in 5 minutes due to inactivity. Click OK to stay logged in.'
        );
        if (!shouldStay) {
          handleLogout();
        } else {
          // Reset session time if user wants to stay
          localStorage.setItem('loginTime', Date.now().toString());
          resetTimer();
        }
      }, WARNING_TIME);

      // Set logout timer
      activityTimer = setTimeout(() => {
        if (!validateSession()) return;
        
        toast.error('Session expired due to inactivity');
        handleLogout();
      }, INACTIVITY_TIME);
    };

    const handleActivity = () => {
      resetTimer();
    };

    const handleLogout = () => {
      clearTimeout(activityTimer);
      clearTimeout(warningTimer);
      clearInterval(sessionCheckInterval);
      
      logout();
      // Clear any local storage or session data
      localStorage.removeItem('doctorSession');
      localStorage.removeItem('loginTime');
      localStorage.removeItem('lastActivity');
      sessionStorage.clear();
    };

    // Check session validity periodically
    sessionCheckInterval = setInterval(() => {
      validateSession();
    }, SESSION_CHECK_INTERVAL);

    // Track user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Initialize timer and session check
    if (validateSession()) {
      resetTimer();
    }

    // Cleanup on unmount
    return () => {
      clearTimeout(activityTimer);
      clearTimeout(warningTimer);
      clearInterval(sessionCheckInterval);
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

      toast.success(`Patient "${patientName}" deleted successfully`, {
        className: 'toast-success',
        duration: 4000,
        position: 'top-right'
      });
      await refreshAllData(); // Refresh dashboard stats
    } catch (error) {
      console.error('Error deleting patient:', error);
      toast.error('Failed to delete patient');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteScan = async (scanId) => {
    const confirmDelete = window.confirm('Delete this scan record? This action cannot be undone.');
    if (!confirmDelete) return;

    try {
      const { error } = await supabaseHelpers.deleteRetinalScan(scanId);
      if (error) {
        console.error('Error deleting scan:', error);
        toast.error('Failed to delete scan');
        return;
      }

      setPatientScans(prev => prev.filter(s => s.id !== scanId));
      toast.success('Scan deleted');
      // update stats lightly
      loadDoctorStats();
    } catch (e) {
      console.error('Delete scan exception:', e);
      toast.error('Failed to delete scan');
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
      console.log('Generating report for scan:', scan);
      console.log('Current user:', currentUser);
      console.log('Selected patient:', selectedPatient);
      
      const result = await generatePatientReport(
        scan,
        currentUser,
        selectedPatient,
        scan.ai_explanation || '',
        scan.doctor_notes || ''
      );
      
      if (result.success) {
        toast.success(`Report generated successfully: ${result.filename}`, {
          className: 'toast-success',
          duration: 4000,
          position: 'top-right'
        });
      } else {
        toast.error('Failed to generate report', {
          className: 'toast-error',
          duration: 4000,
          position: 'top-right'
        });
      }
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    }
  };

  // Helper functions for detailed record content
  const getConditionDescription = (diagnosis) => {
    const descriptions = {
      'NORMAL': 'No significant pathological findings detected. The retinal structure appears healthy with normal vascular patterns and no signs of disease.',
      'CNV': 'Choroidal Neovascularization detected. This condition involves abnormal blood vessel growth beneath the retina, which can lead to vision loss if untreated.',
      'DME': 'Diabetic Macular Edema identified. This complication of diabetes causes fluid accumulation in the macula, potentially affecting central vision.',
      'DRUSEN': 'Drusen deposits observed. These yellow deposits under the retina may indicate early signs of age-related macular degeneration (AMD).'
    };
    return descriptions[diagnosis] || 'Analysis completed. Please consult with an ophthalmologist for detailed interpretation.';
  };

  const getRecommendedActions = (diagnosis) => {
    const actions = {
      'NORMAL': [
        'Continue regular eye examinations',
        'Maintain healthy lifestyle with balanced diet',
        'Protect eyes from UV exposure',
        'Follow up in 12 months or as recommended'
      ],
      'CNV': [
        'Immediate referral to retinal specialist',
        'Consider anti-VEGF therapy',
        'Monitor closely for vision changes',
        'Follow-up within 1-2 weeks'
      ],
      'DME': [
        'Optimize diabetes management',
        'Refer to retinal specialist',
        'Consider intravitreal injections',
        'Regular diabetic eye examinations'
      ],
      'DRUSEN': [
        'Monitor for progression to wet AMD',
        'Consider AREDS2 supplements',
        'Regular follow-up examinations',
        'Lifestyle modifications for eye health'
      ]
    };
    return actions[diagnosis] || [
      'Consult with ophthalmologist',
      'Follow standard care guidelines',
      'Regular monitoring recommended'
    ];
  };

  const getFollowupSchedule = (diagnosis) => {
    const schedules = {
      'NORMAL': 'Annual comprehensive eye examination recommended, or as advised by healthcare provider.',
      'CNV': 'Urgent follow-up required within 1-2 weeks. Monthly monitoring during active treatment.',
      'DME': 'Follow-up every 3-4 months, or more frequently during active treatment phase.',
      'DRUSEN': 'Follow-up every 6-12 months to monitor for progression. More frequent if high-risk features present.'
    };
    return schedules[diagnosis] || 'Follow-up schedule to be determined by consulting ophthalmologist.';
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
            onClick={() => handlePatientSelect(patient)}
          >
            <button 
              className="patient-delete-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleDeletePatient(patient.id, patient.full_name);
              }}
              title="Delete Patient"
            >
              &times;
            </button>
            <div className="patient-card-header">
              <div className="patient-avatar-large">
                {patient.full_name.charAt(0)}
              </div>
            </div>
            <div className="patient-details">
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
                      <button 
                        className="scan-delete-btn"
                        title="Delete scan"
                        onClick={(e) => { e.stopPropagation(); handleDeleteScan(scan.id); }}
                      >
                        &times;
                      </button>
                      <div className="scan-heatmap-container">
                        <h5>AI Heatmap Analysis</h5>
                        {scan.heatmap_url ? (
                          <img 
                            src={resolveAssetUrl(scan.heatmap_url)}
                            alt="AI heatmap analysis"
                            className="scan-image heatmap-image"
                            onError={(e) => {
                              console.error('Heatmap load error:', e);
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className="scan-overlay heatmap-placeholder" style={{ display: scan.heatmap_url ? 'none' : 'flex' }}>
                          <span>🔥</span>
                          <span>No Heatmap Available</span>
                        </div>
                      </div>
                      <div className="scan-info">
                        <h4>Scan #{patientScans.indexOf(scan) + 1}</h4>
                        <p><strong>Result:</strong> <span className={`diagnosis-badge ${scan.diagnosis?.toLowerCase()}`}>{scan.diagnosis}</span></p>
                        <p><strong>Confidence:</strong> <span className="confidence-score">{scan.confidence}%</span></p>
                        <p><strong>Date:</strong> {new Date(scan.created_at).toLocaleDateString()}</p>
                        
                        <div className="scan-actions">
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

  const handleAppointmentAction = (appointmentId, action) => {
    const updatedAppointments = appointments.map(apt => {
      if (apt.id === appointmentId) {
        return { ...apt, status: action };
      }
      return apt;
    });
    
    setAppointments(updatedAppointments);
    
    // Update localStorage
    const allAppointments = JSON.parse(localStorage.getItem('appointments') || '[]');
    const updated = allAppointments.map(apt => 
      apt.id === appointmentId ? { ...apt, status: action } : apt
    );
    localStorage.setItem('appointments', JSON.stringify(updated));
    
    toast.success(`Appointment ${action}ed successfully!`);
  };

  const renderAppointmentsView = () => (
    <motion.div 
      className="appointments-view"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="appointments-header">
        <h3>Appointment Requests</h3>
        <p>Manage patient appointment requests</p>
      </div>
      
      <div className="appointments-grid">
        {appointments.length === 0 ? (
          <div className="no-appointments">
            <FaCalendarCheck className="no-appointments-icon" />
            <h4>No Appointment Requests</h4>
            <p>You don't have any appointment requests at the moment.</p>
          </div>
        ) : (
          appointments.map((appointment) => (
            <motion.div
              key={appointment.id}
              className={`appointment-card ${appointment.status}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="appointment-header">
                <h4>
                  {appointment.patientName || 
                   appointment.patient_info?.fullName || 
                   appointment.patient_name || 
                   'Unknown Patient'}
                </h4>
                <span className={`status-badge ${appointment.status}`}>
                  {appointment.status.toUpperCase()}
                </span>
              </div>
              
              <div className="appointment-details">
                <div className="detail-row">
                  <FaCalendarCheck />
                  <span>
                    {new Date(appointment.appointmentDate || appointment.date).toLocaleDateString()} at {' '}
                    {appointment.appointmentTime || appointment.time}
                  </span>
                </div>
                <div className="detail-row">
                  <FaEnvelope />
                  <span>
                    {appointment.patientEmail || 
                     appointment.patient_info?.email || 
                     appointment.patient_email || 
                     'No email provided'}
                  </span>
                </div>
                <div className="detail-row">
                  <FaPhone />
                  <span>
                    {appointment.patient_info?.phone || 
                     appointment.patient_phone || 
                     'No phone provided'}
                  </span>
                </div>
                <div className="detail-row">
                  <FaUser />
                  <span>
                    {appointment.patient_info?.age || appointment.patient_age || 'N/A'} years, {' '}
                    {appointment.patient_info?.gender || appointment.patient_gender || 'N/A'}
                  </span>
                </div>
              </div>
              
              <div className="appointment-reason">
                <strong>Reason for visit:</strong>
                <p>{appointment.reasonForVisit || appointment.reason || 'No reason provided'}</p>
              </div>
              
              {(appointment.patient_info?.medicalHistory || appointment.patient_medical_history) && (
                <div className="medical-history">
                  <strong>Medical History:</strong>
                  <p>{appointment.patient_info?.medicalHistory || appointment.patient_medical_history}</p>
                </div>
              )}
              
              {appointment.status === 'pending' && (
                <div className="appointment-actions">
                  <motion.button
                    className="action-btn confirm"
                    onClick={() => handleAppointmentAction(appointment.id, 'confirmed')}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    ✓ Confirm
                  </motion.button>
                  <motion.button
                    className="action-btn reject"
                    onClick={() => handleAppointmentAction(appointment.id, 'rejected')}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    ✗ Reject
                  </motion.button>
                </div>
              )}
              
              <div className="appointment-meta">
                <span>Requested: {new Date(appointment.created_at).toLocaleDateString()}</span>
              </div>
            </motion.div>
          ))
        )}
      </div>
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
                  <div><strong>Address:</strong> {selectedPatient.address || 'Not provided'}</div>
                  <div><strong>Emergency Contact:</strong> {selectedPatient.emergency_contact || 'Not provided'}</div>
                  <div><strong>Medical History:</strong> {selectedPatient.medical_history || 'None recorded'}</div>
                  <div><strong>Patient Registered:</strong> {new Date(selectedPatient.created_at).toLocaleDateString()}</div>
                  <div><strong>Scan Date & Time:</strong> {new Date(selectedScan.created_at).toLocaleString()}</div>
                </div>
              </div>

              {/* Scan Results */}
              <div className="record-section">
                <h3>🔬 Comprehensive AI Analysis Results</h3>
                <div className="analysis-results">
                  <div className="result-card">
                    <div className="result-label">Primary Diagnosis</div>
                    <div className={`result-value diagnosis-${selectedScan.diagnosis?.toLowerCase()}`}>
                      {selectedScan.diagnosis}
                    </div>
                  </div>
                  <div className="result-card">
                    <div className="result-label">AI Confidence Level</div>
                    <div className="result-value">{selectedScan.confidence}%</div>
                  </div>
                  <div className="result-card">
                    <div className="result-label">Risk Assessment</div>
                    <div className={`result-value risk-${
                      selectedScan.diagnosis === 'NORMAL' ? 'low' :
                      selectedScan.diagnosis === 'DRUSEN' ? 'medium' :
                      selectedScan.diagnosis === 'DME' ? 'high' : 'critical'
                    }`}>
                      {selectedScan.diagnosis === 'NORMAL' ? 'Low Risk' :
                       selectedScan.diagnosis === 'DRUSEN' ? 'Medium Risk' :
                       selectedScan.diagnosis === 'DME' ? 'High Risk' : 'Critical Risk'}
                    </div>
                  </div>
                  <div className="result-card">
                    <div className="result-label">Scan Type</div>
                    <div className="result-value">Fundus Photography</div>
                  </div>
                  <div className="result-card">
                    <div className="result-label">Analysis Method</div>
                    <div className="result-value">CNN Deep Learning Model</div>
                  </div>
                  <div className="result-card">
                    <div className="result-label">Processing Time</div>
                    <div className="result-value">{selectedScan.processing_time || '< 5 seconds'}</div>
                  </div>
                </div>
              </div>

              {/* Clinical Interpretation */}
              <div className="record-section">
                <h3>🩺 Clinical Interpretation</h3>
                <div className="clinical-details">
                  <div className="interpretation-card">
                    <h4>Condition Overview</h4>
                    <p>{getConditionDescription(selectedScan.diagnosis)}</p>
                  </div>
                  
                  <div className="interpretation-card">
                    <h4>Recommended Actions</h4>
                    <ul>
                      {getRecommendedActions(selectedScan.diagnosis).map((action, index) => (
                        <li key={index}>{action}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="interpretation-card">
                    <h4>Follow-up Schedule</h4>
                    <p>{getFollowupSchedule(selectedScan.diagnosis)}</p>
                  </div>
                </div>
              </div>

              {/* Images Section */}
              <div className="record-section">
                <h3>🖼️ Medical Images & Analysis</h3>
                <div className="images-grid">
                  {selectedScan.image_url && (
                    <div className="image-card">
                      <h4>Original Retinal Scan</h4>
                      <img 
                        src={resolveAssetUrl(selectedScan.image_url)} 
                        alt="Original retinal scan"
                        className="record-image"
                      />
                      <div className="image-metadata">
                        <p><strong>Resolution:</strong> High-definition fundus photography</p>
                        <p><strong>Quality:</strong> Suitable for AI analysis</p>
                      </div>
                    </div>
                  )}
                  {selectedScan.heatmap_url && (
                    <div className="image-card">
                      <h4>AI Heatmap Analysis</h4>
                      <img 
                        src={resolveAssetUrl(selectedScan.heatmap_url)} 
                        alt="AI heatmap analysis"
                        className="record-image"
                      />
                      <div className="image-metadata">
                        <p><strong>Analysis Type:</strong> Grad-CAM Visualization</p>
                        <p><strong>Focus Areas:</strong> Regions of interest highlighted</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* AI Explanation */}
              {selectedScan.ai_explanation && (
                <div className="record-section">
                  <h3>🤖 AI Model Explanation</h3>
                  <div className="ai-explanation-content">
                    <p>{selectedScan.ai_explanation}</p>
                  </div>
                </div>
              )}

              {/* Doctor's Notes */}
              <div className="record-section">
                <h3>📝 Clinical Notes</h3>
                <div className="notes-content">
                  {selectedScan.doctor_notes ? (
                    <p>{selectedScan.doctor_notes}</p>
                  ) : (
                    <p><em>No additional clinical notes provided. Standard post-examination care guidelines apply.</em></p>
                  )}
                </div>
              </div>

              {/* Technical Details */}
              <div className="record-section">
                <h3>⚙️ Technical Analysis Details</h3>
                <div className="technical-grid">
                  <div><strong>Model Version:</strong> OptiPro AI v2.1.0</div>
                  <div><strong>Training Dataset:</strong> 50,000+ annotated retinal images</div>
                  <div><strong>Validation Accuracy:</strong> 94.2%</div>
                  <div><strong>Analysis Date:</strong> {new Date(selectedScan.created_at).toLocaleDateString()}</div>
                  <div><strong>Scan ID:</strong> {selectedScan.id}</div>
                  <div><strong>File Format:</strong> JPEG/PNG Digital Image</div>
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
                  onClick={() => setShowDetailedRecord(false)}
                >
                  ✅ Close Record
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
          <div className="notification-wrapper">
            <motion.button 
              className="notification-btn" 
              onClick={() => setShowNotifications(!showNotifications)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FaBell />
              {unreadNotificationsCount > 0 && (
                <span className="notification-badge">{unreadNotificationsCount}</span>
              )}
            </motion.button>
            
            {showNotifications && (
              <div className="notifications-dropdown">
                <div className="notifications-header">
                  <h4>Notifications</h4>
                  <span>{unreadNotificationsCount} unread</span>
                </div>
                <div className="notifications-list">
                  {notifications.length === 0 ? (
                    <div className="no-notifications">No notifications</div>
                  ) : (
                    notifications.map((notification) => (
                      <div 
                        key={notification.id} 
                        className={`notification-item ${!notification.read ? 'unread' : ''}`}
                        onClick={() => markNotificationAsRead(notification.id)}
                      >
                        <div className="notification-content">
                          <p className="notification-message">{notification.message}</p>
                          <span className="notification-time">
                            {new Date(notification.created_at).toLocaleString()}
                          </span>
                        </div>
                        {!notification.read && <div className="notification-dot"></div>}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          
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
        
        <motion.button
          className={`nav-btn ${activeView === 'appointments' ? 'active' : ''}`}
          onClick={() => setActiveView('appointments')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <FaCalendarCheck />
          Appointments
          {unreadNotificationsCount > 0 && (
            <span className="nav-notification-badge">{unreadNotificationsCount}</span>
          )}
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
        {activeView === 'appointments' && renderAppointmentsView()}
      </div>

      {renderAddPatientModal()}
      {renderDetailedRecordModal()}
    </div>
  );
};

export default DoctorPanel;