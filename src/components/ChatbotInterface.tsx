import React, { useState, useRef, useEffect } from 'react';
import { Send, Image, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { generateGroqResponse, generateVisionResponse, generateReasoningResponse, GroqMessage } from '@/services/groqService';
import { extractPDFContent, searchInText } from '@/services/pdfService';
import { fileStorageService, StoredFile } from '@/services/fileStorageService';
import { convertImageToBase64, resizeImage } from '@/utils/imageUtils';
import { toast } from 'sonner';

interface Message {
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
      text: 'Hello! I\'m your AI assistant powered by ARC Reactor. I can analyze images, extract content from PDFs, and answer questions about your uploaded files. How can I help you today?',
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [particles, setParticles] = useState<ParticleProps[]>([]);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const [storedFiles, setStoredFiles] = useState<StoredFile[]>([]);
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('Image upload triggered');
    
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) {
      console.error('Invalid file type selected');
      toast.error('Please select a valid image file');
      return;
    }

    console.log('Processing image file:', file.name, file.size);

    try {
      setIsTyping(true);
      toast.loading('Processing image...', { duration: Infinity });
      
      // Resize and convert image
      console.log('Resizing image...');
      const resizedBlob = await resizeImage(file);
      const resizedFile = new File([resizedBlob], file.name, { type: 'image/jpeg' });
      
      console.log('Converting to base64...');
      const base64 = await convertImageToBase64(resizedFile);
      const fileUrl = URL.createObjectURL(resizedFile);
      
      const fileId = Date.now().toString();
      
      // Generate initial analysis
      console.log('Generating image analysis with Groq Vision API...');
      const analysis = await generateVisionResponse(base64, "Analyze this image in detail. Describe what you see, including objects, people, text, colors, and any other relevant details.");
      
      // Store file
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
      
      // Add user message
      const userMessage: Message = {
        id: Date.now().toString(),
        text: `Uploaded image: ${file.name}`,
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
      
      // Add AI response
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: analysis,
        isUser: false,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
      createRipple(30, 70);
      
      toast.dismiss();
      toast.success('Image uploaded and analyzed successfully!');
      
    } catch (error) {
      console.error('Error processing image:', error);
      toast.dismiss();
      toast.error(`Failed to analyze image: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsTyping(false);
    }
    
    e.target.value = '';
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('PDF upload triggered');
    
    const file = e.target.files?.[0];
    if (!file || file.type !== 'application/pdf') {
      console.error('Invalid file type selected');
      toast.error('Please select a valid PDF file');
      return;
    }

    console.log('Processing PDF file:', file.name, file.size);

    try {
      setIsTyping(true);
      toast.loading('Processing PDF...', { duration: Infinity });
      
      // Extract PDF content
      console.log('Extracting PDF content...');
      const pdfContent = await extractPDFContent(file);
      const fileUrl = URL.createObjectURL(file);
      const fileId = Date.now().toString();
      
      // Generate analysis using reasoning model
      console.log('Generating PDF analysis...');
      const analysis = await generateReasoningResponse([
        {
          role: 'user',
          content: `Analyze this PDF document and provide a summary. The document contains: ${pdfContent.text.substring(0, 500)}...`
        }
      ]);
      
      // Store file
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
      
      // Add user message
      const userMessage: Message = {
        id: Date.now().toString(),
        text: `Uploaded PDF: ${file.name} (${pdfContent.numPages} pages)`,
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
      
      // Add AI response
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: `PDF uploaded successfully! I've extracted ${pdfContent.text.length} characters from ${pdfContent.numPages} pages. Here's a summary:\n\n${analysis}`,
        isUser: false,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
      createRipple(30, 70);
      
      toast.dismiss();
      toast.success('PDF uploaded and analyzed successfully!');
      
    } catch (error) {
      console.error('Error processing PDF:', error);
      toast.dismiss();
      toast.error(`Failed to process PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsTyping(false);
    }
    
    e.target.value = '';
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
    const currentInput = inputValue;
    setInputValue('');
    setIsTyping(true);
    createRipple(50, 50);

    try {
      // Check if user is asking about uploaded files
      const relevantFiles = storedFiles.filter(file => 
        currentInput.toLowerCase().includes(file.name.toLowerCase()) ||
        currentInput.toLowerCase().includes('image') && file.type === 'image' ||
        currentInput.toLowerCase().includes('pdf') && file.type === 'pdf' ||
        currentInput.toLowerCase().includes('document') && file.type === 'pdf'
      );

      let aiResponseText: string;

      if (relevantFiles.length > 0) {
        // Use reasoning model with file context
        const fileContext = relevantFiles.map(file => 
          `File: ${file.name} (${file.type})\nAnalysis: ${file.analysis}\n${file.extractedText ? `Content: ${file.extractedText.substring(0, 1000)}...` : ''}`
        ).join('\n\n');

        aiResponseText = await generateReasoningResponse([
          {
            role: 'user',
            content: currentInput
          }
        ], fileContext);
      } else {
        // Regular conversation
        const groqMessages: GroqMessage[] = [
          {
            role: 'system',
            content: 'You are a helpful, friendly AI assistant named Ashvin. Provide clear and concise responses.Also Keep your Ayurveda Knowledge.'
          },
          ...messages.slice(-10).map(msg => ({
            role: msg.isUser ? 'user' as const : 'assistant' as const,
            content: msg.text
          })),
          {
            role: 'user',
            content: currentInput
          }
        ];

        aiResponseText = await generateGroqResponse(groqMessages);
      }
      
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponseText,
        isUser: false,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
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
      setIsTyping(false);
      toast.error('Failed to generate response');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

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
        {/* Header */}
        <div className="mb-6">
          <div className="backdrop-blur-md bg-glass-white border border-glass-border rounded-3xl p-6 shadow-2xl">
            <h1 className="text-3xl font-bold text-white mb-2">Your Health Companion</h1>
            <p className="text-gray-300">Your intelligent companion for Health conversations, scan analysis, and lab reports processing</p>
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
                            <FileText className="w-4 h-4" />
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
                  placeholder="Ask me about your uploaded files or anything else..."
                  className="w-full bg-transparent text-white placeholder-gray-400 focus:outline-none text-lg"
                />
              </div>
              
              {/* Upload Buttons */}
              <div className="flex space-x-2">
                {/* Image Upload */}
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    id="image-upload"
                    aria-label="Upload image"
                  />
                  <Button
                    type="button"
                    className="rounded-2xl p-3 transition-all duration-300 transform hover:scale-110 active:scale-95 bg-gray-600 hover:bg-gray-500 shadow-lg relative z-0"
                    disabled={isTyping}
                  >
                    <Image className="w-5 h-5" />
                  </Button>
                </div>

                {/* PDF Upload */}
                <div className="relative">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handlePdfUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    id="pdf-upload"
                    aria-label="Upload PDF"
                  />
                  <Button
                    type="button"
                    className="rounded-2xl p-3 transition-all duration-300 transform hover:scale-110 active:scale-95 bg-gray-600 hover:bg-gray-500 shadow-lg relative z-0"
                    disabled={isTyping}
                  >
                    <FileText className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              <Button
                onClick={handleSend}
                disabled={!inputValue.trim() || isTyping}
                className={cn(
                  "rounded-2xl p-3 transition-all duration-300 transform hover:scale-110 active:scale-95",
                  inputValue.trim() && !isTyping
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
