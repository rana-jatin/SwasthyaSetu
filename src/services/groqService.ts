import {generateMoEMedicalResponse} from './moeMedicalGroq';

const GROQ_API_KEY = "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";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

export interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | Array<{
    type: 'text' | 'image_url';
    text?: string;
    image_url?: {
      url: string;
    };
  }>;
}

export interface FileAnalysisResult {
  analysis: string;
  extractedText?: string;
  metadata?: {
    fileName: string;
    fileType: string;
    fileSize: number;
    uploadDate: Date;
  };
}

export const generateGroqResponse = async (messages: GroqMessage[]): Promise<string> => {
  try {
    console.log('Calling Enhanced Medical Groq API with messages:', messages.length);
    
    // Detect if query is medical/health-related
    const isMedicalQuery = await detectMedicalQuery(messages);
    
    if (isMedicalQuery) {
      return await generateMedicalEnsembleResponse(messages);
    } else {
      return await generateStandardResponse(messages);
    }
  } catch (error) {
    console.error('Error in enhanced Groq API call:', error);
    throw new Error('Failed to generate response. Please try again.');
  }
};

// Detect if the query is medical/health-related
const detectMedicalQuery = async (messages: GroqMessage[]): Promise<boolean> => {
  const lastMessage = messages[messages.length - 1]?.content || '';
  const medicalKeywords = [
    'symptom', 'disease', 'medicine', 'treatment', 'diagnosis', 'health', 'pain',
    'ayurveda', 'herbs', 'doshas', 'vata', 'pitta', 'kapha', 'chakra', 'pranayama',
    'medication', 'doctor', 'hospital', 'therapy', 'cure', 'remedy', 'wellness',
    'immunity', 'diet', 'nutrition', 'yoga', 'meditation', 'healing', 'dosha'
  ];
  
  return medicalKeywords.some(keyword => 
    lastMessage.toLowerCase().includes(keyword.toLowerCase())
  );
};

// Enhanced medical response using mixture of experts
const generateMedicalEnsembleResponse = async (messages: GroqMessage[]): Promise<string> => {
  console.log('Generating medical ensemble response');
  
  // Parallel expert consultations
  const expertPromises = [
    generateModernMedicalResponse(messages),
    generateAyurvedicResponse(messages),
    generateIntegrativeMedicalResponse(messages)
  ];
  
  try {
    const expertResponses = await Promise.allSettled(expertPromises);
    const validResponses = expertResponses
      .filter(result => result.status === 'fulfilled')
      .map(result => (result as PromiseFulfilledResult<string>).value);
    
    if (validResponses.length === 0) {
      throw new Error('All medical experts failed to respond');
    }
    
    // Synthesize responses using ensemble method
    return await synthesizeMedicalResponses(validResponses, messages);
  } catch (error) {
    console.error('Medical ensemble failed, falling back to standard:', error);
    return await generateStandardResponse(messages);
  }
};

// Modern medicine expert
const generateModernMedicalResponse = async (messages: GroqMessage[]): Promise<string> => {
  const enhancedMessages = [
    {
      role: 'system',
      content: `You are a medical expert specializing in evidence-based modern medicine. 
      Provide accurate, scientifically-backed medical information. Always include:
      - Evidence-based recommendations
      - Proper medical disclaimers
      - Suggestions to consult healthcare professionals
      - Citations when possible
      - Safety warnings for serious conditions`
    },
    ...messages
  ];
  
  return await callGroqAPI(enhancedMessages, {
    model: 'meta-llama/llama-4-maverick-17b-128e-instruct',
    temperature: 0.3, // Lower for medical accuracy
    max_tokens: 1024,
  });
};

