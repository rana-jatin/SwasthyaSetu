
import * as pdfjsLib from 'pdfjs-dist';
import { FileAnalysisResult } from './groqService';

// Improved PDF.js worker setup with proper version matching
const setupWorker = () => {
  try {
    // Use the same version as the installed package for compatibility
    const workerUrl = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
    console.log('PDF.js worker configured successfully with version:', pdfjsLib.version);
  } catch (error) {
    console.error('Failed to configure PDF.js worker:', error);
    // Fallback to a known working version
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@4.4.168/build/pdf.worker.min.js`;
  }
};

// Initialize worker on module load
setupWorker();

export interface PDFContent {
  text: string;
  numPages: number;
  metadata: {
    title?: string;
    author?: string;
    subject?: string;
    creator?: string;
  };
}

export const extractPDFContent = async (file: File): Promise<PDFContent> => {
  try {
    console.log('Starting PDF extraction for file:', file.name);
    
    const arrayBuffer = await file.arrayBuffer();
    console.log('File converted to array buffer, size:', arrayBuffer.byteLength);
    
    const loadingTask = pdfjsLib.getDocument({ 
      data: arrayBuffer,
      verbosity: 0 // Reduce console noise
    });
    const pdf = await loadingTask.promise;
    console.log('PDF loaded successfully, pages:', pdf.numPages);
    
    let fullText = '';
    const numPages = pdf.numPages;
    
    // Extract text from all pages with progress logging
    for (let i = 1; i <= numPages; i++) {
      console.log(`Extracting text from page ${i}/${numPages}`);
      try {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\n';
      } catch (pageError) {
        console.error(`Error extracting text from page ${i}:`, pageError);
        // Continue with other pages even if one fails
      }
    }
    
    // Get PDF metadata with error handling
    let metadata = {};
    try {
      const metadataResult = await pdf.getMetadata();
      metadata = metadataResult.info || {};
      console.log('PDF metadata extracted:', metadata);
    } catch (metadataError) {
      console.error('Error extracting PDF metadata:', metadataError);
    }
    
    console.log('PDF extraction completed. Text length:', fullText.length);
    
    return {
      text: fullText.trim(),
      numPages,
      metadata
    };
  } catch (error) {
    console.error('Error extracting PDF content:', error);
    throw new Error('Failed to extract PDF content. Please ensure the file is a valid PDF and try again.');
  }
};

export const chunkText = (text: string, chunkSize: number = 1000): string[] => {
  const chunks: string[] = [];
  const sentences = text.split('. ');
  let currentChunk = '';
  
  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > chunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence + '. ';
    } else {
      currentChunk += sentence + '. ';
    }
  }
  
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
};

export const searchInText = (text: string, query: string): string[] => {
  const chunks = chunkText(text, 500);
  const queryLower = query.toLowerCase();
  
  return chunks.filter(chunk => 
    chunk.toLowerCase().includes(queryLower)
  );
};
