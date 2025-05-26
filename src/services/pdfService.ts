import * as pdfjsLib from 'pdfjs-dist';
import { FileAnalysisResult } from './groqService';

// Configure PDF.js worker to use CDN version
const setupWorker = () => {
  console.log('Setting up PDF.js worker with version:', pdfjsLib.version);
  
  // Use CDN worker which is browser-compatible
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;
  console.log('PDF.js worker configured with CDN path');
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
    console.log('Starting PDF extraction for file:', file.name, 'Size:', file.size);
    
    const arrayBuffer = await file.arrayBuffer();
    console.log('File converted to array buffer, size:', arrayBuffer.byteLength);
    
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      verbosity: 0,
      useWorkerFetch: false,
      isEvalSupported: false
    });
    
    console.log('Loading PDF document...');
    const pdf = await Promise.race([
      loadingTask.promise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('PDF loading timeout')), 20000)
      )
    ]) as any;
    
    console.log('PDF loaded successfully, pages:', pdf.numPages);
    
    let fullText = '';
    const numPages = pdf.numPages;
    
    // Extract text from all pages
    for (let i = 1; i <= numPages; i++) {
      console.log(`Extracting text from page ${i}/${numPages}`);
      try {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\n';
        
        console.log(`Page ${i} extracted, text length: ${pageText.length}`);
      } catch (pageError) {
        console.error(`Error extracting text from page ${i}:`, pageError);
        fullText += `[Page ${i} could not be processed]\n`;
      }
    }
    
    // Get PDF metadata
    let metadata = {};
    try {
      const metadataResult = await pdf.getMetadata();
      metadata = metadataResult.info || {};
      console.log('PDF metadata extracted:', metadata);
    } catch (metadataError) {
      console.error('Error extracting PDF metadata:', metadataError);
    }
    
    console.log('PDF extraction completed. Total text length:', fullText.length);
    
    if (fullText.trim().length === 0) {
      throw new Error('No text content found in PDF');
    }
    
    return {
      text: fullText.trim(),
      numPages,
      metadata
    };
  } catch (error) {
    console.error('Error extracting PDF content:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        throw new Error('PDF processing timed out. Please try a smaller file.');
      } else if (error.message.includes('worker')) {
        throw new Error('PDF processing service is temporarily unavailable. Please try again in a moment.');
      }
    }
    
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
