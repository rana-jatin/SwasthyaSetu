
import { useState, useRef, useCallback } from 'react';
import { transcribeAudio, requestMicrophoneAccess } from '@/services/whisperService';

export interface AudioRecorderState {
  isRecording: boolean;
  isProcessing: boolean;
  recordingTime: number;
  audioUrl: string | null;
  error: string | null;
}

export interface AudioRecorderActions {
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<string>;
  cancelRecording: () => void;
  clearError: () => void;
}

export const useAudioRecorder = (): AudioRecorderState & AudioRecorderActions => {
  const [state, setState] = useState<AudioRecorderState>({
    isRecording: false,
    isProcessing: false,
    recordingTime: 0,
    audioUrl: null,
    error: null,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startTimer = useCallback(() => {
    setState(prev => ({ ...prev, recordingTime: 0 }));
    timerRef.current = setInterval(() => {
      setState(prev => ({ ...prev, recordingTime: prev.recordingTime + 1 }));
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, error: null, isProcessing: true }));
      
      const stream = await requestMicrophoneAccess();
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(1000); // Collect data every second
      startTimer();
      
      setState(prev => ({ 
        ...prev, 
        isRecording: true, 
        isProcessing: false,
        audioUrl: null 
      }));
      
      console.log('Recording started');
    } catch (error) {
      console.error('Failed to start recording:', error);
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to start recording',
        isProcessing: false 
      }));
    }
  }, [startTimer]);

  const stopRecording = useCallback(async (): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!mediaRecorderRef.current || !streamRef.current) {
        reject(new Error('No active recording'));
        return;
      }

      setState(prev => ({ ...prev, isProcessing: true }));
      stopTimer();

      mediaRecorderRef.current.onstop = async () => {
        try {
          const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
          const audioUrl = URL.createObjectURL(audioBlob);
          
          setState(prev => ({ ...prev, audioUrl }));
          
          console.log('Transcribing audio...');
          const transcription = await transcribeAudio(audioBlob);
          
          // Clean up
          streamRef.current?.getTracks().forEach(track => track.stop());
          streamRef.current = null;
          mediaRecorderRef.current = null;
          
          setState(prev => ({
            ...prev,
            isRecording: false,
            isProcessing: false,
            recordingTime: 0,
          }));
          
          resolve(transcription);
        } catch (error) {
          console.error('Transcription failed:', error);
          setState(prev => ({
            ...prev,
            isRecording: false,
            isProcessing: false,
            error: error instanceof Error ? error.message : 'Transcription failed',
          }));
          reject(error);
        }
      };

      mediaRecorderRef.current.stop();
    });
  }, [stopTimer]);

  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    mediaRecorderRef.current = null;
    stopTimer();
    
    setState({
      isRecording: false,
      isProcessing: false,
      recordingTime: 0,
      audioUrl: null,
      error: null,
    });
    
    console.log('Recording cancelled');
  }, [stopTimer]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    startRecording,
    stopRecording,
    cancelRecording,
    clearError,
  };
};
