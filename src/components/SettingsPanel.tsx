
import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings, Stethoscope, Brain, FileText, Image, Key, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

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
  const [isValidKey, setIsValidKey] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const { toast } = useToast();

  // Load API key from localStorage on mount
  useEffect(() => {
    const savedKey = localStorage.getItem('groq_api_key');
    if (savedKey) {
      setApiKey(savedKey);
      setIsValidKey(validateApiKey(savedKey));
    }
  }, []);

  // Validate API key format
  const validateApiKey = (key: string): boolean => {
    return key && key.startsWith('gsk_') && key.length > 20;
  };

  // Handle API key input change
  const handleApiKeyChange = (value: string) => {
    setApiKey(value);
    const isValid = validateApiKey(value);
    setIsValidKey(isValid);
    
    if (isValid) {
      localStorage.setItem('groq_api_key', value);
      toast({
        title: "API Key Saved",
        description: "Your Groq API key has been saved successfully.",
      });
    } else if (value === '') {
      localStorage.removeItem('groq_api_key');
    }
  };

  // Test API connection
  const testConnection = async () => {
    if (!isValidKey) {
      toast({
        title: "Invalid API Key",
        description: "Please enter a valid Groq API key.",
        variant: "destructive",
      });
      return;
    }

    setIsTestingConnection(true);
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-4-maverick-17b-128e-instruct',
          messages: [{ role: 'user', content: 'Hello' }],
          max_tokens: 10,
        }),
      });

      if (response.ok) {
        toast({
          title: "Connection Successful",
          description: "Your API key is working correctly!",
        });
      } else {
        toast({
          title: "Connection Failed",
          description: "Invalid API key or connection error.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Connection Error",
        description: "Failed to test connection. Please check your internet connection.",
        variant: "destructive",
      });
    } finally {
      setIsTestingConnection(false);
    }
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
                Enter your Groq API key to enable AI features
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="api-key"
                  type="password"
                  placeholder="gsk_..."
                  value={apiKey}
                  onChange={(e) => handleApiKeyChange(e.target.value)}
                  className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                />
                {isValidKey ? (
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                ) : apiKey ? (
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                ) : null}
              </div>
              {isValidKey && (
                <Button
                  onClick={testConnection}
                  disabled={isTestingConnection}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isTestingConnection ? 'Testing...' : 'Test Connection'}
                </Button>
              )}
              <p className="text-xs text-gray-400">
                Get your API key from{' '}
                <a
                  href="https://console.groq.com/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline"
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
