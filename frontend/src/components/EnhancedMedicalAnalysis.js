import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaRobot, FaTimes, FaSpinner, FaHeartbeat, FaEye, 
  FaPills, FaClipboardList, FaExclamationTriangle,
  FaCheckCircle, FaInfoCircle, FaBrain, FaMicroscope
} from 'react-icons/fa';
import { getMedicalExplanation } from '../services/geminiService';
import './EnhancedMedicalAnalysis.css';

const EnhancedMedicalAnalysis = ({ 
  prediction, 
  confidence, 
  isOpen, 
  onClose,
  patientData = null
}) => {
  const [explanation, setExplanation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (isOpen && prediction && confidence) {
      generateExplanation();
    }
  }, [isOpen, prediction, confidence]);

  const generateExplanation = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await getMedicalExplanation(prediction, confidence);
      setExplanation(result);
    } catch (err) {
      console.error('Error generating medical explanation:', err);
      setError('Failed to generate AI analysis. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const parseExplanation = (text) => {
    const sections = {
      symptoms: [],
      medications: [],
      recommendations: [],
      overview: ''
    };

    const lines = text.split('\n').filter(line => line.trim());
    let currentSection = 'overview';
    let overviewText = '';

    for (const line of lines) {
      if (line.includes('**Symptoms**') || line.toLowerCase().includes('symptoms:')) {
        currentSection = 'symptoms';
      } else if (line.includes('**Medications**') || line.toLowerCase().includes('medications:')) {
        currentSection = 'medications';
      } else if (line.includes('**Recommendations**') || line.toLowerCase().includes('recommendations:')) {
        currentSection = 'recommendations';
      } else if (line.startsWith('•') || line.startsWith('-')) {
        const cleanLine = line.replace(/^[•-]\s*/, '').trim();
        if (cleanLine && currentSection !== 'overview') {
          sections[currentSection].push(cleanLine);
        }
      } else if (currentSection === 'overview' && line.trim()) {
        overviewText += line + ' ';
      }
    }

    sections.overview = overviewText.trim() || generateDefaultOverview(prediction, confidence);
    return sections;
  };

  const generateDefaultOverview = (pred, conf) => {
    const conditionInfo = {
      'CNV': {
        overview: 'Choroidal Neovascularization (CNV) involves abnormal blood vessel growth beneath the retina, potentially leading to severe vision loss if untreated.',
        details: 'CNV occurs when new blood vessels grow from the choroid through breaks in Bruch\'s membrane into the retinal pigment epithelium or neurosensory retina. This condition is often associated with age-related macular degeneration (AMD) and can cause rapid central vision loss.',
        urgency: 'High',
        prognosis: 'With early detection and treatment, vision loss can often be prevented or slowed. Anti-VEGF injections are highly effective.',
        followUp: '1-2 weeks for immediate treatment, then monthly monitoring'
      },
      'DME': {
        overview: 'Diabetic Macular Edema (DME) is a complication of diabetes causing fluid accumulation in the macula, affecting central vision.',
        details: 'DME results from chronic hyperglycemia causing damage to retinal blood vessels, leading to increased vascular permeability and fluid leakage into the macula. This can cause vision distortion and central vision loss.',
        urgency: 'Medium-High',
        prognosis: 'Good outcomes with proper diabetes management and timely treatment. Modern treatments can significantly improve or stabilize vision.',
        followUp: '2-4 weeks for initial treatment, then every 2-3 months'
      },
      'DRUSEN': {
        overview: 'Drusen deposits are early indicators of age-related macular degeneration, requiring regular monitoring and lifestyle modifications.',
        details: 'Drusen are yellow deposits of extracellular material beneath the retinal pigment epithelium. Large or numerous drusen may indicate increased risk of progression to advanced AMD.',
        urgency: 'Low-Medium',
        prognosis: 'Excellent with monitoring. Most patients with drusen do not progress to vision-threatening AMD.',
        followUp: '6-12 months for routine monitoring, depending on size and number'
      },
      'NORMAL': {
        overview: 'The retinal scan appears normal with no significant pathological findings detected.',
        details: 'No signs of diabetic retinopathy, macular degeneration, or other retinal pathology were detected in this scan.',
        urgency: 'None',
        prognosis: 'Excellent. Continue routine eye care and healthy lifestyle habits.',
        followUp: 'Annual routine eye examination unless symptoms develop'
      }
    };

    return conditionInfo[pred] || {
      overview: 'AI analysis indicates specific retinal findings that require professional evaluation.',
      details: 'Additional examination and testing may be needed to fully characterize these findings.',
      urgency: 'Medium',
      prognosis: 'Depends on specific findings. Professional evaluation recommended.',
      followUp: 'As recommended by eye care professional'
    };
  };

  const getSeverityLevel = (prediction, confidence) => {
    // Safely handle confidence value
    const confString = confidence ? String(confidence) : '0';
    const confValue = parseFloat(confString.replace('%', ''));
    
    if (prediction === 'NORMAL') return { level: 'low', text: 'No Concerns', color: '#10B981' };
    if (prediction === 'DRUSEN' && confValue > 80) return { level: 'medium', text: 'Monitor', color: '#F59E0B' };
    if (prediction === 'DME' && confValue > 75) return { level: 'high', text: 'Requires Attention', color: '#EF4444' };
    if (prediction === 'CNV' && confValue > 70) return { level: 'critical', text: 'Urgent Care', color: '#DC2626' };
    
    return { level: 'medium', text: 'Further Evaluation', color: '#8B5CF6' };
  };

  const sections = explanation ? parseExplanation(explanation) : null;
  const severity = getSeverityLevel(prediction || 'UNKNOWN', confidence || '0%');
  const conditionDetails = generateDefaultOverview(prediction || 'UNKNOWN', confidence || '0%');

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="enhanced-medical-analysis-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="enhanced-medical-analysis-modal"
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 50 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="analysis-header">
            <div className="header-content">
              <div className="header-icon">
                <FaBrain />
              </div>
              <div className="header-text">
                <h2>AI Medical Analysis</h2>
                <p>Comprehensive retinal assessment powered by advanced AI</p>
              </div>
            </div>
            <button className="close-btn" onClick={onClose}>
              <FaTimes />
            </button>
          </div>

          {/* Content */}
          <div className="analysis-content">
            {isLoading ? (
              <div className="loading-state">
                <FaSpinner className="loading-spinner" />
                <p>Generating comprehensive medical analysis...</p>
              </div>
            ) : error ? (
              <div className="error-state">
                <FaExclamationTriangle />
                <p>{error}</p>
                <button onClick={generateExplanation} className="retry-btn">
                  Try Again
                </button>
              </div>
            ) : sections ? (
              <>
                {/* Navigation Tabs */}
                <div className="analysis-tabs">
                  <button
                    className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                  >
                    <FaInfoCircle />
                    Overview
                  </button>
                  <button
                    className={`tab ${activeTab === 'symptoms' ? 'active' : ''}`}
                    onClick={() => setActiveTab('symptoms')}
                  >
                    <FaHeartbeat />
                    Symptoms
                  </button>
                  <button
                    className={`tab ${activeTab === 'treatment' ? 'active' : ''}`}
                    onClick={() => setActiveTab('treatment')}
                  >
                    <FaPills />
                    Treatment
                  </button>
                  <button
                    className={`tab ${activeTab === 'recommendations' ? 'active' : ''}`}
                    onClick={() => setActiveTab('recommendations')}
                  >
                    <FaClipboardList />
                    Next Steps
                  </button>
                </div>

                {/* Tab Content */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    className="tab-content"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    {activeTab === 'overview' && (
                      <div className="overview-content">
                        {/* Detailed Information Expandable Sections */}
                        <div className="info-sections">
                          <div className="info-card">
                            <h5><FaMicroscope /> Quick Overview</h5>
                            <p>{conditionDetails.overview}</p>
                          </div>

                          <div className="info-card expandable">
                            <details>
                              <summary>📋 Detailed Medical Information</summary>
                              <div className="details-content">
                                <p>{conditionDetails.details}</p>
                                <div className="medical-metrics">
                                  <div className="metric">
                                    <strong>Prognosis:</strong>
                                    <span>{conditionDetails.prognosis}</span>
                                  </div>
                                  <div className="metric">
                                    <strong>Follow-up:</strong>
                                    <span>{conditionDetails.followUp}</span>
                                  </div>
                                </div>
                              </div>
                            </details>
                          </div>

                          <div className="info-card expandable">
                            <details>
                              <summary>📊 Risk Factors & Prevention</summary>
                              <div className="details-content">
                                <div className="risk-factors">
                                  {prediction === 'CNV' && (
                                    <ul>
                                      <li>Age over 50 years</li>
                                      <li>Family history of AMD</li>
                                      <li>Smoking</li>
                                      <li>High blood pressure</li>
                                      <li>High cholesterol</li>
                                    </ul>
                                  )}
                                  {prediction === 'DME' && (
                                    <ul>
                                      <li>Poor diabetes control</li>
                                      <li>High blood pressure</li>
                                      <li>High cholesterol</li>
                                      <li>Kidney disease</li>
                                      <li>Pregnancy</li>
                                    </ul>
                                  )}
                                  {prediction === 'DRUSEN' && (
                                    <ul>
                                      <li>Age over 60 years</li>
                                      <li>Family history of AMD</li>
                                      <li>Smoking</li>
                                      <li>Light-colored eyes</li>
                                      <li>Poor diet (low antioxidants)</li>
                                    </ul>
                                  )}
                                  {prediction === 'NORMAL' && (
                                    <div className="prevention-tips">
                                      <h6>Maintain Eye Health:</h6>
                                      <ul>
                                        <li>Regular eye exams</li>
                                        <li>Healthy diet rich in omega-3s</li>
                                        <li>UV protection (sunglasses)</li>
                                        <li>Don't smoke</li>
                                        <li>Manage diabetes/blood pressure</li>
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </details>
                          </div>

                          {prediction !== 'NORMAL' && (
                            <div className="severity-info">
                              <h5>Confidence Assessment</h5>
                              <div className="confidence-visual">
                                <div className="confidence-meter">
                                  <div 
                                    className="confidence-fill"
                                    style={{ 
                                      width: confidence || '0%',
                                      backgroundColor: severity.color
                                    }}
                                  ></div>
                                </div>
                                <div className="confidence-details">
                                  <span className="confidence-percentage">{confidence || 'N/A'}</span>
                                  <span className="confidence-label">AI Confidence</span>
                                </div>
                              </div>
                              <p className="confidence-note">
                                Based on retinal pattern analysis using advanced deep learning algorithms
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {activeTab === 'symptoms' && (
                      <div className="symptoms-content">
                        <div className="content-card">
                          <h4><FaHeartbeat /> Associated Symptoms</h4>
                          {sections.symptoms.length > 0 ? (
                            <ul className="symptoms-list">
                              {sections.symptoms.map((symptom, index) => (
                                <motion.li
                                  key={index}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: index * 0.1 }}
                                >
                                  <FaCheckCircle className="list-icon" />
                                  {symptom}
                                </motion.li>
                              ))}
                            </ul>
                          ) : (
                            <p>No specific symptoms identified for this condition.</p>
                          )}
                        </div>
                      </div>
                    )}

                    {activeTab === 'treatment' && (
                      <div className="treatment-content">
                        <div className="content-card">
                          <h4><FaPills /> Treatment Options</h4>
                          {sections.medications.length > 0 ? (
                            <ul className="treatment-list">
                              {sections.medications.map((medication, index) => (
                                <motion.li
                                  key={index}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: index * 0.1 }}
                                >
                                  <FaPills className="list-icon" />
                                  {medication}
                                </motion.li>
                              ))}
                            </ul>
                          ) : (
                            <p>Treatment recommendations will be provided by your healthcare provider based on comprehensive evaluation.</p>
                          )}
                        </div>
                      </div>
                    )}

                    {activeTab === 'recommendations' && (
                      <div className="recommendations-content">
                        <div className="content-card">
                          <h4><FaClipboardList /> Clinical Recommendations</h4>
                          {sections.recommendations.length > 0 ? (
                            <ul className="recommendations-list">
                              {sections.recommendations.map((recommendation, index) => (
                                <motion.li
                                  key={index}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: index * 0.1 }}
                                >
                                  <FaClipboardList className="list-icon" />
                                  {recommendation}
                                </motion.li>
                              ))}
                            </ul>
                          ) : (
                            <p>Please consult with your ophthalmologist for personalized recommendations.</p>
                          )}
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </>
            ) : null}
          </div>

          {/* Footer */}
          <div className="analysis-footer">
            <div className="disclaimer">
              <FaExclamationTriangle />
              <span>This AI analysis is for reference only. Please consult a qualified ophthalmologist for professional diagnosis and treatment.</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EnhancedMedicalAnalysis;
