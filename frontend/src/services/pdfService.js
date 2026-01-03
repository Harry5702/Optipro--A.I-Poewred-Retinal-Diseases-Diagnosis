// Resolve the correct heatmap URL for reports (handles base64, absolute, and relative paths)
function getHeatmapUrl(scan) {
    // Accept both snake_case (DB) and camelCase (in-memory result) shapes
    let heatmapUrl = scan?.heatmap_url || scan?.heatmapUrl || scan?.image_url || scan?.imageUrl;
  if (!heatmapUrl) {
    console.warn('No heatmap or image URL found for scan:', scan);
    return '';
  }
  if (heatmapUrl.startsWith('data:image/')) return heatmapUrl; // base64
  if (heatmapUrl.startsWith('https://')) return heatmapUrl; // absolute HTTPS
  if (heatmapUrl.startsWith('http')) return heatmapUrl; // absolute HTTP
    const base = (typeof process !== 'undefined' && process.env && process.env.REACT_APP_BACKEND_URL)
        || (typeof window !== 'undefined' && window.location.origin.replace(/:\d+$/, ':5000'))
        || 'http://localhost:5000';
    return `${base}${heatmapUrl.startsWith('/') ? '' : '/'}${heatmapUrl}`;
}

export const generatePatientReport = async (scanData, doctorData, patientData, aiExplanation, doctorNotes) => {
  try {
    console.log('Generating PDF report with data:', {
      scanData: {
        ...scanData,
        heatmap_url: scanData?.heatmap_url,
        image_url: scanData?.image_url
      },
      patientData,
      doctorData
    });
    
    // Generate HTML content using the new template
    const htmlContent = generateReportHTML(scanData, doctorData, patientData, aiExplanation, doctorNotes);
    
    // Create a hidden iframe for PDF generation
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.top = '-9999px';
    iframe.style.left = '-9999px';
    iframe.style.width = '210mm';
    iframe.style.height = '297mm';
    document.body.appendChild(iframe);
    
    // Write content to iframe
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    iframeDoc.write(htmlContent);
    iframeDoc.close();
    
    // Wait for content to load including images
    await new Promise(resolve => {
      const images = iframeDoc.querySelectorAll('img');
      let loadedCount = 0;
      const totalImages = images.length;
      
      console.log(`Waiting for ${totalImages} images to load for PDF generation`);
      console.log('Images found:', Array.from(images).map(img => img.src));
      
      if (totalImages === 0) {
        console.log('No images to wait for');
        resolve();
        return;
      }
      
      const checkComplete = () => {
        loadedCount++;
        console.log(`Image ${loadedCount}/${totalImages} loaded`);
        if (loadedCount === totalImages) {
          console.log('All images loaded, generating PDF');
          setTimeout(resolve, 500); // Small delay to ensure rendering
        }
      };
      
      images.forEach((img, index) => {
        console.log(`Checking image ${index}: ${img.src}`);
        
        if (img.complete && img.naturalHeight !== 0) {
          console.log(`Image ${index} already loaded`);
          checkComplete();
        } else {
          img.onload = () => {
            console.log(`Image ${index} loaded successfully:`, img.src);
            checkComplete();
          };
          img.onerror = (error) => {
            console.warn(`Image ${index} failed to load:`, img.src, error);
            checkComplete(); // Continue even if image fails
          };
          
          // Ensure image loads by setting source again if needed
          const originalSrc = img.src;
          if (originalSrc && !img.complete) {
            img.src = originalSrc;
          }
        }
      });
      
      // Timeout fallback - don't wait forever
      setTimeout(() => {
        console.log('Image loading timeout, proceeding with PDF generation');
        resolve();
      }, 8000); // Increased timeout for better reliability
    });
    
    // Trigger print dialog
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    
    // Clean up after print
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);
    
    // Generate filename
    const patientName = patientData?.data?.full_name || patientData?.name || 'Patient';
    const timestamp = new Date().toISOString().split('T')[0];
    const diagnosis = scanData?.prediction || 'Analysis';
    const filename = `OptiPro_Medical_Report_${patientName.replace(/\s+/g, '_')}_${diagnosis}_${timestamp}.pdf`;
    
    return { success: true, filename };
    
  } catch (error) {
    console.error('PDF generation error:', error);
    return { success: false, error: error.message };
  }
};

