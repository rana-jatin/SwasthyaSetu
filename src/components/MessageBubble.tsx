
import React, { useState } from 'react';
import { Copy, ThumbsUp, ThumbsDown, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface MessageBubbleProps {
  message: {
    id: string;
    text: string;
    isUser: boolean;
    timestamp: Date;
    file?: {
      id: string;
      name: string;
      type: 'image' | 'pdf';
      url: string;
      analysis?: string;
    };
  };
  onRegenerate?: () => void;
  onFeedback?: (messageId: string, type: 'positive' | 'negative') => void;
}

export const MessageBubble = ({ message, onRegenerate, onFeedback }: MessageBubbleProps) => {
  const [showActions, setShowActions] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState<'positive' | 'negative' | null>(null);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Message copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy message');
    }
  };

  const handleFeedback = (type: 'positive' | 'negative') => {
    setFeedbackGiven(type);
    onFeedback?.(message.id, type);
    toast.success(`Thank you for your feedback!`);
  };

  return (
    <div
      className={cn(
        "flex animate-message-bubble",
        message.isUser ? "justify-end" : "justify-start"
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div
        className={cn(
          "max-w-xs lg:max-w-md px-4 py-3 rounded-2xl backdrop-blur-sm shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl relative group",
          message.isUser
            ? "bg-gradient-to-r from-electric-blue to-blue-500 text-white ml-4"
            : "bg-glass-white border border-glass-border text-gray-100 mr-4"
        )}
      >
        {message.file && (
          <div className="mb-2">
            {message.file.type === 'image' ? (
              <img 
                src={message.file.url} 
                alt={message.file.name}
                className="max-w-full h-32 object-cover rounded-lg"
              />
            ) : (
              <div className="flex items-center space-x-2 p-2 bg-black/20 rounded-lg">
                <span className="text-xs truncate">{message.file.name}</span>
              </div>
            )}
          </div>
        )}
        
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
        
        <p className={cn(
          "text-xs mt-2 opacity-70",
          message.isUser ? "text-blue-100" : "text-gray-400"
        )}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>

        {/* Message Actions */}
        {!message.isUser && showActions && (
          <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              onClick={() => copyToClipboard(message.text)}
              size="sm"
              variant="secondary"
              className="h-6 w-6 p-0 rounded-full bg-black/50 hover:bg-black/70"
            >
              <Copy className="w-3 h-3" />
            </Button>
            
            {onRegenerate && (
              <Button
                onClick={onRegenerate}
                size="sm"
                variant="secondary"
                className="h-6 w-6 p-0 rounded-full bg-black/50 hover:bg-black/70"
              >
                <RotateCcw className="w-3 h-3" />
              </Button>
            )}
            
            {onFeedback && (
              <>
                <Button
                  onClick={() => handleFeedback('positive')}
                  size="sm"
                  variant="secondary"
                  className={cn(
                    "h-6 w-6 p-0 rounded-full bg-black/50 hover:bg-black/70",
                    feedbackGiven === 'positive' && "bg-green-600 hover:bg-green-700"
                  )}
                >
                  <ThumbsUp className="w-3 h-3" />
                </Button>
                
                <Button
                  onClick={() => handleFeedback('negative')}
                  size="sm"
                  variant="secondary"
                  className={cn(
                    "h-6 w-6 p-0 rounded-full bg-black/50 hover:bg-black/70",
                    feedbackGiven === 'negative' && "bg-red-600 hover:bg-red-700"
                  )}
                >
                  <ThumbsDown className="w-3 h-3" />
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
