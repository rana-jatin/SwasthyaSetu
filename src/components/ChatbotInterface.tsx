
import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface ParticleProps {
  id: number;
  x: number;
  y: number;
  delay: number;
}

const ChatbotInterface = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I\'m your AI assistant. How can I help you today?',
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [particles, setParticles] = useState<ParticleProps[]>([]);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Generate floating particles
  useEffect(() => {
    const generateParticles = () => {
      const newParticles: ParticleProps[] = [];
      for (let i = 0; i < 20; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          delay: Math.random() * 6
        });
      }
      setParticles(newParticles);
    };
    generateParticles();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const createRipple = (x: number, y: number) => {
    const newRipple = {
      id: Date.now(),
      x,
      y
    };
    setRipples(prev => [...prev, newRipple]);
    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
    }, 600);
  };

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    setInputValue('');
    setIsTyping(true);

    // Create ripple effect
    createRipple(50, 50);

    // Simulate AI response
    setTimeout(() => {
      const responses = [
        "That's an interesting question! Let me think about that...",
        "I understand what you're asking. Here's my perspective:",
        "Great point! I'd be happy to help you with that.",
        "Thanks for sharing that with me. Here's what I think:",
        "That's a fascinating topic. Let me provide some insights:"
      ];
      
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: responses[Math.floor(Math.random() * responses.length)],
        isUser: false,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
      createRipple(30, 70);
    }, 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-teal-800">
      {/* Animated Background Particles */}
      <div className="absolute inset-0 overflow-hidden">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute w-2 h-2 bg-electric-blue rounded-full opacity-30"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              animationDelay: `${particle.delay}s`
            }}
            className={cn(
              "absolute w-2 h-2 bg-electric-blue rounded-full animate-particle-float"
            )}
          />
        ))}
      </div>

      {/* Ripple Effects */}
      {ripples.map((ripple) => (
        <div
          key={ripple.id}
          className="absolute w-4 h-4 border-2 border-electric-blue rounded-full animate-wave-ripple pointer-events-none"
          style={{
            left: `${ripple.x}%`,
            top: `${ripple.y}%`,
            transform: 'translate(-50%, -50%)'
          }}
        />
      ))}

      {/* Main Chat Container */}
      <div className="relative z-10 flex flex-col h-screen max-w-4xl mx-auto p-4">
        {/* Header */}
        <div className="mb-6">
          <div className="backdrop-blur-md bg-glass-white border border-glass-border rounded-3xl p-6 shadow-2xl">
            <h1 className="text-3xl font-bold text-white mb-2">AI Assistant</h1>
            <p className="text-gray-300">Your intelligent companion for conversations</p>
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-hidden">
          <div className="backdrop-blur-md bg-glass-white border border-glass-border rounded-3xl h-full shadow-2xl">
            <div className="h-full overflow-y-auto p-6 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex animate-message-bubble",
                    message.isUser ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-xs lg:max-w-md px-4 py-3 rounded-2xl backdrop-blur-sm shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl",
                      message.isUser
                        ? "bg-gradient-to-r from-electric-blue to-blue-500 text-white ml-4"
                        : "bg-glass-white border border-glass-border text-gray-100 mr-4"
                    )}
                  >
                    <p className="text-sm leading-relaxed">{message.text}</p>
                    <p className={cn(
                      "text-xs mt-2 opacity-70",
                      message.isUser ? "text-blue-100" : "text-gray-400"
                    )}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex justify-start animate-message-bubble">
                  <div className="max-w-xs px-4 py-3 rounded-2xl backdrop-blur-sm bg-glass-white border border-glass-border text-gray-100 mr-4 shadow-lg">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-typing-dots"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-typing-dots" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-typing-dots" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>

        {/* Input Area */}
        <div className="mt-6">
          <div className={cn(
            "backdrop-blur-md bg-glass-white border rounded-3xl shadow-2xl transition-all duration-300",
            isFocused 
              ? "border-electric-blue animate-pulse-glow" 
              : "border-glass-border"
          )}>
            <div className="flex items-end p-4 space-x-4">
              <div className="flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder="Type your message..."
                  className="w-full bg-transparent text-white placeholder-gray-400 focus:outline-none text-lg"
                />
              </div>
              <Button
                onClick={handleSend}
                disabled={!inputValue.trim()}
                className={cn(
                  "rounded-2xl p-3 transition-all duration-300 transform hover:scale-110 active:scale-95",
                  inputValue.trim()
                    ? "bg-gradient-to-r from-electric-blue to-blue-500 hover:from-blue-500 hover:to-electric-blue shadow-lg hover:shadow-electric-blue/50"
                    : "bg-gray-600 cursor-not-allowed"
                )}
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatbotInterface;
