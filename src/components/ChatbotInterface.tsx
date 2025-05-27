import React, { useState, useRef, useEffect } from 'react';
import { Send, Image, FileText, Settings, Stethoscope } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { generateGroqResponse, generateVisionResponse, generateReasoningResponse, GroqMessage } from '@/services/groqService';
import { generateMoEMedicalResponse } from '@/services/moeMedicalGroq';
import { extractPDFContent, searchInText } from '@/services/pdfService';
import { fileStorageService, StoredFile } from '@/services/fileStorageService';
import { convertImageToBase64, resizeImage } from '@/utils/imageUtils';
import { toast } from 'sonner';

// Import new components
import { ConversationMemory } from './ConversationMemory';
import { SmartSuggestions } from './SmartSuggestions';
import { MessageBubble } from './MessageBubble';
import { AdvancedTypingIndicator } from './AdvancedTypingIndicator';
import { EnhancedFileManager } from './EnhancedFileManager';
import SettingsPanel from './SettingsPanel';
import FileUploadDialog from './FileUploadDialog';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  expertType?: string;
  file?: {
    id: string;
    name: string;
    type: 'image' | 'pdf';
    url: string;
    analysis?: string;
  };
}

interface ParticleProps {
  id: number;
  x: number;
  y: number;
  delay: number;
}

interface TypingState {
  isTyping: boolean;
  stage: 'thinking' | 'processing' | 'searching' | 'generating';
  expertType?: string;
}

