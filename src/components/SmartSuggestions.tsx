
import { useState, useEffect } from 'react';
import { Lightbulb, Sparkles, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Suggestion {
  id: string;
  text: string;
  category: 'followup' | 'analysis' | 'clarification';
  confidence: number;
}

interface SmartSuggestionsProps {
  lastMessage: string;
  onSuggestionClick: (suggestion: string) => void;
  context?: string;
}

export const SmartSuggestions = ({ lastMessage, onSuggestionClick, context }: SmartSuggestionsProps) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (lastMessage) {
      generateSuggestions(lastMessage, context);
    }
  }, [lastMessage, context]);

  const generateSuggestions = (message: string, contextInfo?: string) => {
    // Generate contextual suggestions based on the last message
    const newSuggestions: Suggestion[] = [];
    
    // Medical-related suggestions
    if (message.toLowerCase().includes('pain') || message.toLowerCase().includes('symptom')) {
      newSuggestions.push({
        id: '1',
        text: 'Can you describe the pain intensity on a scale of 1-10?',
        category: 'clarification',
        confidence: 0.9
      });
      newSuggestions.push({
        id: '2',
        text: 'How long have you been experiencing these symptoms?',
        category: 'followup',
        confidence: 0.8
      });
    }

    // Image analysis suggestions
    if (message.toLowerCase().includes('image') || message.toLowerCase().includes('scan')) {
      newSuggestions.push({
        id: '3',
        text: 'What specific areas should I focus on in this image?',
        category: 'analysis',
        confidence: 0.85
      });
      newSuggestions.push({
        id: '4',
        text: 'Can you explain any abnormalities you notice?',
        category: 'followup',
        confidence: 0.75
      });
    }

    // General follow-up suggestions
    newSuggestions.push({
      id: '5',
      text: 'Can you provide more details about this?',
      category: 'clarification',
      confidence: 0.6
    });

    setSuggestions(newSuggestions.filter(s => s.confidence > 0.7));
    setIsVisible(newSuggestions.length > 0);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'followup': return <MessageSquare className="w-3 h-3" />;
      case 'analysis': return <Sparkles className="w-3 h-3" />;
      default: return <Lightbulb className="w-3 h-3" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'followup': return 'bg-blue-600/20 text-blue-300 border-blue-500/30';
      case 'analysis': return 'bg-purple-600/20 text-purple-300 border-purple-500/30';
      default: return 'bg-yellow-600/20 text-yellow-300 border-yellow-500/30';
    }
  };

  if (!isVisible || suggestions.length === 0) return null;

  return (
    <div className="mb-4 animate-fade-in">
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb className="w-4 h-4 text-yellow-400" />
        <span className="text-sm text-gray-300">Smart Suggestions</span>
        <Button
          onClick={() => setIsVisible(false)}
          variant="ghost"
          size="sm"
          className="ml-auto text-gray-400 hover:text-white p-1 h-auto"
        >
          ×
        </Button>
      </div>
      
      <div className="space-y-2">
        {suggestions.map((suggestion) => (
          <Button
            key={suggestion.id}
            onClick={() => onSuggestionClick(suggestion.text)}
            variant="ghost"
            className={`w-full text-left justify-start p-3 h-auto border ${getCategoryColor(suggestion.category)} hover:bg-white/10 transition-all duration-200 hover:scale-[1.02]`}
          >
            <div className="flex items-start gap-2">
              {getCategoryIcon(suggestion.category)}
              <span className="text-sm leading-relaxed">{suggestion.text}</span>
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
};
