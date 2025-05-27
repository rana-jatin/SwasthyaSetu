
import { useState, useEffect } from 'react';
import { FileText, Image, Trash2, Download, Eye, Calendar, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fileStorageService, StoredFile } from '@/services/fileStorageService';
import { toast } from 'sonner';

interface EnhancedFileManagerProps {
  onFileSelect: (file: StoredFile) => void;
}

export const EnhancedFileManager = ({ onFileSelect }: EnhancedFileManagerProps) => {
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<StoredFile[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'image' | 'pdf'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'size'>('date');

  useEffect(() => {
    loadFiles();
  }, []);

  useEffect(() => {
    filterAndSortFiles();
  }, [files, filter, sortBy]);

  const loadFiles = async () => {
    try {
      await fileStorageService.init();
      const storedFiles = await fileStorageService.getAllFiles();
      setFiles(storedFiles);
    } catch (error) {
      console.error('Error loading files:', error);
      toast.error('Failed to load files');
    }
  };

  const filterAndSortFiles = () => {
    let filtered = files;

    // Apply filter
    if (filter !== 'all') {
      filtered = files.filter(file => file.type === filter);
    }

    // Apply sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'size':
          return (b.metadata?.size || 0) - (a.metadata?.size || 0);
        case 'date':
        default:
          return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime();
      }
    });

    setFilteredFiles(filtered);
  };

  const deleteFile = async (fileId: string) => {
    try {
      await fileStorageService.deleteFile(fileId);
      setFiles(prev => prev.filter(f => f.id !== fileId));
      toast.success('File deleted successfully');
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Failed to delete file');
    }
  };

  const downloadFile = (file: StoredFile) => {
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.name;
    link.click();
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 z-50 rounded-full p-3 bg-indigo-600 hover:bg-indigo-700"
      >
        <FileText className="w-5 h-5" />
      </Button>
    );
  }

  return (
    <div className="fixed bottom-20 right-4 z-50 w-96 max-h-[32rem] bg-glass-white backdrop-blur-md border border-glass-border rounded-2xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-glass-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <FileText className="w-4 h-4" />
            File Manager ({files.length})
          </h3>
          <Button
            onClick={() => setIsOpen(false)}
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white"
          >
            ×
          </Button>
        </div>

        {/* Filters and Sort */}
        <div className="flex gap-2 text-xs">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="flex-1 bg-black/20 border border-gray-600 rounded px-2 py-1 text-white"
          >
            <option value="all">All Files</option>
            <option value="image">Images</option>
            <option value="pdf">PDFs</option>
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="flex-1 bg-black/20 border border-gray-600 rounded px-2 py-1 text-white"
          >
            <option value="date">Sort by Date</option>
            <option value="name">Sort by Name</option>
            <option value="size">Sort by Size</option>
          </select>
        </div>
      </div>

      {/* File List */}
      <div className="p-4 space-y-3 overflow-y-auto max-h-80">
        {filteredFiles.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">
            {filter === 'all' ? 'No files uploaded yet.' : `No ${filter} files found.`}
          </p>
        ) : (
          filteredFiles.map((file) => (
            <div
              key={file.id}
              className="p-3 rounded-lg bg-black/20 hover:bg-black/30 transition-colors group"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  {file.type === 'image' ? (
                    <div className="relative">
                      <img
                        src={file.url}
                        alt={file.name}
                        className="w-10 h-10 object-cover rounded"
                      />
                      <Image className="absolute -top-1 -right-1 w-4 h-4 text-blue-400 bg-black rounded-full p-0.5" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 bg-red-600/20 rounded flex items-center justify-center">
                      <FileText className="w-5 h-5 text-red-400" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="text-white text-sm font-medium truncate">
                    {file.name}
                  </h4>
                  
                  <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(file.uploadDate).toLocaleDateString()}
                    <span>•</span>
                    {formatFileSize(file.metadata?.size)}
                  </div>

                  {file.analysis && (
                    <p className="text-gray-300 text-xs mt-1 line-clamp-2">
                      {file.analysis.substring(0, 80)}...
                    </p>
                  )}
                </div>

                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    onClick={() => onFileSelect(file)}
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-blue-400 hover:text-blue-300"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    onClick={() => downloadFile(file)}
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-green-400 hover:text-green-300"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    onClick={() => deleteFile(file.id)}
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