const ChatbotInterface = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I\'m your advanced AI health companion powered by ARC Reactor. I can analyze images, extract content from PDFs, provide medical insights, and remember our conversation context. I now feature multiple medical experts and smart suggestions. How can I help you today?',
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [typingState, setTypingState] = useState<TypingState>({ isTyping: false, stage: 'thinking' });
  const [isFocused, setIsFocused] = useState(false);
  const [particles, setParticles] = useState<ParticleProps[]>([]);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const [storedFiles, setStoredFiles] = useState<StoredFile[]>([]);
  const [useMedicalExperts, setUseMedicalExperts] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadDialogType, setUploadDialogType] = useState<'image' | 'pdf'>('image');
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

  const loadStoredFiles = async () => {
    try {
      await fileStorageService.init();
      const files = await fileStorageService.getAllFiles();
      setStoredFiles(files);
    } catch (error) {
      console.error('Error loading stored files:', error);
    }
  };

  useEffect(() => {
    loadStoredFiles();
  }, []);

  const handleImageUpload = async (file: File, userQuery: string) => {
    console.log('Image upload triggered with query:', userQuery);

    try {
      setTypingState({ isTyping: true, stage: 'processing' });
      toast.loading('Processing image...', { duration: Infinity });
      
      const resizedBlob = await resizeImage(file);
      const resizedFile = new File([resizedBlob], file.name, { type: 'image/jpeg' });
      
      console.log('Converting to base64...');
      const base64 = await convertImageToBase64(resizedFile);
      const fileUrl = URL.createObjectURL(resizedFile);
      
      const fileId = Date.now().toString();
      
      setTypingState({ isTyping: true, stage: 'generating' });
      console.log('Generating image analysis with custom query...');
      const analysis = await generateVisionResponse(base64, userQuery);
      
      console.log('Storing file...');
      const storedFile: StoredFile = {
        id: fileId,
        name: file.name,
        type: 'image',
        url: fileUrl,
        uploadDate: new Date(),
        analysis,
        metadata: {
          size: file.size,
          originalType: file.type
        }
      };
      
      await fileStorageService.storeFile(storedFile);
      setStoredFiles(prev => [...prev, storedFile]);
      
      const userMessage: Message = {
        id: Date.now().toString(),
        text: `Uploaded image: ${file.name}\nQuery: ${userQuery}`,
        isUser: true,
        timestamp: new Date(),
        file: {
          id: fileId,
          name: file.name,
          type: 'image',
          url: fileUrl,
          analysis
        }
      };
      
      setMessages(prev => [...prev, userMessage]);
      
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: analysis,
        isUser: false,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiResponse]);
      setTypingState({ isTyping: false, stage: 'thinking' });
      createRipple(30, 70);
      
      toast.dismiss();
      toast.success('Image uploaded and analyzed successfully!');
      
    } catch (error) {
      console.error('Error processing image:', error);
      toast.dismiss();
      toast.error(`Failed to analyze image: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setTypingState({ isTyping: false, stage: 'thinking' });
    }
  };

  const handlePdfUpload = async (file: File, userQuery: string) => {
    console.log('PDF upload triggered with query:', userQuery);

    try {
      setTypingState({ isTyping: true, stage: 'processing' });
      toast.loading('Processing PDF...', { duration: Infinity });
      
      console.log('Extracting PDF content...');
      const pdfContent = await extractPDFContent(file);
      const fileUrl = URL.createObjectURL(file);
      const fileId = Date.now().toString();
      
      setTypingState({ isTyping: true, stage: 'generating' });
      console.log('Generating PDF analysis with custom query...');
      const analysis = await generateReasoningResponse([
        {
          role: 'user',
          content: `${userQuery}\n\nDocument content: ${pdfContent.text.substring(0, 2000)}...`
        }
      ]);
      
      console.log('Storing PDF file...');
      const storedFile: StoredFile = {
        id: fileId,
        name: file.name,
        type: 'pdf',
        url: fileUrl,
        uploadDate: new Date(),
        analysis,
        extractedText: pdfContent.text,
        metadata: {
          size: file.size,
          numPages: pdfContent.numPages,
          pdfMetadata: pdfContent.metadata
        }
      };
      
      await fileStorageService.storeFile(storedFile);
      setStoredFiles(prev => [...prev, storedFile]);
      
      const userMessage: Message = {
        id: Date.now().toString(),
        text: `Uploaded PDF: ${file.name} (${pdfContent.numPages} pages)\nQuery: ${userQuery}`,
        isUser: true,
        timestamp: new Date(),
        file: {
          id: fileId,
          name: file.name,
          type: 'pdf',
          url: fileUrl,
          analysis
        }
      };
      
      setMessages(prev => [...prev, userMessage]);
      
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: `PDF processed successfully! Here's the analysis based on your query:\n\n${analysis}`,
        isUser: false,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiResponse]);
      setTypingState({ isTyping: false, stage: 'thinking' });
      createRipple(30, 70);
      
      toast.dismiss();
      toast.success('PDF uploaded and analyzed successfully!');
      
    } catch (error) {
      console.error('Error processing PDF:', error);
      toast.dismiss();
      toast.error(`Failed to process PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setTypingState({ isTyping: false, stage: 'thinking' });
    }
  };

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || inputValue;
    if (!textToSend.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: textToSend,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    if (!messageText) setInputValue('');
    setTypingState({ isTyping: true, stage: 'thinking' });
    createRipple(50, 50);

    try {
      const relevantFiles = storedFiles.filter(file => 
        textToSend.toLowerCase().includes(file.name.toLowerCase()) ||
        textToSend.toLowerCase().includes('image') && file.type === 'image' ||
        textToSend.toLowerCase().includes('pdf') && file.type === 'pdf' ||
        textToSend.toLowerCase().includes('document') && file.type === 'pdf'
      );

      let aiResponseText: string;
      let expertType: string | undefined;

      if (relevantFiles.length > 0) {
        setTypingState({ isTyping: true, stage: 'searching' });
        const fileContext = relevantFiles.map(file => 
          `File: ${file.name} (${file.type})\nAnalysis: ${file.analysis}\n${file.extractedText ? `Content: ${file.extractedText.substring(0, 1000)}...` : ''}`
        ).join('\n\n');

        setTypingState({ isTyping: true, stage: 'generating' });
        aiResponseText = await generateReasoningResponse([
          {
            role: 'user',
            content: textToSend
          }
        ], fileContext);
      } else if (useMedicalExperts) {
        setTypingState({ isTyping: true, stage: 'processing' });
        // Route to medical expert
        aiResponseText = await generateMoEMedicalResponse(textToSend);
        expertType = 'Medical Expert';
      } else {
        setTypingState({ isTyping: true, stage: 'generating' });
        const groqMessages: GroqMessage[] = [
          {
            role: 'system',
            content: 'You are a helpful, friendly AI assistant named Ashvin. Provide clear and concise responses. Also keep your Ayurveda knowledge.'
          },
          ...messages.slice(-10).map(msg => ({
            role: msg.isUser ? 'user' as const : 'assistant' as const,
            content: msg.text
          })),
          {
            role: 'user',
            content: textToSend
          }
        ];

        aiResponseText = await generateGroqResponse(groqMessages);
      }
      
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponseText,
        isUser: false,
        timestamp: new Date(),
        expertType
      };
      
      setMessages(prev => [...prev, aiResponse]);
      setTypingState({ isTyping: false, stage: 'thinking' });
      createRipple(30, 70);
    } catch (error) {
      console.error('Error generating AI response:', error);
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I encountered an error generating a response. Please try again.',
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorResponse]);
      setTypingState({ isTyping: false, stage: 'thinking' });
      toast.error('Failed to generate response');
    }
  };

  const handleRegenerateMessage = async () => {
    const lastUserMessage = [...messages].reverse().find(msg => msg.isUser);
    if (lastUserMessage) {
      // Remove the last AI response
      setMessages(prev => prev.slice(0, -1));
      // Regenerate response
      await handleSend(lastUserMessage.text);
    }
  };

  const handleMessageFeedback = (messageId: string, type: 'positive' | 'negative') => {
    console.log(`Feedback for message ${messageId}: ${type}`);
    // Store feedback for improving responses
    localStorage.setItem(`feedback_${messageId}`, type);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const openImageUpload = () => {
    setUploadDialogType('image');
    setUploadDialogOpen(true);
  };

  const openPdfUpload = () => {
    setUploadDialogType('pdf');
    setUploadDialogOpen(true);
  };

  const handleFileUpload = (file: File, query: string) => {
    if (uploadDialogType === 'image') {
      handleImageUpload(file, query);
    } else {
      handlePdfUpload(file, query);
    }
  };

  const lastAiMessage = [...messages].reverse().find(msg => !msg.isUser);

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-green-900 via-emerald-800 to-blue-900">
      {/* Animated Background Particles */}
      <div className="absolute inset-0 overflow-hidden">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute w-2 h-2 bg-electric-blue rounded-full opacity-30 animate-particle-float"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              animationDelay: `${particle.delay}s`
            }}
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
        {/* Header with Settings */}
        <div className="mb-6">
          <div className="backdrop-blur-md bg-glass-white border border-glass-border rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Your Advanced Health Companion</h1>
                <p className="text-gray-300">Intelligent companion with medical experts, conversation memory, and smart suggestions</p>
              </div>
              
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => setUseMedicalExperts(!useMedicalExperts)}
                  variant={useMedicalExperts ? "default" : "secondary"}
                  className="flex items-center gap-2"
                >
                  <Stethoscope className="w-4 h-4" />
                  {useMedicalExperts ? 'Medical AI On' : 'Medical AI Off'}
                </Button>
                
                <SettingsPanel
                  useMedicalExperts={useMedicalExperts}
                  onToggleMedicalExperts={setUseMedicalExperts}
                >
                  <Button variant="ghost" size="icon">
                    <Settings className="w-5 h-5" />
                  </Button>
                </SettingsPanel>
              </div>
            </div>
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-hidden">
          <div className="backdrop-blur-md bg-glass-white border border-glass-border rounded-3xl h-full shadow-2xl">
            <div className="h-full overflow-y-auto p-6 space-y-4">
              {/* Smart Suggestions */}
              {lastAiMessage && (
                <SmartSuggestions
                  lastMessage={lastAiMessage.text}
                  onSuggestionClick={handleSend}
                  context={lastAiMessage.expertType}
                />
              )}

              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  onRegenerate={message.isUser ? undefined : handleRegenerateMessage}
                  onFeedback={message.isUser ? undefined : handleMessageFeedback}
                />
              ))}

              {/* Advanced Typing Indicator */}
              {typingState.isTyping && (
                <AdvancedTypingIndicator
                  stage={typingState.stage}
                  expertType={typingState.expertType}
                />
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
              ? "border-electric-blue" 
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
                  placeholder="Ask me about your uploaded files or any health-related question..."
                  className="w-full bg-transparent text-white placeholder-gray-400 focus:outline-none text-lg"
                />
              </div>
              
              {/* Upload Buttons */}
              <div className="flex space-x-2">
                <Button
                  onClick={openImageUpload}
                  className="rounded-2xl p-3 transition-all duration-300 transform hover:scale-110 active:scale-95 bg-gray-600 hover:bg-gray-500 shadow-lg"
                  disabled={typingState.isTyping}
                >
                  <Image className="w-5 h-5" />
                </Button>

                <Button
                  onClick={openPdfUpload}
                  className="rounded-2xl p-3 transition-all duration-300 transform hover:scale-110 active:scale-95 bg-gray-600 hover:bg-gray-500 shadow-lg"
                  disabled={typingState.isTyping}
                >
                  <FileText className="w-5 h-5" />
                </Button>
              </div>

              <Button
                onClick={() => handleSend()}
                disabled={!inputValue.trim() || typingState.isTyping}
                className={cn(
                  "rounded-2xl p-3 transition-all duration-300 transform hover:scale-110 active:scale-95",
                  inputValue.trim() && !typingState.isTyping
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

      {/* Floating Components */}
      <ConversationMemory
        onContextSelect={(context) => {
          setInputValue(`Based on our previous conversation about ${context.topic}: `);
          inputRef.current?.focus();
        }}
      />

      <EnhancedFileManager
        onFileSelect={(file) => {
          setInputValue(`Tell me more about the file "${file.name}". `);
          inputRef.current?.focus();
        }}
      />

      {/* File Upload Dialog */}
      <FileUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        fileType={uploadDialogType}
        onUpload={handleFileUpload}
        isProcessing={typingState.isTyping}
      />
    </div>
  );
};

export default ChatbotInterface;
