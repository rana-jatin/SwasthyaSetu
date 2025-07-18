
import { useEffect, useState } from 'react';
import { Brain, Zap, Search } from 'lucide-react';

interface AdvancedTypingIndicatorProps {
  stage: 'thinking' | 'processing' | 'searching' | 'generating';
  expertType?: string;
}

export const AdvancedTypingIndicator = ({ stage, expertType }: AdvancedTypingIndicatorProps) => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const getStageInfo = () => {
    const isMedicalExpert = expertType === 'Medical Expert';
    
    switch (stage) {
      case 'thinking':
        return {
          icon: <Brain className={`w-4 h-4 ${isMedicalExpert ? 'text-saffron-400' : 'text-blue-400'}`} />,
          text: 'Analyzing your message',
          color: isMedicalExpert ? 'text-saffron-300' : 'text-blue-300'
        };
      case 'processing':
        return {
          icon: <Zap className={`w-4 h-4 ${isMedicalExpert ? 'text-gold-400' : 'text-yellow-400'}`} />,
          text: expertType ? `Consulting ${expertType}` : 'Processing request',
          color: isMedicalExpert ? 'text-gold-300' : 'text-yellow-300'
        };
      case 'searching':
        return {
          icon: <Search className={`w-4 h-4 ${isMedicalExpert ? 'text-saffron-400' : 'text-green-400'}`} />,
          text: 'Searching knowledge base',
          color: isMedicalExpert ? 'text-saffron-300' : 'text-green-300'
        };
      case 'generating':
        return {
          icon: <div className={`w-4 h-4 rounded-full animate-pulse ${isMedicalExpert ? 'bg-gradient-to-r from-saffron-400 to-gold-400' : 'bg-gradient-to-r from-purple-400 to-pink-400'}`} />,
          text: 'Generating response',
          color: isMedicalExpert ? 'text-saffron-300' : 'text-purple-300'
        };
      default:
        return {
          icon: <Brain className="w-4 h-4 text-blue-400" />,
          text: 'Thinking',
          color: 'text-blue-300'
        };
    }
  };

  const stageInfo = getStageInfo();
  const isMedicalExpert = expertType === 'Medical Expert';

  return (
    <div className="flex justify-start animate-message-bubble">
      <div className={`max-w-xs px-4 py-3 rounded-2xl backdrop-blur-sm border text-gray-100 mr-4 shadow-lg ${
        isMedicalExpert 
          ? 'bg-glass-saffron border-glass-saffron animate-pulse-gold' 
          : 'bg-glass-white border-glass-border'
      }`}>
        <div className="flex items-center space-x-3">
          <div className="animate-pulse">
            {stageInfo.icon}
          </div>
          
          <div className="flex flex-col">
            <span className={`text-sm ${stageInfo.color} font-medium`}>
              {stageInfo.text}{dots}
            </span>
            
            <div className="flex space-x-1 mt-1">
              <div className={`w-2 h-2 rounded-full animate-typing-dots ${
                isMedicalExpert ? 'bg-saffron-400' : 'bg-gray-400'
              }`}></div>
              <div className={`w-2 h-2 rounded-full animate-typing-dots ${
                isMedicalExpert ? 'bg-gold-400' : 'bg-gray-400'
              }`} style={{ animationDelay: '0.2s' }}></div>
              <div className={`w-2 h-2 rounded-full animate-typing-dots ${
                isMedicalExpert ? 'bg-saffron-400' : 'bg-gray-400'
              }`} style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
