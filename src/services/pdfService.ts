
import * as pdfjsLib from 'pdfjs-dist';
import { FileAnalysisResult } from './groqService';

// Enhanced PDF.js worker setup with local-first approach
const setupWorker = () => {
  try {
    console.log('Setting up PDF.js worker with version:', pdfjsLib.version);
    
    // Primary strategy: Use local worker file
    const localWorkerUrl = `/pdf.worker.min.js`;
    pdfjsLib.GlobalWorkerOptions.workerSrc = localWorkerUrl;
    console.log('PDF.js worker configured with local path:', localWorkerUrl);
    
  } catch (error) {
    console.error('Failed to configure PDF.js worker:', error);
    // Fallback to CDN with correct version
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;
  }
};

// Test worker availability with simple document
const testWorkerAvailability = async (): Promise<boolean> => {
  try {
    console.log('Testing PDF.js worker availability...');
    
    // Minimal valid PDF for testing
    const testPdfData = new Uint8Array([
      0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, 0x0a,
      0x31, 0x20, 0x30, 0x20, 0x6f, 0x62, 0x6a, 0x0a,
      0x3c, 0x3c, 0x2f, 0x54, 0x79, 0x70, 0x65, 0x2f, 0x43, 0x61, 0x74, 0x61, 0x6c, 0x6f, 0x67, 0x2f, 0x50, 0x61, 0x67, 0x65, 0x73, 0x20, 0x32, 0x20, 0x30, 0x20, 0x52, 0x3e, 0x3e, 0x0a,
      0x65, 0x6e, 0x64, 0x6f, 0x62, 0x6a, 0x0a,
      0x32, 0x20, 0x30, 0x20, 0x6f, 0x62, 0x6a, 0x0a,
      0x3c, 0x3c, 0x2f, 0x54, 0x79, 0x70, 0x65, 0x2f, 0x50, 0x61, 0x67, 0x65, 0x73, 0x2f, 0x4b, 0x69, 0x64, 0x73, 0x5b, 0x33, 0x20, 0x30, 0x20, 0x52, 0x5d, 0x2f, 0x43, 0x6f, 0x75, 0x6e, 0x74, 0x20, 0x31, 0x3e, 0x3e, 0x0a,
      0x65, 0x6e, 0x64, 0x6f, 0x62, 0x6a, 0x0a,
      0x33, 0x20, 0x30, 0x20, 0x6f, 0x62, 0x6a, 0x0a,
      0x3c, 0x3c, 0x2f, 0x54, 0x79, 0x70, 0x65, 0x2f, 0x50, 0x61, 0x67, 0x65, 0x2f, 0x50, 0x61, 0x72, 0x65, 0x6e, 0x74, 0x20, 0x32, 0x20, 0x30, 0x20, 0x52, 0x3e, 0x3e, 0x0a,
      0x65, 0x6e, 0x64, 0x6f, 0x62, 0x6a, 0x0a,
      0x78, 0x72, 0x65, 0x66, 0x0a,
      0x30, 0x20, 0x34, 0x0a,
      0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x20, 0x36, 0x35, 0x35, 0x33, 0x35, 0x20, 0x66, 0x20, 0x0a,
      0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x39, 0x20, 0x30, 0x30, 0x30, 0x30, 0x30, 0x20, 0x6e, 0x20, 0x0a,
      0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x37, 0x34, 0x20, 0x30, 0x30, 0x30, 0x30, 0x30, 0x20, 0x6e, 0x20, 0x0a,
      0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x31, 0x34, 0x39, 0x20, 0x30, 0x30, 0x30, 0x30, 0x30, 0x20, 0x6e, 0x20, 0x0a,
      0x74, 0x72, 0x61, 0x69, 0x6c, 0x65, 0x72, 0x0a,
      0x3c, 0x3c, 0x2f, 0x53, 0x69, 0x7a, 0x65, 0x20, 0x34, 0x2f, 0x52, 0x6f, 0x6f, 0x74, 0x20, 0x31, 0x20, 0x30, 0x20, 0x52, 0x3e, 0x3e, 0x0a,
      0x73, 0x74, 0x61, 0x72, 0x74, 0x78, 0x72, 0x65, 0x66, 0x0a,
      0x32, 0x31, 0x32, 0x0a,
      0x25, 0x25, 0x45, 0x4f, 0x46
    ]);
    
    const loadingTask = pdfjsLib.getDocument({
      data: testPdfData,
      verbosity: 0
    });
    
    await Promise.race([
      loadingTask.promise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Worker test timeout')), 3000)
      )
    ]);
    
    console.log('PDF.js worker test successful');
    return true;
  } catch (error) {
    console.error('PDF.js worker test failed:', error);
    return false;
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
    console.log('Starting PDF extraction for file:', file.name, 'Size:', file.size);
    
    // Test worker before proceeding
    const workerAvailable = await testWorkerAvailability();
    if (!workerAvailable) {
      console.log('Local worker failed, trying CDN fallback...');
      
      // Try CDN fallback
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;
      
      const retestResult = await testWorkerAvailability();
      if (!retestResult) {
        throw new Error('PDF worker could not be loaded from any source');
      }
    }
    
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
