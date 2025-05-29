
const GROQ_API_KEY = "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";
const GROQ_API_URL = "https://api.groq.com/openai/v1/audio/transcriptions";

export interface TranscriptionResult {
  text: string;
  confidence?: number;
}

export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
  try {
    console.log('Starting audio transcription with Groq Whisper...');
    
    // Convert blob to File with proper name and type
    const audioFile = new File([audioBlob], 'audio.webm', { 
      type: audioBlob.type || 'audio/webm' 
    });
    
    const formData = new FormData();
    formData.append('file', audioFile);
    formData.append('model', 'distil-whisper-large-v3-en');
    formData.append('temperature', '0.0');
    formData.append('response_format', 'json');
    formData.append('language', 'en');

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq Whisper API error:', response.status, errorText);
      throw new Error(`Transcription failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Transcription completed successfully');
    
    return data.text || 'No transcription available.';
  } catch (error) {
    console.error('Error during audio transcription:', error);
    throw new Error('Failed to transcribe audio. Please try again.');
  }
};

export const checkMicrophonePermission = async (): Promise<boolean> => {
  try {
    const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
    return permission.state === 'granted';
  } catch (error) {
    console.warn('Could not check microphone permission:', error);
    return false;
  }
};

export const requestMicrophoneAccess = async (): Promise<MediaStream> => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      } 
    });
    console.log('Microphone access granted');
    return stream;
  } catch (error) {
    console.error('Microphone access denied:', error);
    throw new Error('Microphone access is required for voice recording. Please enable microphone permissions.');
  }
};