// Ayurvedic medicine expert
const generateAyurvedicResponse = async (messages: GroqMessage[]): Promise<string> => {
  const enhancedMessages = [
    {
      role: 'system',
      content: `You are an Ayurvedic medicine expert with deep knowledge of traditional Indian healing systems.
      Provide information about:
      - Dosha analysis (Vata, Pitta, Kapha)
      - Traditional herbs and remedies
      - Lifestyle recommendations
      - Dietary guidelines according to Ayurveda
      - Yoga and pranayama practices
      - Seasonal routines (Ritucharya)
      Always emphasize consulting qualified Ayurvedic practitioners and mention that Ayurvedic advice should complement, not replace, modern medical care for serious conditions.`
    },
    ...messages
  ];
  
  return await callGroqAPI(enhancedMessages, {
    model: 'meta-llama/llama-4-maverick-17b-128e-instruct',
    temperature: 0.4,
    max_tokens: 1024,
  });
};

// Integrative medicine expert
const generateIntegrativeMedicalResponse = async (messages: GroqMessage[]): Promise<string> => {
  const enhancedMessages = [
    {
      role: 'system',
      content: `You are an integrative medicine expert who combines modern medical knowledge with traditional healing systems.
      Focus on:
      - Holistic treatment approaches
      - Evidence-based complementary therapies
      - Mind-body medicine
      - Nutritional medicine
      - Preventive healthcare
      - Integration of traditional and modern approaches
      Always provide balanced perspectives and emphasize professional medical consultation.`
    },
    ...messages
  ];
  
  return await callGroqAPI(enhancedMessages, {
    model: 'meta-llama/llama-4-maverick-17b-128e-instruct',
    temperature: 0.35,
    max_tokens: 1024,
  });
};

// Synthesize multiple expert responses
const synthesizeMedicalResponses = async (responses: string[], originalMessages: GroqMessage[]): Promise<string> => {
  const synthesisPrompt = [
    {
      role: 'system',
      content: `You are a medical response synthesizer. Your task is to create a comprehensive, accurate response by combining insights from multiple medical experts.
      
      Combine the following expert responses into a single, coherent answer that:
      - Prioritizes safety and accuracy
      - Includes both modern and traditional perspectives when relevant
      - Maintains proper medical disclaimers
      - Presents information in a clear, organized manner
      - Highlights areas of consensus and notes differences
      - Always recommends professional medical consultation
      
      Expert Responses to Synthesize:
      ${responses.map((response, index) => `Expert ${index + 1}: ${response}`).join('\n\n')}`
    },
    ...originalMessages
  ];
  
  return await callGroqAPI(synthesisPrompt, {
    model: 'meta-llama/llama-4-maverick-17b-128e-instruct',
    temperature: 0.2, // Very low for synthesis accuracy
    max_tokens: 1536, // Larger for comprehensive synthesis
  });
};

// Standard non-medical response
const generateStandardResponse = async (messages: GroqMessage[]): Promise<string> => {
  return await callGroqAPI(messages, {
    model: 'meta-llama/llama-4-maverick-17b-128e-instruct',
    temperature: 0.7,
    max_tokens: 1024,
  });
};

