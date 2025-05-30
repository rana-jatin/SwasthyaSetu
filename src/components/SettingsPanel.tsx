
import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings, Stethoscope, Brain, FileText, Image, Key, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SettingsPanelProps {
  useMedicalExperts: boolean;
  onToggleMedicalExperts: (value: boolean) => void;
  children: React.ReactNode;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  useMedicalExperts,
  onToggleMedicalExperts,
  children
}) => {
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    const savedApiKey = localStorage.getItem('groq_api_key') || '';
    setApiKey(savedApiKey);
  }, []);

  const handleApiKeyChange = (value: string) => {
    setApiKey(value);
    localStorage.setItem('groq_api_key', value);
  };

  const isValidApiKey = (key: string) => {
    return key.startsWith('gsk_') && key.length > 20;
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent className="w-80 bg-gray-900/95 backdrop-blur-md border-gray-700">
        <SheetHeader>
          <SheetTitle className="text-white flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Settings
          </SheetTitle>
          <SheetDescription className="text-gray-300">
            Configure your AI health companion preferences
          </SheetDescription>
        </SheetHeader>
        
        <div className="space-y-6 mt-6">
          {/* API Key Configuration */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-white flex items-center gap-2">
              <Key className="w-4 h-4" />
              Groq API Key
            </h3>
            <div className="space-y-2">
              <Label htmlFor="api-key" className="text-xs text-gray-300">
                Enter your Groq API key to enable AI responses
              </Label>
              <div className="relative">
                <Input
                  id="api-key"
                  type={showApiKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => handleApiKeyChange(e.target.value)}
                  placeholder="gsk_..."
                  className={cn(
                    "bg-gray-800 border-gray-600 text-white pr-10",
                    apiKey && !isValidApiKey(apiKey) && "border-red-500"
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
              {apiKey && !isValidApiKey(apiKey) && (
                <p className="text-xs text-red-400">
                  Invalid API key format. Should start with 'gsk_'
                </p>
              )}
              {!apiKey && (
                <p className="text-xs text-yellow-400">
                  API key required for AI responses
                </p>
              )}
              <p className="text-xs text-gray-400">
                Get your API key from{' '}
                <a 
                  href="https://console.groq.com/keys" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline"
                >
                  Groq Console
                </a>
              </p>
            </div>
          </div>

          {/* Medical AI Toggle */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-white">AI Mode</h3>
            <div className="grid grid-cols-1 gap-2">
              <Button 
                onClick={() => onToggleMedicalExperts(true)} 
                variant={useMedicalExperts ? "default" : "secondary"} 
                className={cn(
                  "justify-start gap-3 h-auto p-3", 
                  useMedicalExperts ? "bg-green-600 hover:bg-green-700 text-white" : "bg-gray-700 hover:bg-gray-600 text-gray-300"
                )}
              >
                <Stethoscope className="w-4 h-4" />
                <div className="text-left">
                  <div className="font-medium">Medical Expert AI</div>
                  <div className="text-xs opacity-80">Specialized medical knowledge and insights</div>
                </div>
              </Button>
              
              <Button 
                onClick={() => onToggleMedicalExperts(false)} 
                variant={!useMedicalExperts ? "default" : "secondary"} 
                className={cn(
                  "justify-start gap-3 h-auto p-3", 
                  !useMedicalExperts ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-gray-700 hover:bg-gray-600 text-gray-300"
                )}
              >
                <Brain className="w-4 h-4" />
                <div className="text-left">
                  <div className="font-medium">General AI</div>
                  <div className="text-xs opacity-80">Versatile assistant for all topics</div>
                </div>
              </Button>
            </div>
          </div>

          {/* File Processing Settings */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-white">File Processing</h3>
            <div className="space-y-2 text-sm text-gray-300">
              <div className="flex items-center gap-2">
                <Image className="w-4 h-4" />
                <span>Image analysis with AI vision</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span>PDF content extraction and search</span>
              </div>
            </div>
          </div>

          {/* About Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-white">About</h3>
            <div className="text-sm text-gray-300 space-y-2">
              <p>Advanced AI Health Companion powered by Ayurvedic Principles.</p>
              <div className="space-y-1 text-xs">
                <div>• Multi-modal AI processing</div>
                <div>• Conversation memory</div>
                <div>• Smart suggestions</div>
                <div>• File analysis capabilities</div>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SettingsPanel;
