
import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Upload, Image, FileText, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileType: 'image' | 'pdf';
  onUpload: (file: File, query: string) => void;
  isProcessing?: boolean;
}

const FileUploadDialog: React.FC<FileUploadDialogProps> = ({
  open,
  onOpenChange,
  fileType,
  onUpload,
  isProcessing = false
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [query, setQuery] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const acceptedTypes = fileType === 'image' ? 'image/*' : '.pdf';
  const maxFileSize = fileType === 'image' ? 10 : 50; // MB

  const exampleQueries = fileType === 'image' 
    ? [
        "Analyze this medical image for any abnormalities",
        "Describe what you see in detail",
        "Extract any text visible in this image",
        "Identify objects and their relationships"
      ]
    : [
        "Summarize the key points from this document",
        "Extract medical information and recommendations",
        "Find specific information about...",
        "Analyze this document for important details"
      ];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files?.[0]) {
      handleFileSelection(files[0]);
    }
  };

  const handleFileSelection = (file: File) => {
    const isValidType = fileType === 'image' 
      ? file.type.startsWith('image/') 
      : file.type === 'application/pdf';
    
    if (!isValidType) {
      return;
    }

    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxFileSize) {
      return;
    }

    setSelectedFile(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelection(file);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      const finalQuery = query.trim() || (fileType === 'image' 
        ? "Analyze this image in detail. Describe what you see, including objects, people, text, colors, and any other relevant details."
        : "Analyze this PDF document and provide a summary. Extract key information and important details.");
      
      onUpload(selectedFile, finalQuery);
      handleClose();
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setQuery('');
    setDragActive(false);
    onOpenChange(false);
  };

  const handleExampleClick = (example: string) => {
    setQuery(example);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-md sm:max-w-lg bg-gray-900 border-gray-700 text-white mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white text-lg sm:text-xl">
            {fileType === 'image' ? <Image className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
            Upload {fileType === 'image' ? 'Image' : 'PDF'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Upload Area - Mobile Optimized */}
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-4 sm:p-6 text-center transition-colors cursor-pointer min-h-[120px] sm:min-h-[140px]",
              dragActive ? "border-blue-400 bg-blue-400/10" : "border-gray-600 hover:border-gray-500",
              selectedFile && "border-green-500 bg-green-500/10"
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={acceptedTypes}
              onChange={handleFileInputChange}
              className="hidden"
            />
            
            {selectedFile ? (
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2 text-green-400">
                  {fileType === 'image' ? <Image className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                  <span className="font-medium text-sm sm:text-base">File Selected</span>
                </div>
                <p className="text-sm text-gray-300 break-words px-2">{selectedFile.name}</p>
                <p className="text-xs text-gray-400">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 mx-auto" />
                <p className="text-gray-300 text-sm sm:text-base px-2">
                  Drag & drop your {fileType} here, or click to browse
                </p>
                <p className="text-xs text-gray-400">
                  Max size: {maxFileSize}MB
                </p>
              </div>
            )}
          </div>

          {/* Query Input - Mobile Optimized */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">
              What would you like me to analyze? (Optional)
            </label>
            <Textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Enter your specific question or analysis request...`}
              className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 min-h-[80px] text-sm resize-none"
            />
          </div>

          {/* Example Queries - Mobile Optimized */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">
              Example queries:
            </label>
            <div className="grid gap-1 max-h-24 sm:max-h-32 overflow-y-auto">
              {exampleQueries.map((example, index) => (
                <button
                  key={index}
                  onClick={() => handleExampleClick(example)}
                  className="text-xs text-left text-blue-400 hover:text-blue-300 p-1.5 sm:p-2 rounded hover:bg-gray-800 transition-colors min-h-[44px] sm:min-h-auto flex items-center"
                >
                  • {example}
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 flex-col sm:flex-row">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isProcessing}
            className="border-gray-600 text-gray-300 hover:bg-gray-800 w-full sm:w-auto min-h-[44px]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || isProcessing}
            className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto min-h-[44px]"
          >
            {isProcessing ? 'Processing...' : 'Upload & Analyze'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FileUploadDialog;