const generateReportHTML = (scanData, doctorData, patientData, aiExplanation, doctorNotes) => {
  console.log('generateReportHTML called with:', {
    scanData: {
      ...scanData,
      heatmap_url: scanData?.heatmap_url,
      image_url: scanData?.image_url
    }
  });
  
  const currentDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  const currentTime = new Date().toLocaleTimeString();
  
  // Generate simple report ID (RP-XXXX)
  const randomNum = Math.floor(Math.random() * 9000) + 1000;
  const reportId = `RP-${randomNum}`;
  
  // Extract patient data
  const patient = patientData?.data || patientData || {};
  const doctor = doctorData || {};
  const scan = scanData || {};
  
  console.log('Extracted scan data:', scan);
  console.log('Heatmap URL for PDF:', getHeatmapUrl(scan));
  
  // Parse AI explanation for different sections
  const parsedExplanation = parseAIExplanation(aiExplanation);
  
  // Determine diagnosis color and severity
  const diagnosis = scan.prediction || scan.diagnosis || 'Analysis Pending';
  const confidence = scan.confidence || '0%';
  const diagnosisInfo = getDiagnosisInfo(diagnosis);
    const hasHeatmap = Boolean(scan.heatmap_url || scan.heatmapUrl || scan.image_url || scan.imageUrl);

  // moved getHeatmapUrl to top-level to avoid no-use-before-define
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OptiPro Medical Report</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            background: #fff;
        }

        .report-container {
            max-width: 210mm;
            margin: 0 auto;
            padding: 20px;
            background: white;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }

        /* Header Section */
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 3px solid #2c5aa0;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }

        .logo-section {
            display: flex;
            align-items: center;
            gap: 15px;
        }

        .logo {
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, #2c5aa0, #4a7bc8);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 24px;
            font-weight: bold;
        }

        .company-info h1 {
            font-size: 28px;
            color: #2c5aa0;
            font-weight: bold;
            margin-bottom: 5px;
        }

        .company-info p {
            color: #666;
            font-size: 14px;
        }

        .doctor-info {
            text-align: right;
        }

        .doctor-info h3 {
            color: #2c5aa0;
            font-size: 18px;
            margin-bottom: 5px;
        }

        .doctor-info p {
            font-size: 14px;
            color: #666;
            margin-bottom: 2px;
        }

        /* Patient Information Section */
        .patient-section {
            background: #f8f9ff;
            border-left: 4px solid #2c5aa0;
            padding: 25px;
            margin-bottom: 30px;
            border-radius: 8px;
        }

        .section-title {
            font-size: 20px;
            color: #2c5aa0;
            margin-bottom: 20px;
            font-weight: bold;
            border-bottom: 2px solid #e1e8ff;
            padding-bottom: 8px;
        }

        .patient-details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 25px;
        }

        .patient-info-left, .patient-info-right {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .info-row {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .info-label {
            font-weight: bold;
            color: #2c5aa0;
            min-width: 120px;
        }

        .info-value {
            color: #333;
            padding: 5px 10px;
            background: white;
            border-radius: 4px;
            border: 1px solid #e1e8ff;
        }

        /* Diagnosis Section */
        .diagnosis-section {
            display: grid;
            grid-template-columns: 1fr 300px;
            gap: 30px;
            margin-bottom: 30px;
        }

        .diagnosis-details {
            background: ${diagnosisInfo.backgroundColor};
            border-left: 4px solid ${diagnosisInfo.borderColor};
            padding: 20px;
            border-radius: 8px;
        }

        .diagnosis-title {
            font-size: 18px;
            color: ${diagnosisInfo.borderColor};
            margin-bottom: 15px;
            font-weight: bold;
        }

        .diagnosis-result {
            font-size: 16px;
            color: #333;
            margin-bottom: 10px;
            padding: 10px;
            background: white;
            border-radius: 6px;
            border: 1px solid ${diagnosisInfo.lightBorderColor};
        }

        .confidence-score {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-top: 15px;
        }

        .confidence-bar {
            flex: 1;
            height: 8px;
            background: #e5e7eb;
            border-radius: 4px;
            overflow: hidden;
        }

        .confidence-fill {
            height: 100%;
            background: linear-gradient(90deg, ${diagnosisInfo.borderColor}, ${diagnosisInfo.lightBorderColor});
            width: ${confidence};
            transition: width 0.3s ease;
        }

        .eye-image-container {
            background: white;
            border: 2px solid #e1e8ff;
            border-radius: 12px;
            padding: 15px;
            text-align: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .eye-image {
            width: 100%;
            height: 200px;
            background: linear-gradient(135deg, #f3f4f6, #e5e7eb);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #666;
            font-size: 14px;
            margin-bottom: 10px;
            position: relative;
            overflow: hidden;
            border: 2px solid #e5e7eb;
        }

        .eye-image::before {
            content: "${hasHeatmap ? '' : '👁️'}";
            font-size: 48px;
            opacity: 0.3;
            position: absolute;
            z-index: 1;
        }

        .eye-image img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 6px;
            position: relative;
            z-index: 2;
            background: white;
        }

        .image-caption {
            font-size: 12px;
            color: #666;
            font-style: italic;
        }

        /* Treatment Sections - Move to next page */
        .treatment-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 25px;
            margin-bottom: 30px;
            page-break-before: always;
            margin-top: 50px;
        }

        .treatment-card {
            background: white;
            border: 1px solid #e1e8ff;
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 2px 8px rgba(44, 90, 160, 0.1);
        }

        .treatment-card h3 {
            color: #2c5aa0;
            font-size: 16px;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .treatment-card ul {
            list-style: none;
            padding: 0;
        }

        .treatment-card li {
            padding: 8px 0;
            border-bottom: 1px solid #f0f0f0;
            color: #555;
        }

        .treatment-card li:last-child {
            border-bottom: none;
        }

        .treatment-card li::before {
            content: "•";
            color: #2c5aa0;
            font-weight: bold;
            margin-right: 8px;
        }

        /* Doctor's Notes - Ensure it's on second page */
        .notes-section {
            background: #fffbf0;
            border-left: 4px solid #f59e0b;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
            margin-top: 30px;
        }

        .notes-content {
            background: white;
            padding: 15px;
            border-radius: 6px;
            border: 1px solid #fde68a;
            min-height: 100px;
            color: #333;
            line-height: 1.8;
        }

        /* Footer */
        .footer {
            text-align: center;
            padding-top: 20px;
            border-top: 2px solid #e1e8ff;
            color: #666;
            font-size: 12px;
        }

        .footer p {
            margin-bottom: 5px;
        }

        /* Print Styles */
        @media print {
            .report-container {
                box-shadow: none;
                margin: 0;
                max-width: none;
            }
            
            body {
                background: white;
            }
        }

        /* Icons */
        .icon {
            font-size: 14px;
            opacity: 0.8;
        }
    </style>
</head>
<body>
    <div class="report-container">
        <!-- Header Section -->
        <div class="header">
            <div class="logo-section">
                <div class="logo">OP</div>
                <div class="company-info">
                    <h1>OptiPro</h1>
                    <p>Advanced Eye Disease Recognition System</p>
                </div>
            </div>
            <div class="doctor-info">
                <h3>Dr. ${doctor.name || 'Medical Professional'}</h3>
                <p>${doctor.specialization || 'Ophthalmologist'}</p>
                <p>MD, FRCS (Ophth)</p>
                <p>License: ${doctor.license || '#N/A'}</p>
                <p>📞 ${doctor.phone || '+1 (555) 123-4567'}</p>
                <p>📧 ${doctor.email || 'doctor@optipro.com'}</p>
            </div>
        </div>

        <!-- Patient Information Section -->
        <div class="patient-section">
            <h2 class="section-title">Patient Information</h2>
            <div class="patient-details">
                <div class="patient-info-left">
                    <div class="info-row">
                        <span class="info-label">Patient Name:</span>
                        <span class="info-value">${patient.full_name || patient.name || 'N/A'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Patient ID:</span>
                        <span class="info-value">${patient.id ? `PT-${(patient.id.replace(/\D/g, '').slice(-4) || Math.floor(Math.random() * 9000) + 1000)}` : 'N/A'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Age:</span>
                        <span class="info-value">${patient.age || 'N/A'} years</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Gender:</span>
                        <span class="info-value">${patient.gender || 'N/A'}</span>
                    </div>
                </div>
                <div class="patient-info-right">
                    <div class="info-row">
                        <span class="info-label">Date of Exam:</span>
                        <span class="info-value">${currentDate}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Report ID:</span>
                        <span class="info-value">${reportId}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Contact:</span>
                        <span class="info-value">${patient.phone || 'N/A'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Emergency Contact:</span>
                        <span class="info-value">${patient.emergency_contact || 'N/A'}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Diagnosis Section -->
        <div class="diagnosis-section">
            <div class="diagnosis-details">
                <h3 class="diagnosis-title">🔬 AI Diagnosis Results</h3>
                <div class="diagnosis-result">
                    <strong>Primary Diagnosis:</strong> ${diagnosis}
                </div>
                <div class="diagnosis-result">
                    <strong>Analysis Details:</strong> ${diagnosisInfo.description}
                </div>
                <div class="confidence-score">
                    <span><strong>Confidence Score:</strong></span>
                    <div class="confidence-bar">
                        <div class="confidence-fill"></div>
                    </div>
                    <span><strong>${confidence}</strong></span>
                </div>
            </div>
            <div class="eye-image-container">
                <div class="eye-image">
                                        ${hasHeatmap ? 
                                            `<img src="${getHeatmapUrl(scan)}" alt="AI Heatmap Analysis" crossorigin="anonymous" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px; display: block;" />` : 
                      '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #999; font-size: 14px;">No heatmap available</div>'
                    }
                </div>
                <p class="image-caption">Heatmap Analysis - ${scan.eye || 'Retinal Scan'}</p>
                <p class="image-caption">Captured: ${new Date(scan.created_at || Date.now()).toLocaleDateString()} ${new Date(scan.created_at || Date.now()).toLocaleTimeString()}</p>
            </div>
        </div>

        <!-- Treatment Sections -->
        <div class="treatment-grid">
            ${parsedExplanation.medications.length > 0 ? `
            <div class="treatment-card">
                <h3><span class="icon">💊</span> Treatment Recommendations</h3>
                <ul>
                    ${parsedExplanation.medications.map(med => `<li>${med}</li>`).join('')}
                </ul>
            </div>
            ` : `
            <div class="treatment-card">
                <h3><span class="icon">💊</span> Treatment Recommendations</h3>
                <ul>
                    <li>Consult with ophthalmologist for personalized treatment plan</li>
                    <li>Regular follow-up examinations as recommended</li>
                    <li>Monitor symptoms and report any changes</li>
                </ul>
            </div>
            `}

            <div class="treatment-card">
                <h3><span class="icon">📋</span> Clinical Recommendations</h3>
                <ul>
                    ${parsedExplanation.recommendations.length > 0 ? 
                      parsedExplanation.recommendations.map(rec => `<li>${rec}</li>`).join('') :
                      `
                      <li>Regular retinal screening</li>
                      <li>Follow-up examination in 3-6 months</li>
                      <li>Maintain healthy lifestyle</li>
                      <li>Monitor for vision changes</li>
                      `
                    }
                </ul>
            </div>
        </div>

        <!-- Doctor's Notes -->
        <div class="notes-section">
            <h3 class="section-title">📝 Doctor's Notes</h3>
            <div class="notes-content">
                ${doctorNotes || parsedExplanation.overview || 'No additional clinical notes provided at this time. Patient advised to follow standard post-examination care guidelines and return for scheduled follow-up appointment.'}
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p><strong>OptiPro Medical Center</strong> | Advanced AI-Powered Retinal Analysis</p>
            <p>Phone: +1 (555) OPTIPRO | Email: info@optipro.com | Web: www.optipro.com</p>
            <p>This report was generated using AI-assisted diagnosis technology. Clinical correlation is advised.</p>
            <p style="margin-top: 15px; font-size: 11px;">© 2025 OptiPro. All rights reserved. Report generated on ${currentDate} at ${currentTime}</p>
        </div>
    </div>
</body>
</html>`;
};

const parseAIExplanation = (explanation) => {
  const sections = {
    symptoms: [],
    medications: [],
    recommendations: [],
    overview: ''
  };

  if (!explanation) return sections;

  const lines = explanation.split('\n').filter(line => line.trim());
  let currentSection = 'overview';
  let overviewText = '';

  for (const line of lines) {
    if (line.includes('**Symptoms**') || line.toLowerCase().includes('symptoms:')) {
      currentSection = 'symptoms';
    } else if (line.includes('**Medications**') || line.includes('**Treatment**') || line.toLowerCase().includes('medications:') || line.toLowerCase().includes('treatment:')) {
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

  sections.overview = overviewText.trim();
  return sections;
};

const getDiagnosisInfo = (diagnosis) => {
  const diagnosisMap = {
    'CNV': {
      backgroundColor: '#fff5f5',
      borderColor: '#dc2626',
      lightBorderColor: '#fecaca',
      description: 'Choroidal Neovascularization detected with high confidence'
    },
    'DME': {
      backgroundColor: '#fffbeb',
      borderColor: '#d97706',
      lightBorderColor: '#fed7aa',
      description: 'Diabetic Macular Edema indicators present'
    },
    'DRUSEN': {
      backgroundColor: '#fefce8',
      borderColor: '#ca8a04',
      lightBorderColor: '#fde68a',
      description: 'Drusen deposits identified in retinal analysis'
    },
    'NORMAL': {
      backgroundColor: '#f0fdf4',
      borderColor: '#16a34a',
      lightBorderColor: '#bbf7d0',
      description: 'No significant pathological findings detected'
    }
  };

  return diagnosisMap[diagnosis] || {
    backgroundColor: '#f8fafc',
    borderColor: '#64748b',
    lightBorderColor: '#cbd5e1',
    description: 'Analysis completed - review recommended'
  };
};

const pdfService = { generatePatientReport };

export default pdfService;
