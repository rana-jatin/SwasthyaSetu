
// moeMedicalGroq.ts
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

const getApiKey = (): string => {
  const apiKey = localStorage.getItem('groq_api_key');
  if (!apiKey) {
    throw new Error('Groq API key not configured. Please add your API key in Settings.');
  }
  return apiKey;
};

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type ExpertType = 'diagnostics' | 'pharmacology' | 'radiology' | 'general' | 'ayurveda' | 'cardiology' | 'neurology';

interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ExpertConfig {
  model: string;
  systemPrompt: string;
  temperature: number;
  max_tokens: number;
}

/* ------------------------------------------------------------------ */
/*  Experts setup                                                      */
/* ------------------------------------------------------------------ */

const experts: Record<ExpertType, ExpertConfig> = {
  diagnostics: {
    model: 'llama-4-70b',
    systemPrompt: 'You are an expert medical diagnostician. Provide detailed diagnostic reasoning based on patient symptoms and clinical data.',
    temperature: 0.2,
    max_tokens: 1500,
  },
  pharmacology: {
    model: 'deepseek-r1-distill-llama-70b',
    systemPrompt: 'You are an expert pharmacologist. Answer questions related to medications, drug interactions, pharmacodynamics, and pharmacokinetics accurately and concisely.',
    temperature: 0.2,
    max_tokens: 1200,
  },
  radiology: {
    model: 'llama-4-70b',
    systemPrompt: 'You are a skilled radiologist. Analyze imaging descriptions or radiology reports, and provide accurate, insightful interpretations.',
    temperature: 0.2,
    max_tokens: 1200,
  },
  general: {
    model: 'meta-llama/llama-4-maverick-17b-128e-instruct',
    systemPrompt: 'You are a knowledgeable medical assistant capable of answering a broad range of medical queries clearly and accurately.',
    temperature: 0.5,
    max_tokens: 1024,
  },
  ayurveda: {
    model: 'llama-4-70b',
    systemPrompt: 'You are an expert in Ayurveda medicine. Provide insights based on Ayurvedic principles, herbs, treatments, and lifestyle recommendations.',
    temperature: 0.3,
    max_tokens: 1200,
  },
  cardiology: {
    model: 'llama-4-70b',
    systemPrompt: 'You are an expert cardiologist. Provide detailed and accurate insights into heart-related conditions, diagnostics, treatments, and prevention strategies.',
    temperature: 0.2,
    max_tokens: 1300,
  },
  neurology: {
    model: 'deepseek-r1-distill-llama-70b',
    systemPrompt: 'You are an expert neurologist. Provide detailed explanations on neurological conditions, diagnosis, and treatment plans.',
    temperature: 0.2,
    max_tokens: 1300,
  },
};

/* ------------------------------------------------------------------ */
/*  Expert Router                                                      */
/* ------------------------------------------------------------------ */

const routeToExpert = (userMessage: string): ExpertType => {
  const diagnosticsKeywords = ['symptom', 'diagnose', 'disease', 'condition'];
  const pharmacologyKeywords = ['drug', 'medication', 'dose', 'interaction', 'pharma'];
  const radiologyKeywords = ['x-ray', 'MRI', 'CT', 'scan', 'radiology', 'ultrasound'];
  const ayurvedaKeywords = ['ayurveda', 'herb', 'dosha', 'ayurvedic', 'natural treatment'];
  const cardiologyKeywords = ['heart', 'cardiac', 'arrhythmia', 'blood pressure', 'cholesterol'];
  const neurologyKeywords = ['neurology', 'brain', 'stroke', 'migraine', 'neurological', 'seizure'];

  const lowerMessage = userMessage.toLowerCase();

  if (diagnosticsKeywords.some(word => lowerMessage.includes(word))) return 'diagnostics';
  if (pharmacologyKeywords.some(word => lowerMessage.includes(word))) return 'pharmacology';
  if (radiologyKeywords.some(word => lowerMessage.includes(word))) return 'radiology';
  if (ayurvedaKeywords.some(word => lowerMessage.includes(word))) return 'ayurveda';
  if (cardiologyKeywords.some(word => lowerMessage.includes(word))) return 'cardiology';
  if (neurologyKeywords.some(word => lowerMessage.includes(word))) return 'neurology';

  return 'general';
};

/* ------------------------------------------------------------------ */
/*  MoE API Call                                                       */
/* ------------------------------------------------------------------ */

export const generateMoEMedicalResponse = async (
  input: string | GroqMessage[],
  options?: { expertType?: ExpertType }
): Promise<string> => {
  // Determine whether we're given a string prompt or full message array
  let expertType: ExpertType;
  let messages: GroqMessage[];

  if (typeof input === 'string') {
    // Input is a prompt string: route automatically or use override
    expertType = options?.expertType || routeToExpert(input);
    const expert = experts[expertType];
    console.log(`Routing to expert: ${expertType}`);
    messages = [
      { role: 'system', content: expert.systemPrompt },
      { role: 'user', content: input },
    ];

    // Prepare API payload
    var payload = {
      model: expert.model,
      messages,
      temperature: expert.temperature,
      max_tokens: expert.max_tokens,
    };
  } else {
    // Input is already a GroqMessage[]: use provided expert or default to general
    messages = input;
    expertType = options?.expertType || 'general';
    const expert = experts[expertType];
    console.log(`Using expert: ${expertType} with custom messages`);

    // If messages include a system message, skip prepending
    // Else, prepend system prompt
    if (!messages.find(m => m.role === 'system')) {
      messages.unshift({ role: 'system', content: expert.systemPrompt });
    }

    var payload = {
      model: experts[expertType].model,
      messages,
      temperature: experts[expertType].temperature,
      max_tokens: experts[expertType].max_tokens,
    };
  }

  // Execute API call
  const apiKey = getApiKey();
  
  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Error calling ${expertType} expert:`, errorText);
    
    if (response.status === 401) {
      throw new Error('Invalid API key. Please check your Groq API key in Settings.');
    }
    
    throw new Error(`Groq API error (${expertType}): ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || 'Sorry, no response generated.';
};
