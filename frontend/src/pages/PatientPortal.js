import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaTimes, 
  FaUser, 
  FaCalendarPlus, 
  FaClock, 
  FaStethoscope, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaHourglassHalf,
  FaSignOutAlt,
  FaUserMd,
  FaCalendarAlt
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import './PatientPortal.css';

const PatientPortal = ({ closeModal, patient, isFullPage = false }) => {
  const [activeTab, setActiveTab] = useState('book');
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [appointmentData, setAppointmentData] = useState({
    date: '',
    time: '',
    reason: ''
  });

  // Load data helpers
  const fetchPatientAppointments = useCallback(() => {
    const allAppointments = JSON.parse(localStorage.getItem('appointments') || '[]');
    const patientAppointments = allAppointments.filter(
      (appointment) => appointment.patientUserId === patient.id
    );
    setAppointments(patientAppointments);
  }, [patient.id]);

  const fetchDoctors = useCallback(() => {
    // Get registered doctors from localStorage
    const registeredDoctors = JSON.parse(localStorage.getItem('registeredDoctors') || '[]');

    // Sample doctors that are always available
    const sampleDoctors = [
      {
        id: 'sample-1',
        full_name: 'Dr. Sarah Johnson',
        specialization: 'Ophthalmologist',
        email: 'sarah.johnson@optipro.com',
        phone: '+1 (555) 123-4567',
        license_number: 'MD12345'
      },
      {
        id: 'sample-2',
        full_name: 'Dr. Michael Chen',
        specialization: 'Retinal Specialist',
        email: 'michael.chen@optipro.com',
        phone: '+1 (555) 234-5678',
        license_number: 'MD67890'
      },
      {
        id: 'sample-3',
        full_name: 'Dr. Emily Rodriguez',
        specialization: 'Glaucoma Specialist',
        email: 'emily.rodriguez@optipro.com',
        phone: '+1 (555) 345-6789',
        license_number: 'MD11111'
      }
    ];
    
    // Combine sample doctors with registered doctors, avoiding duplicates
    const allDoctors = [...sampleDoctors];
    registeredDoctors.forEach(doctor => {
      if (!allDoctors.find(d => d.email === doctor.email)) {
        allDoctors.push(doctor);
      }
    });
    
    setDoctors(allDoctors);
  }, []);

  useEffect(() => {
    fetchDoctors();
    fetchPatientAppointments();
  }, [fetchDoctors, fetchPatientAppointments]);

  // Form helpers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAppointmentData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateAppointmentForm = () => {
    if (!selectedDoctor) {
      toast.error('Please select a doctor');
      return false;
    }

    if (!appointmentData.date || !appointmentData.time || !appointmentData.reason.trim()) {
      toast.error('Please fill in all appointment details');
      return false;
    }

    const selectedDate = new Date(appointmentData.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      toast.error('Please select a future date');
      return false;
    }

    return true;
  };

  const handleBookAppointment = async () => {
    if (!validateAppointmentForm()) return;

    setIsLoading(true);
    try {
      const newAppointment = {
        id: `appointment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        doctorId: selectedDoctor.id,
        patientUserId: patient.id,
        doctorName: selectedDoctor.full_name,
        patientName: patient.fullName,
        patientEmail: patient.email,
        appointmentDate: appointmentData.date,
        appointmentTime: appointmentData.time,
        reasonForVisit: appointmentData.reason,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      // Store appointment
      const existingAppointments = JSON.parse(localStorage.getItem('appointments') || '[]');
      existingAppointments.push(newAppointment);
      localStorage.setItem('appointments', JSON.stringify(existingAppointments));

      // Create notification for doctor
      const doctorNotifications = JSON.parse(localStorage.getItem('doctorNotifications') || '[]');
      const notification = {
        id: `notification-${Date.now()}`,
        doctorId: selectedDoctor.id,
        type: 'new_appointment',
        title: 'New Appointment Request',
        message: `${patient.fullName} has requested an appointment on ${appointmentData.date} at ${appointmentData.time}`,
        appointmentId: newAppointment.id,
        read: false,
        createdAt: new Date().toISOString()
      };
      doctorNotifications.push(notification);
      localStorage.setItem('doctorNotifications', JSON.stringify(doctorNotifications));

      toast.success('Appointment request sent successfully!');
      
      // Reset form
      setAppointmentData({ date: '', time: '', reason: '' });
      setSelectedDoctor(null);
      
      // Refresh appointments
      fetchPatientAppointments();
      
      // Switch to appointments tab
      setActiveTab('appointments');
    } catch (error) {
      console.error('Error booking appointment:', error);
      toast.error('Failed to book appointment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('currentPatient');
    toast.success('Logged out successfully');
    closeModal();
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed':
        return <FaCheckCircle className="status-icon confirmed" />;
      case 'rejected':
        return <FaTimesCircle className="status-icon rejected" />;
      case 'cancelled':
        return <FaTimesCircle className="status-icon cancelled" />;
      case 'completed':
        return <FaCheckCircle className="status-icon completed" />;
      default:
        return <FaHourglassHalf className="status-icon pending" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmed';
      case 'rejected':
        return 'Rejected';
      case 'cancelled':
        return 'Cancelled';
      case 'completed':
        return 'Completed';
      default:
        return 'Pending';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    const time = new Date();
    time.setHours(parseInt(hours), parseInt(minutes));
    return time.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className={isFullPage ? "patient-portal-fullpage" : "patient-portal-overlay"} onClick={!isFullPage ? (e) => e.target === e.currentTarget && closeModal() : undefined}>
      <motion.div
        className="patient-portal"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ duration: 0.3 }}
      >
        <div className="patient-portal-header">
          <div className="header-info">
            <FaUser className="user-icon" />
            <div>
              <h2>Welcome, {patient.fullName}</h2>
              <p>{patient.email}</p>
            </div>
          </div>
          <div className="header-actions">
            <button className="logout-btn" onClick={handleLogout}>
              <FaSignOutAlt /> Logout
            </button>
            <button className="close-btn" onClick={closeModal}>
              <FaTimes />
            </button>
          </div>
        </div>

        <div className="patient-portal-tabs">
          <button
            className={`tab-btn ${activeTab === 'book' ? 'active' : ''}`}
            onClick={() => setActiveTab('book')}
          >
            <FaCalendarPlus /> Book Appointment
          </button>
          <button
            className={`tab-btn ${activeTab === 'appointments' ? 'active' : ''}`}
            onClick={() => setActiveTab('appointments')}
          >
            <FaCalendarAlt /> My Appointments
          </button>
        </div>

        <div className="patient-portal-content">
          <AnimatePresence mode="wait">
            {activeTab === 'book' && (
              <motion.div
                key="book"
                className="tab-content"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="booking-section">
                  <h3><FaUserMd /> Select a Doctor</h3>
                  <div className="doctors-grid">
                    {doctors.map((doctor) => (
                      <div
                        key={doctor.id}
                        className={`doctor-card ${selectedDoctor?.id === doctor.id ? 'selected' : ''}`}
                        onClick={() => setSelectedDoctor(doctor)}
                      >
                        <div className="doctor-info">
                          <h4>{doctor.full_name}</h4>
                          <p className="specialization">{doctor.specialization}</p>
                          <p className="contact">{doctor.email}</p>
                          {doctor.phone && <p className="contact">{doctor.phone}</p>}
                        </div>
                        {selectedDoctor?.id === doctor.id && (
                          <FaCheckCircle className="selected-icon" />
                        )}
                      </div>
                    ))}
                  </div>

                  {selectedDoctor && (
                    <motion.div
                      className="appointment-form"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <h3><FaCalendarPlus /> Appointment Details</h3>
                      
                      <div className="form-row">
                        <div className="form-group">
                          <label htmlFor="date">
                            <FaCalendarAlt /> Preferred Date
                          </label>
                          <input
                            type="date"
                            id="date"
                            name="date"
                            value={appointmentData.date}
                            onChange={handleInputChange}
                            min={new Date().toISOString().split('T')[0]}
                            required
                            disabled={isLoading}
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor="time">
                            <FaClock /> Preferred Time
                          </label>
                          <select
                            id="time"
                            name="time"
                            value={appointmentData.time}
                            onChange={handleInputChange}
                            required
                            disabled={isLoading}
                          >
                            <option value="">Select time</option>
                            <option value="09:00">9:00 AM</option>
                            <option value="09:30">9:30 AM</option>
                            <option value="10:00">10:00 AM</option>
                            <option value="10:30">10:30 AM</option>
                            <option value="11:00">11:00 AM</option>
                            <option value="11:30">11:30 AM</option>
                            <option value="14:00">2:00 PM</option>
                            <option value="14:30">2:30 PM</option>
                            <option value="15:00">3:00 PM</option>
                            <option value="15:30">3:30 PM</option>
                            <option value="16:00">4:00 PM</option>
                            <option value="16:30">4:30 PM</option>
                          </select>
                        </div>
                      </div>

                      <div className="form-group">
                        <label htmlFor="reason">
                          <FaStethoscope /> Reason for Visit
                        </label>
                        <textarea
                          id="reason"
                          name="reason"
                          value={appointmentData.reason}
                          onChange={handleInputChange}
                          placeholder="Please describe the reason for your visit"
                          rows="4"
                          required
                          disabled={isLoading}
                        />
                      </div>

                      <button
                        className="book-btn"
                        onClick={handleBookAppointment}
                        disabled={isLoading}
                      >
                        {isLoading ? 'Booking...' : 'Book Appointment'}
                      </button>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'appointments' && (
              <motion.div
                key="appointments"
                className="tab-content"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="appointments-section">
                  <h3><FaCalendarAlt /> My Appointments</h3>
                  
                  {appointments.length === 0 ? (
                    <div className="no-appointments">
                      <p>You don't have any appointments yet.</p>
                      <button
                        className="book-first-btn"
                        onClick={() => setActiveTab('book')}
                      >
                        <FaCalendarPlus /> Book Your First Appointment
                      </button>
                    </div>
                  ) : (
                    <div className="appointments-list">
                      {appointments.map((appointment) => (
                        <div key={appointment.id} className="appointment-card">
                          <div className="appointment-header">
                            <div className="doctor-info">
                              <h4>{appointment.doctorName}</h4>
                              <p>{formatDate(appointment.appointmentDate)} at {formatTime(appointment.appointmentTime)}</p>
                            </div>
                            <div className="appointment-status">
                              {getStatusIcon(appointment.status)}
                              <span className={`status-text ${appointment.status}`}>
                                {getStatusText(appointment.status)}
                              </span>
                            </div>
                          </div>
                          
                          <div className="appointment-details">
                            <p><strong>Reason:</strong> {appointment.reasonForVisit}</p>
                            {appointment.doctorNotes && (
                              <p><strong>Doctor's Notes:</strong> {appointment.doctorNotes}</p>
                            )}
                            <p><strong>Requested:</strong> {new Date(appointment.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default PatientPortal;