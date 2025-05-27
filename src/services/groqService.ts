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
    console.log('Calling Groq API with messages:', messages.length);
    
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-maverick-17b-128e-instruct',
        messages: messages,
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API error:', response.status, errorText);
      throw new Error(`Groq API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Groq API response received');
    return data.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
  } catch (error) {
    console.error('Error calling Groq API:', error);
    throw new Error('Failed to generate response. Please try again.');
  }
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
    console.log('Calling Groq Reasoning API');
    
    const systemMessage = context 
      ? `You are a helpful AI assistant developed group of researchers with advanced reasoning capabilities. Use the following context to answer questions: ${context}`
      : 'You are a helpful AI assistant developed group of researchers with advanced reasoning capabilities. Provide detailed, logical responses to complex questions.';

      const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-r1-distill-llama-70b',
        messages: [
          {
            role: 'system',
            content: systemMessage
          },
          ...messages
        ],
        temperature: 0.4,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq Reasoning API error:', response.status, errorText);
      throw new Error(`Groq Reasoning API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Groq Reasoning API response received');
    return data.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
  } catch (error) {
    console.error('Error calling Groq Reasoning API:', error);
    throw new Error('Failed to generate reasoning response. Please try again.');
  }
};
