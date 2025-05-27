
import { useState, useEffect } from 'react';
import { Brain, Clock, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ConversationContext {
  id: string;
  topic: string;
  summary: string;
  timestamp: Date;
  importance: 'low' | 'medium' | 'high';
  tags: string[];
}

interface ConversationMemoryProps {
  onContextSelect: (context: ConversationContext) => void;
}

export const ConversationMemory = ({ onContextSelect }: ConversationMemoryProps) => {
  const [contexts, setContexts] = useState<ConversationContext[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Load conversation contexts from localStorage
    const savedContexts = localStorage.getItem('conversationContexts');
    if (savedContexts) {
      setContexts(JSON.parse(savedContexts));
    }
  }, []);

  const saveContext = (newContext: ConversationContext) => {
    const updatedContexts = [...contexts, newContext];
    setContexts(updatedContexts);
    localStorage.setItem('conversationContexts', JSON.stringify(updatedContexts));
  };

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'high': return 'text-red-400';
      case 'medium': return 'text-yellow-400';
      default: return 'text-green-400';
    }
  };

  if (!isVisible) {
    return (
      <Button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-20 left-4 z-50 rounded-full p-3 bg-purple-600 hover:bg-purple-700"
      >
        <Brain className="w-5 h-5" />
      </Button>
    );
  }

  return (
    <div className="fixed bottom-20 left-4 z-50 w-80 max-h-96 bg-glass-white backdrop-blur-md border border-glass-border rounded-2xl shadow-xl overflow-hidden">
      <div className="p-4 border-b border-glass-border">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <Brain className="w-4 h-4" />
            Conversation Memory
          </h3>
          <Button
            onClick={() => setIsVisible(false)}
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white"
          >
            ×
          </Button>
        </div>
      </div>
      
      <div className="p-4 space-y-3 overflow-y-auto max-h-80">
        {contexts.length === 0 ? (
          <p className="text-gray-400 text-sm">No conversation contexts saved yet.</p>
        ) : (
          contexts.map((context) => (
            <div
              key={context.id}
              onClick={() => onContextSelect(context)}
              className="p-3 rounded-lg bg-black/20 hover:bg-black/30 cursor-pointer transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="text-white text-sm font-medium truncate flex-1">
                  {context.topic}
                </h4>
                <span className={`text-xs ${getImportanceColor(context.importance)}`}>
                  {context.importance}
                </span>
              </div>
              
              <p className="text-gray-300 text-xs mb-2 line-clamp-2">
                {context.summary}
              </p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock className="w-3 h-3" />
                  {context.timestamp.toLocaleDateString()}
                </div>
                
                <div className="flex gap-1">
                  {context.tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-blue-600/20 text-blue-300 text-xs rounded"
                    >
                      <Tag className="w-2 h-2" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
