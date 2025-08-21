import { jsPDF } from 'jspdf';

export const generatePatientReport = async (scanData, doctorData, patientData, aiExplanation, doctorNotes) => {
  try {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Enhanced Color Palette
    const primaryColor = [102, 126, 234]; // #667eea
    const secondaryColor = [45, 55, 72]; // #2d3748
    const accentColor = [99, 179, 237]; // #63b3ed
    const lightGray = [128, 128, 128]; // #808080
    const darkGray = [64, 64, 64]; // #404040
    const backgroundGray = [248, 250, 252]; // #f8fafc
    const successColor = [16, 185, 129]; // #10b981
    const warningColor = [245, 158, 11]; // #f59e0b
    const errorColor = [239, 68, 68]; // #ef4444
    
    // Professional Header with Medical Theme
    pdf.setFillColor(...primaryColor);
    pdf.rect(0, 0, pageWidth, 40, 'F');
    
    // Medical Cross Pattern Background
    pdf.setFillColor(255, 255, 255);
    // Removed alpha blending as it's not supported in jsPDF
    for (let i = 0; i < pageWidth; i += 15) {
      for (let j = 0; j < 40; j += 15) {
        pdf.setFillColor(240, 245, 255); // Light blue instead of alpha
        pdf.rect(i + 5, j + 5, 2, 8, 'F');
        pdf.rect(i + 3, j + 7, 6, 2, 'F');
      }
    }
    
    // OptiPro Medical Logo
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(28);
    pdf.setFont('helvetica', 'bold');
    pdf.text('👁️ OPTIPRO', 15, 22);
    
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Advanced Retinal Analysis & Diagnostic System', 15, 30);
    
    // Professional Medical Header (right side)
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text('MEDICAL REPORT', pageWidth - 15, 15, { align: 'right' });
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Dr. ${doctorData?.name || 'N/A'}`, pageWidth - 15, 22, { align: 'right' });
    pdf.text(`${doctorData?.specialization || 'Ophthalmology'}`, pageWidth - 15, 28, { align: 'right' });
    pdf.text(`License: ${doctorData?.license || 'N/A'}`, pageWidth - 15, 34, { align: 'right' });
    
    let yPosition = 55;
    
    // Professional Report Title
    pdf.setTextColor(...secondaryColor);
    pdf.setFontSize(22);
    pdf.setFont('helvetica', 'bold');
    pdf.text('RETINAL SCAN ANALYSIS REPORT', pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 15;
    
    // Report Metadata with Professional Layout
    const currentDate = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const reportId = `RPT-${Date.now()}`;
    
    pdf.setFillColor(...backgroundGray);
    pdf.rect(15, yPosition - 3, pageWidth - 30, 16, 'F');
    pdf.setDrawColor(...lightGray);
    pdf.setLineWidth(0.3);
    pdf.rect(15, yPosition - 3, pageWidth - 30, 16);
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...darkGray);
    pdf.text(`Report Date: ${currentDate}`, 20, yPosition + 4);
    pdf.text(`Report ID: ${reportId}`, 20, yPosition + 10);
    pdf.text(`Generated: ${new Date().toLocaleTimeString()}`, pageWidth - 20, yPosition + 4, { align: 'right' });
    pdf.text(`Page 1 of 1`, pageWidth - 20, yPosition + 10, { align: 'right' });
    
    yPosition += 25;
    
    // Enhanced Patient Information Section
    pdf.setFillColor(...backgroundGray);
    pdf.rect(15, yPosition - 5, pageWidth - 30, 40, 'F');
    pdf.setDrawColor(...accentColor);
    pdf.setLineWidth(1);
    pdf.rect(15, yPosition - 5, pageWidth - 30, 40);
    
    pdf.setTextColor(...primaryColor);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('👤 PATIENT INFORMATION', 20, yPosition + 5);
    
    // Patient info with improved layout
    pdf.setTextColor(...secondaryColor);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    yPosition += 15;
    
    const leftCol = 25;
    const rightCol = pageWidth / 2 + 15;
    
    pdf.setFont('helvetica', 'bold');
    pdf.text('Patient Name:', leftCol, yPosition);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`${patientData?.data?.full_name || patientData?.name || 'N/A'}`, leftCol + 35, yPosition);
    
    pdf.setFont('helvetica', 'bold');
    pdf.text('Gender:', rightCol, yPosition);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`${patientData?.data?.gender || patientData?.gender || 'N/A'}`, rightCol + 20, yPosition);
    
    yPosition += 8;
    
    pdf.setFont('helvetica', 'bold');
    pdf.text('Age:', leftCol, yPosition);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`${patientData?.data?.age || patientData?.age || 'N/A'} years`, leftCol + 12, yPosition);
    
    pdf.setFont('helvetica', 'bold');
    pdf.text('Contact:', rightCol, yPosition);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`${patientData?.data?.phone || patientData?.phone || 'N/A'}`, rightCol + 20, yPosition);
    
    yPosition += 8;
    
    pdf.setFont('helvetica', 'bold');
    pdf.text('Email:', leftCol, yPosition);
    pdf.setFont('helvetica', 'normal');
    const emailText = patientData?.data?.email || patientData?.email || 'N/A';
    pdf.text(emailText.length > 25 ? emailText.substring(0, 25) + '...' : emailText, leftCol + 15, yPosition);
    
    yPosition += 25;
    
    // Enhanced AI Diagnosis Section
    pdf.setFillColor(...backgroundGray);
    pdf.rect(15, yPosition - 5, pageWidth - 30, 55, 'F');
    pdf.setDrawColor(...accentColor);
    pdf.setLineWidth(1);
    pdf.rect(15, yPosition - 5, pageWidth - 30, 55);
    
    pdf.setTextColor(...primaryColor);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('🤖 AI DIAGNOSIS & ANALYSIS', 20, yPosition + 5);
    
    yPosition += 18;
    
    // Diagnosis with color coding and confidence visualization
    const diagnosis = scanData?.prediction || 'N/A';
    const confidence = scanData?.confidence || '0%';
    const confidenceValue = parseFloat(confidence.replace('%', ''));
    
    // Color-coded diagnosis
    const diagnosisColors = {
      'CNV': errorColor,
      'DME': warningColor,
      'DRUSEN': [241, 196, 15],
      'NORMAL': successColor
    };
    
    const diagnosisColor = diagnosisColors[diagnosis] || darkGray;
    
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...secondaryColor);
    pdf.text('Diagnosis:', leftCol, yPosition);
    
    pdf.setTextColor(...diagnosisColor);
    pdf.setFontSize(14);
    pdf.text(`${diagnosis}`, leftCol + 30, yPosition);
    
    // Confidence meter visualization
    pdf.setFontSize(11);
    pdf.setTextColor(...secondaryColor);
    pdf.text('Confidence Level:', rightCol, yPosition);
    
    // Draw confidence bar
    const barWidth = 60;
    const barHeight = 8;
    const barX = rightCol + 35;
    const barY = yPosition - 4;
    
    // Background bar
    pdf.setFillColor(220, 220, 220);
    pdf.rect(barX, barY, barWidth, barHeight, 'F');
    
    // Confidence fill
    pdf.setFillColor(...diagnosisColor);
    pdf.rect(barX, barY, (barWidth * confidenceValue) / 100, barHeight, 'F');
    
    // Confidence percentage
    pdf.setFontSize(10);
    pdf.setTextColor(...darkGray);
    pdf.text(`${confidence}`, barX + barWidth + 5, yPosition);
    
    yPosition += 15;
    
    // Scan details
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...darkGray);
    pdf.text(`Scan Date: ${new Date(scanData?.created_at || Date.now()).toLocaleDateString()}`, leftCol, yPosition);
    pdf.text(`Analysis Time: ${new Date(scanData?.created_at || Date.now()).toLocaleTimeString()}`, rightCol, yPosition);
    
    yPosition += 8;
    pdf.text('*Heatmap visualization and detailed analysis available in digital report', leftCol, yPosition);
    
    yPosition += 25;
    
    // Clinical Recommendations (Improved)
    if (aiExplanation && aiExplanation.trim()) {
      // Check if we need a new page
      if (yPosition > pageHeight - 100) {
        pdf.addPage();
        yPosition = 30;
      }
      
      pdf.setFillColor(...backgroundGray);
      pdf.rect(15, yPosition - 5, pageWidth - 30, 12, 'F');
      pdf.setDrawColor(...accentColor);
      pdf.setLineWidth(1);
      pdf.rect(15, yPosition - 5, pageWidth - 30, 12);
      
      pdf.setTextColor(...primaryColor);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('🩺 CLINICAL RECOMMENDATIONS', 20, yPosition + 3);
      
      yPosition += 20;
      
      // Parse and format AI explanation
      const explanationLines = aiExplanation.split('\n').filter(line => line.trim());
      
      for (const line of explanationLines) {
        // Check if we need a new page
        if (yPosition > pageHeight - 40) {
          pdf.addPage();
          yPosition = 30;
        }
        
        if (line.includes('**Symptoms**') || line.toLowerCase().includes('symptoms:')) {
          yPosition += 5;
          pdf.setFillColor(227, 242, 253);
          pdf.rect(20, yPosition - 3, pageWidth - 50, 12, 'F');
          pdf.setTextColor(25, 118, 210);
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'bold');
          pdf.text('👁️ ASSOCIATED SYMPTOMS', 25, yPosition + 5);
          yPosition += 15;
        } else if (line.includes('**Treatment**') || line.includes('**Medications**') || line.toLowerCase().includes('treatment:')) {
          yPosition += 5;
          pdf.setFillColor(243, 229, 245);
          pdf.rect(20, yPosition - 3, pageWidth - 50, 12, 'F');
          pdf.setTextColor(123, 31, 162);
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'bold');
          pdf.text('💊 TREATMENT OPTIONS', 25, yPosition + 5);
          yPosition += 15;
        } else if (line.includes('**Recommendations**') || line.toLowerCase().includes('recommendations:')) {
          yPosition += 5;
          pdf.setFillColor(232, 245, 233);
          pdf.rect(20, yPosition - 3, pageWidth - 50, 12, 'F');
          pdf.setTextColor(56, 142, 60);
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'bold');
          pdf.text('📋 NEXT STEPS', 25, yPosition + 5);
          yPosition += 15;
        } else if (line.startsWith('•') || line.startsWith('-')) {
          const text = line.replace(/^[•-]\s*/, '').trim();
          if (text) {
            pdf.setTextColor(...secondaryColor);
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');
            
            const splitText = pdf.splitTextToSize(`• ${text}`, pageWidth - 70);
            pdf.text(splitText, 30, yPosition);
            yPosition += splitText.length * 5 + 3;
          }
        } else if (line.trim() && !line.includes('*Note:')) {
          pdf.setTextColor(...darkGray);
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          
          const splitText = pdf.splitTextToSize(line.trim(), pageWidth - 70);
          pdf.text(splitText, 30, yPosition);
          yPosition += splitText.length * 5 + 5;
        }
      }
      
      yPosition += 10;
    }
    
    // Doctor's Notes Section (Enhanced)
    if (doctorNotes && doctorNotes.trim()) {
      // Check if we need a new page
      if (yPosition > pageHeight - 80) {
        pdf.addPage();
        yPosition = 30;
      }
      
      pdf.setFillColor(...backgroundGray);
      pdf.rect(15, yPosition - 5, pageWidth - 30, 12, 'F');
      pdf.setDrawColor(...accentColor);
      pdf.setLineWidth(1);
      pdf.rect(15, yPosition - 5, pageWidth - 30, 12);
      
      pdf.setTextColor(...primaryColor);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('📝 PHYSICIAN\'S CLINICAL NOTES', 20, yPosition + 3);
      
      yPosition += 20;
      
      // Notes content with professional formatting
      pdf.setFillColor(255, 255, 255);
      pdf.rect(20, yPosition - 5, pageWidth - 50, 35, 'F');
      pdf.setDrawColor(...lightGray);
      pdf.setLineWidth(0.5);
      pdf.rect(20, yPosition - 5, pageWidth - 50, 35);
      
      pdf.setTextColor(...secondaryColor);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
      const notesLines = pdf.splitTextToSize(doctorNotes.trim(), pageWidth - 70);
      pdf.text(notesLines, 25, yPosition + 5);
      yPosition += Math.max(35, notesLines.length * 5 + 15);
    }
    
    // Professional Footer with Medical Disclaimer
    const footerY = pageHeight - 35;
    pdf.setFillColor(...primaryColor);
    pdf.rect(0, footerY, pageWidth, 35, 'F');
    
    // Footer pattern
    pdf.setFillColor(255, 255, 255);
    // Removed alpha blending as it's not supported in jsPDF
    for (let i = 0; i < pageWidth; i += 20) {
      pdf.setFillColor(220, 230, 255); // Light blue instead of alpha
      pdf.circle(i, footerY + 10, 3, 'F');
      pdf.circle(i + 10, footerY + 25, 2, 'F');
    }
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('OPTIPRO - Advanced Retinal Analysis System', pageWidth / 2, footerY + 12, { align: 'center' });
    
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text('This report is generated by AI-powered analysis for medical reference purposes.', pageWidth / 2, footerY + 19, { align: 'center' });
    pdf.text('Consult a qualified ophthalmologist for comprehensive diagnosis and treatment.', pageWidth / 2, footerY + 25, { align: 'center' });
    
    // Enhanced filename with patient info
    const patientName = patientData?.data?.full_name || patientData?.name || 'Patient';
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `OptiPro_Medical_Report_${patientName.replace(/\s+/g, '_')}_${diagnosis}_${timestamp}.pdf`;
    
    // Save the PDF
    pdf.save(filename);
    
    return { success: true, filename };
    
  } catch (error) {
    console.error('PDF generation error:', error);
    return { success: false, error: error.message };
  }
};

export default { generatePatientReport };
