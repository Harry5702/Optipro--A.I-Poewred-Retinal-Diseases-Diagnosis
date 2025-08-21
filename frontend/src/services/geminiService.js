import { GoogleGenerativeAI } from '@google/generative-ai';

export const getMedicalExplanation = async (diagnosis, confidence) => {
  try {
    const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
    
    // Try different models with fallback
    const models = ['gemini-1.5-flash', 'gemini-1.5-pro'];
    
    for (const modelName of models) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        
        const prompt = `As a medical AI assistant, provide a concise analysis for retinal diagnosis: ${diagnosis} (confidence: ${confidence}%).

        Please structure your response in exactly this format:

        **Symptoms** (3 bullet points):
        • [Primary symptom]
        • [Secondary symptom] 
        • [Additional symptom]

        **Medications:**
        [Brief medication recommendation in 1-2 lines]

        **Recommendations:**
        [Brief clinical recommendations in 1-2 lines]

        Keep each section concise and professional. Use medical terminology appropriate for healthcare professionals.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        if (text && text.trim()) {
          return text.trim();
        }
      } catch (modelError) {
        console.log(`Model ${modelName} failed, trying next...`, modelError);
        continue;
      }
    }
    
    // If all models fail, return fallback
    return getFallbackExplanation(diagnosis, confidence);
    
  } catch (error) {
    console.error('Error getting medical explanation:', error);
    return getFallbackExplanation(diagnosis, confidence);
  }
};

const getFallbackExplanation = (diagnosis, confidence) => {
  const explanations = {
    'CNV': {
      symptoms: [
        'Distorted or wavy central vision',
        'Dark or blank spots in central vision',
        'Difficulty reading or recognizing faces'
      ],
      medications: 'Anti-VEGF injections (ranibizumab, aflibercept) administered intravitreally every 4-8 weeks.',
      recommendations: 'Immediate ophthalmologic referral. Monitor visual acuity changes and consider OCT follow-up.'
    },
    'DME': {
      symptoms: [
        'Blurred or fluctuating central vision',
        'Colors appearing washed out or faded',
        'Difficulty with fine detail work'
      ],
      medications: 'Anti-VEGF therapy or corticosteroid injections. Consider metformin optimization for diabetes.',
      recommendations: 'Strict glycemic control essential. Regular diabetic eye exams and potential laser photocoagulation.'
    },
    'DRUSEN': {
      symptoms: [
        'Gradual central vision changes',
        'Difficulty seeing in low light conditions',
        'Slight visual distortion or blurriness'
      ],
      medications: 'AREDS2 vitamins (vitamin C, E, zinc, copper, lutein, zeaxanthin) for intermediate stages.',
      recommendations: 'Regular monitoring with Amsler grid. Lifestyle modifications: smoking cessation, UV protection.'
    },
    'NORMAL': {
      symptoms: [
        'No apparent retinal pathology detected',
        'Clear central and peripheral vision',
        'Normal retinal vascular patterns'
      ],
      medications: 'No specific medications required. Continue routine eye health maintenance.',
      recommendations: 'Annual comprehensive eye examinations. Maintain healthy lifestyle and UV protection.'
    }
  };

  const info = explanations[diagnosis] || explanations['NORMAL'];
  
  return `**Symptoms:**
• ${info.symptoms[0]}
• ${info.symptoms[1]}
• ${info.symptoms[2]}

**Medications:**
${info.medications}

**Recommendations:**
${info.recommendations}

*Note: This analysis is for informational purposes. Please consult with a qualified ophthalmologist for proper diagnosis and treatment.*`;
};

// Legacy service object for backward compatibility
export const geminiService = {
  async getMedicalExplanation(diagnosis, confidence) {
    const explanation = await getMedicalExplanation(diagnosis, confidence);
    return {
      success: true,
      explanation
    };
  },

  getFallbackExplanation(diagnosis) {
    return getFallbackExplanation(diagnosis, 0);
  }
};

export default geminiService;