// Core API call function
const callGroqAPI = async (messages: any[], config: any): Promise<string> => {
  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages: messages,
      ...config,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Groq API error:', response.status, errorText);
    throw new Error(`Groq API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
};

// Additional utility functions for enhanced medical accuracy
const addMedicalSafetyDisclaimer = (response: string): string => {
  const disclaimer = "\n\n⚠️ Medical Disclaimer: This information is for educational purposes only and should not replace professional medical advice. Always consult with qualified healthcare providers for medical concerns.";
  return response + disclaimer;
};

// Enhanced error handling for medical queries
const handleMedicalError = (error: Error): string => {
  console.error('Medical query error:', error);
  return "I apologize, but I'm unable to provide medical information at this time. Please consult with a qualified healthcare professional for medical advice and concerns.";
};

export const generateVisionResponse = async (imageBase64: string, userQuestion: string): Promise<string> => {
  try {
    console.log('Calling Groq Vision API for image analysis');
    
    const messages: GroqMessage[] = [
      {
        role: 'system',
        content: 'You are a helpful AI assistant that can analyze images in detail. Provide comprehensive and accurate descriptions and answer questions about what you see in images.'
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: userQuestion
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${imageBase64}`
            }
          }
        ]
      }
    ];

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-maverick-17b-128e-instruct',
        messages: messages,
        temperature: 0.3,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq Vision API error:', response.status, errorText);
      throw new Error(`Groq Vision API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Groq Vision API response received');
    return data.choices[0]?.message?.content || 'Sorry, I could not analyze the image.';
  } catch (error) {
    console.error('Error calling Groq Vision API:', error);
    throw new Error('Failed to analyze image. Please try again.');
  }
};

export const generateReasoningResponse = async (messages: GroqMessage[], context?: string): Promise<string> => {
  try {
    console.log('Calling Enhanced Medical Reasoning API');
    
    // Detect if query is medical/health-related
    const isMedicalQuery = await detectMedicalReasoningQuery(messages, context);
    
    if (isMedicalQuery) {
      return await generateMedicalReasoningEnsemble(messages, context);
    } else {
      return await generateStandardReasoningResponse(messages, context);
    }
  } catch (error) {
    console.error('Error in enhanced Reasoning API call:', error);
    throw new Error('Failed to generate reasoning response. Please try again.');
  }
};

// Enhanced medical query detection for reasoning tasks
const detectMedicalReasoningQuery = async (messages: GroqMessage[], context?: string): Promise<boolean> => {
  const lastMessage = messages[messages.length - 1]?.content || '';
  const contextText = context || '';
  const combinedText = `${lastMessage} ${contextText}`.toLowerCase();
  
  const medicalReasoningKeywords = [
    // Medical reasoning terms
    'diagnosis', 'differential diagnosis', 'pathophysiology', 'etiology', 'prognosis',
    'clinical reasoning', 'medical case', 'symptom analysis', 'disease mechanism',
    'pharmacology', 'drug interaction', 'side effects', 'contraindication',
    'treatment protocol', 'therapeutic approach', 'evidence-based medicine',
    
    // Ayurvedic reasoning terms
    'dosha imbalance', 'vata analysis', 'pitta assessment', 'kapha evaluation',
    'prakriti assessment', 'vikriti analysis', 'nadi pariksha', 'pulse diagnosis',
    'rasa', 'virya', 'vipaka', 'prabhava', 'ayurvedic reasoning', 'classical texts',
    'charaka samhita', 'sushruta samhita', 'ashtanga hridaya',
    
    // General medical terms
    'symptom', 'disease', 'medicine', 'treatment', 'health analysis', 'medical reasoning',
    'clinical decision', 'patient case', 'therapeutic reasoning', 'drug mechanism',
    'ayurveda', 'herbs', 'doshas', 'chakra', 'pranayama', 'wellness analysis'
  ];
  
  return medicalReasoningKeywords.some(keyword => combinedText.includes(keyword));
};

// Enhanced medical reasoning using mixture of experts
const generateMedicalReasoningEnsemble = async (messages: GroqMessage[], context?: string): Promise<string> => {
  console.log('Generating medical reasoning ensemble response');
  
  // Parallel expert reasoning consultations
  const expertPromises = [
    generateClinicalReasoningResponse(messages, context),
    generateAyurvedicReasoningResponse(messages, context),
    generateIntegrativeReasoningResponse(messages, context),
    generateEvidenceBasedReasoningResponse(messages, context)
  ];
  
  try {
    const expertResponses = await Promise.allSettled(expertPromises);
    const validResponses = expertResponses
      .filter(result => result.status === 'fulfilled')
      .map(result => (result as PromiseFulfilledResult<string>).value);
    
    if (validResponses.length === 0) {
      throw new Error('All medical reasoning experts failed to respond');
    }
    
    // Synthesize responses using advanced reasoning ensemble
    return await synthesizeMedicalReasoningResponses(validResponses, messages, context);
  } catch (error) {
    console.error('Medical reasoning ensemble failed, falling back to standard:', error);
    return await generateStandardReasoningResponse(messages, context);
  }
};

// Clinical reasoning expert
const generateClinicalReasoningResponse = async (messages: GroqMessage[], context?: string): Promise<string> => {
  const clinicalContext = context 
    ? `Clinical reasoning context: ${context}. Apply systematic clinical thinking including differential diagnosis, pathophysiology analysis, and evidence-based decision making.`
    : 'Apply systematic clinical reasoning including differential diagnosis, pathophysiology analysis, and evidence-based medical decision making.';
    
  const enhancedMessages = [
    {
      role: 'system',
      content: `You are a clinical reasoning expert with advanced capabilities in medical logic and systematic thinking. ${clinicalContext}
      
      Your reasoning should include:
      - Systematic differential diagnosis approach
      - Pathophysiological reasoning
      - Evidence hierarchy evaluation (RCTs, meta-analyses, guidelines)
      - Risk-benefit analysis
      - Clinical decision trees
      - Diagnostic accuracy considerations
      - Treatment efficacy reasoning
      
      Always show your step-by-step clinical reasoning process and cite evidence levels when possible.`
    },
    ...messages
  ];
  
  return await callReasoningAPI(enhancedMessages, {
    temperature: 0.2, // Very low for clinical accuracy
    max_tokens: 1536,
  });
};

// Ayurvedic reasoning expert
const generateAyurvedicReasoningResponse = async (messages: GroqMessage[], context?: string): Promise<string> => {
  const ayurvedicContext = context 
    ? `Ayurvedic reasoning context: ${context}. Apply traditional Ayurvedic diagnostic and therapeutic reasoning based on classical texts.`
    : 'Apply traditional Ayurvedic diagnostic and therapeutic reasoning based on classical texts and principles.';
    
  const enhancedMessages = [
    {
      role: 'system',
      content: `You are an Ayurvedic reasoning expert with deep knowledge of traditional diagnostic and therapeutic logic. ${ayurvedicContext}
      
      Your reasoning should include:
      - Dosha analysis (Vata, Pitta, Kapha imbalances)
      - Prakriti (constitution) and Vikriti (current state) assessment
      - Nidana (causative factors) identification
      - Samprapti (pathogenesis) according to Ayurvedic principles
      - Rasa-Virya-Vipaka analysis of treatments
      - Classical text references (Charaka, Sushruta, Ashtanga Hridaya)
      - Ritucharya (seasonal) considerations
      - Lifestyle and dietary reasoning based on individual constitution
      
      Show systematic Ayurvedic reasoning process and reference classical principles.`
    },
    ...messages
  ];
  
  return await callReasoningAPI(enhancedMessages, {
    temperature: 0.25,
    max_tokens: 1536,
  });
};

// Integrative reasoning expert
const generateIntegrativeReasoningResponse = async (messages: GroqMessage[], context?: string): Promise<string> => {
  const integrativeContext = context 
    ? `Integrative reasoning context: ${context}. Bridge modern medical science with traditional healing systems using logical analysis.`
    : 'Bridge modern medical science with traditional healing systems using logical analysis and evidence evaluation.';
    
  const enhancedMessages = [
    {
      role: 'system',
      content: `You are an integrative medicine reasoning expert who systematically analyzes both modern and traditional approaches. ${integrativeContext}
      
      Your reasoning should include:
      - Mechanism-based integration of modern and traditional approaches
      - Evidence evaluation for complementary therapies
      - Systems biology perspective on traditional practices
      - Molecular basis for traditional remedies when known
      - Personalized medicine approaches
      - Holistic assessment frameworks
      - Research gap analysis
      - Safety and efficacy reasoning for combined approaches
      
      Demonstrate logical integration of different medical paradigms with critical analysis.`
    },
    ...messages
  ];
  
  return await callReasoningAPI(enhancedMessages, {
    temperature: 0.3,
    max_tokens: 1536,
  });
};

// Evidence-based reasoning expert
const generateEvidenceBasedReasoningResponse = async (messages: GroqMessage[], context?: string): Promise<string> => {
  const evidenceContext = context 
    ? `Evidence-based reasoning context: ${context}. Apply rigorous scientific methodology and statistical reasoning to medical questions.`
    : 'Apply rigorous scientific methodology and statistical reasoning to medical questions with systematic evidence evaluation.';
    
  const enhancedMessages = [
    {
      role: 'system',
      content: `You are an evidence-based medicine reasoning expert specializing in research methodology and statistical analysis. ${evidenceContext}
      
      Your reasoning should include:
      - Systematic literature evaluation
      - Study design quality assessment
      - Statistical significance vs clinical significance analysis
      - Bias identification and mitigation
      - Meta-analysis and systematic review interpretation
      - Number needed to treat (NNT) calculations
      - Confidence interval reasoning
      - P-hacking and publication bias considerations
      - Evidence grading (GRADE methodology)
      
      Show rigorous scientific reasoning process with statistical considerations.`
    },
    ...messages
  ];
  
  return await callReasoningAPI(enhancedMessages, {
    temperature: 0.15, // Lowest for evidence-based accuracy
    max_tokens: 1536,
  });
};

// Advanced reasoning synthesis
const synthesizeMedicalReasoningResponses = async (responses: string[], originalMessages: GroqMessage[], context?: string): Promise<string> => {
  const synthesisContext = context 
    ? `Synthesis context: ${context}. Integrate multiple expert reasoning approaches into a coherent, accurate response.`
    : 'Integrate multiple expert reasoning approaches into a coherent, comprehensive response.';
    
  const synthesisPrompt = [
    {
      role: 'system',
      content: `You are an advanced medical reasoning synthesizer. Your task is to integrate multiple expert reasoning approaches into a single, comprehensive response. ${synthesisContext}
      
      Integration requirements:
      - Maintain the logical rigor of each expert approach
      - Identify areas of convergence and divergence
      - Present a unified reasoning framework
      - Preserve evidence-based foundations
      - Include traditional wisdom where scientifically supported
      - Show step-by-step integrated reasoning process
      - Highlight confidence levels for different aspects
      - Maintain appropriate medical disclaimers
      
      Expert Reasoning Responses to Synthesize:
      Clinical Expert: ${responses[0] || 'Not available'}
      
      Ayurvedic Expert: ${responses[1] || 'Not available'}
      
      Integrative Expert: ${responses[2] || 'Not available'}
      
      Evidence-Based Expert: ${responses[3] || 'Not available'}`
    },
    ...originalMessages
  ];
  
  return await callReasoningAPI(synthesisPrompt, {
    temperature: 0.1, // Extremely low for synthesis accuracy
    max_tokens: 2048, // Larger for comprehensive synthesis
  });
};

// Standard reasoning response
const generateStandardReasoningResponse = async (messages: GroqMessage[], context?: string): Promise<string> => {
  const systemMessage = context 
    ? `You are a helpful AI assistant developed by a group of researchers with advanced reasoning capabilities. Use the following context to answer questions: ${context}`
    : 'You are a helpful AI assistant developed by a group of researchers with advanced reasoning capabilities. Provide detailed, logical responses to complex questions.';

  const enhancedMessages = [
    {
      role: 'system',
      content: systemMessage
    },
    ...messages
  ];
  
  return await callReasoningAPI(enhancedMessages, {
    temperature: 0.4,
    max_tokens: 1024,
  });
};

// Core reasoning API call function
const callReasoningAPI = async (messages: any[], config: any): Promise<string> => {
  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'deepseek-r1-distill-llama-70b',
      messages: messages,
      ...config,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Groq Reasoning API error:', response.status, errorText);
    throw new Error(`Groq Reasoning API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || 'Sorry, I could not generate a reasoning response.';
};

// Enhanced reasoning validation
const validateMedicalReasoning = (response: string): boolean => {
  const requiredElements = [
    'reasoning', 'analysis', 'evidence', 'conclusion'
  ];
  
  return requiredElements.some(element => 
    response.toLowerCase().includes(element)
  );
};

// Add medical reasoning disclaimer
const addMedicalReasoningDisclaimer = (response: string): string => {
  const disclaimer = "\n\n⚠️ Medical Reasoning Disclaimer: This analysis is for educational and research purposes only. The reasoning presented should not replace professional medical judgment or clinical decision-making. Always consult qualified healthcare professionals for medical diagnosis and treatment decisions.";
  return response + disclaimer;
};
