
import React from 'react';
import { Mic, MicOff, Square, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { toast } from 'sonner';

interface VoiceRecorderProps {
  onTranscription: (text: string) => void;
  disabled?: boolean;
  className?: string;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onTranscription,
  disabled = false,
  className
}) => {
  const {
    isRecording,
    isProcessing,
    recordingTime,
    error,
    startRecording,
    stopRecording,
    cancelRecording,
    clearError
  } = useAudioRecorder();

  const handleStartRecording = async () => {
    try {
      await startRecording();
      toast.success('Recording started');
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const handleStopRecording = async () => {
    try {
      toast.loading('Transcribing audio...', { duration: Infinity });
      const transcription = await stopRecording();
      toast.dismiss();
      
      if (transcription.trim()) {
        onTranscription(transcription);
        toast.success('Audio transcribed successfully!');
      } else {
        toast.warning('No speech detected in the recording');
      }
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to transcribe audio');
      console.error('Transcription error:', error);
    }
  };

  const handleCancel = () => {
    cancelRecording();
    toast.info('Recording cancelled');
  };

  // Show error toast when error occurs
  React.useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isRecording) {
    return (
      <div className={cn("flex items-center space-x-2", className)}>
        {/* Recording indicator with pulse animation */}
        <div className="flex items-center space-x-3 bg-red-500/20 backdrop-blur-sm rounded-xl px-3 py-2 border border-red-400/30">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-red-400 text-sm font-medium">
              {formatTime(recordingTime)}
            </span>
          </div>
        </div>

        {/* Stop recording button */}
        <Button
          onClick={handleStopRecording}
          disabled={isProcessing}
          className="rounded-xl p-2 min-h-[44px] min-w-[44px] bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 shadow-lg hover:shadow-red-400/50"
        >
          <Square className="w-4 h-4" />
        </Button>

        {/* Cancel button */}
        <Button
          onClick={handleCancel}
          variant="ghost"
          className="rounded-xl p-2 min-h-[44px] min-w-[44px] text-white hover:bg-white/10"
        >
          <MicOff className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={handleStartRecording}
      disabled={disabled || isProcessing}
      className={cn(
        "rounded-xl p-2 min-h-[44px] min-w-[44px] transition-all duration-300 transform hover:scale-110 active:scale-95",
        isProcessing
          ? "bg-gray-600 cursor-not-allowed"
          : "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 shadow-lg hover:shadow-emerald-400/50 hover-glow-gold",
        className
      )}
    >
      {isProcessing ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Mic className="w-4 h-4" />
      )}
    </Button>
  );
};
