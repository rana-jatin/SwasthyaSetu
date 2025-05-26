import * as pdfjsLib from 'pdfjs-dist';
import { FileAnalysisResult } from './groqService';

// Enhanced PDF.js worker setup with multiple fallback strategies
const setupWorker = () => {
  try {
    console.log('Setting up PDF.js worker with version:', pdfjsLib.version);
    
    // Strategy 1: Try local worker (most reliable)
    const localWorkerUrl = `/pdf.worker.min.js`;
    
    // Strategy 2: Known working CDN versions as fallbacks
    const fallbackUrls = [
      `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`,
      `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`,
      `https://unpkg.com/pdfjs-dist@4.4.168/build/pdf.worker.min.js`,
      `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.js`
    ];
    
    // Try to use local worker first, then fallback to CDN
    pdfjsLib.GlobalWorkerOptions.workerSrc = localWorkerUrl;
    console.log('PDF.js worker configured with local path:', localWorkerUrl);
    
    // Set fallback URLs in case local fails
    (pdfjsLib.GlobalWorkerOptions as any).fallbackWorkerSrc = fallbackUrls;
    
  } catch (error) {
    console.error('Failed to configure PDF.js worker:', error);
    // Last resort fallback to known working version
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@4.4.168/build/pdf.worker.min.js`;
  }
};

// Test worker availability before processing
const testWorkerAvailability = async (): Promise<boolean> => {
  try {
    console.log('Testing PDF.js worker availability...');
    
    // Create a minimal test document to verify worker
    const testArray = new Uint8Array([
      0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, // %PDF-1.4
      0x0a, 0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a, // binary comment
      0x0a, 0x31, 0x20, 0x30, 0x20, 0x6f, 0x62, 0x6a, 0x0a, // 1 0 obj
      0x3c, 0x3c, 0x2f, 0x54, 0x79, 0x70, 0x65, 0x2f, 0x43, 0x61, 0x74, 0x61, 0x6c, 0x6f, 0x67, 0x2f, 0x50, 0x61, 0x67, 0x65, 0x73, 0x20, 0x32, 0x20, 0x30, 0x20, 0x52, 0x3e, 0x3e, 0x0a, // <</Type/Catalog/Pages 2 0 R>>
      0x65, 0x6e, 0x64, 0x6f, 0x62, 0x6a, 0x0a, // endobj
      0x32, 0x20, 0x30, 0x20, 0x6f, 0x62, 0x6a, 0x0a, // 2 0 obj
      0x3c, 0x3c, 0x2f, 0x54, 0x79, 0x70, 0x65, 0x2f, 0x50, 0x61, 0x67, 0x65, 0x73, 0x2f, 0x4b, 0x69, 0x64, 0x73, 0x5b, 0x33, 0x20, 0x30, 0x20, 0x52, 0x5d, 0x2f, 0x43, 0x6f, 0x75, 0x6e, 0x74, 0x20, 0x31, 0x3e, 0x3e, 0x0a, // <</Type/Pages/Kids[3 0 R]/Count 1>>
      0x65, 0x6e, 0x64, 0x6f, 0x62, 0x6a, 0x0a, // endobj
      0x78, 0x72, 0x65, 0x66, 0x0a, 0x30, 0x20, 0x34, 0x0a, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x30, 0x20, 0x36, 0x35, 0x35, 0x33, 0x35, 0x20, 0x66, 0x20, 0x0a, // xref table
      0x74, 0x72, 0x61, 0x69, 0x6c, 0x65, 0x72, 0x0a, 0x3c, 0x3c, 0x2f, 0x53, 0x69, 0x7a, 0x65, 0x20, 0x34, 0x2f, 0x52, 0x6f, 0x6f, 0x74, 0x20, 0x31, 0x20, 0x30, 0x20, 0x52, 0x3e, 0x3e, 0x0a, // trailer
      0x73, 0x74, 0x61, 0x72, 0x74, 0x78, 0x72, 0x65, 0x66, 0x0a, 0x31, 0x38, 0x34, 0x0a, 0x25, 0x25, 0x45, 0x4f, 0x46 // startxref and EOF
    ]);
    
    const loadingTask = pdfjsLib.getDocument({ 
      data: testArray,
      verbosity: 0
    });
    
    const pdf = await Promise.race([
      loadingTask.promise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Worker test timeout')), 5000)
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
      console.log('Worker test failed, attempting to reconfigure...');
      
      // Try alternative worker configurations
      const fallbackUrls = [
        `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.js`,
        `https://unpkg.com/pdfjs-dist@4.4.168/build/pdf.worker.min.js`,
        `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`
      ];
      
      for (const url of fallbackUrls) {
        try {
          console.log('Trying fallback worker URL:', url);
          pdfjsLib.GlobalWorkerOptions.workerSrc = url;
          const testResult = await testWorkerAvailability();
          if (testResult) {
            console.log('Successfully configured fallback worker:', url);
            break;
          }
        } catch (fallbackError) {
          console.log('Fallback worker failed:', url, fallbackError);
        }
      }
    }
    
    const arrayBuffer = await file.arrayBuffer();
    console.log('File converted to array buffer, size:', arrayBuffer.byteLength);
    
    // Add timeout to prevent hanging
    const loadingTask = pdfjsLib.getDocument({ 
      data: arrayBuffer,
      verbosity: 0,
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true
    });
    
    console.log('Loading PDF document...');
    const pdf = await Promise.race([
      loadingTask.promise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('PDF loading timeout after 30 seconds')), 30000)
      )
    ]) as any;
    
    console.log('PDF loaded successfully, pages:', pdf.numPages);
    
    let fullText = '';
    const numPages = pdf.numPages;
    
    // Extract text from all pages with progress logging
    for (let i = 1; i <= numPages; i++) {
      console.log(`Extracting text from page ${i}/${numPages}`);
      try {
        const page = await Promise.race([
          pdf.getPage(i),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error(`Page ${i} loading timeout`)), 10000)
          )
        ]) as any;
        
        const textContent = await Promise.race([
          page.getTextContent(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error(`Page ${i} text extraction timeout`)), 10000)
          )
        ]) as any;
        
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\n';
        
        console.log(`Page ${i} extracted, text length: ${pageText.length}`);
      } catch (pageError) {
        console.error(`Error extracting text from page ${i}:`, pageError);
        // Continue with other pages even if one fails
        fullText += `[Page ${i} could not be processed]\n`;
      }
    }
    
    // Get PDF metadata with error handling
    let metadata = {};
    try {
      const metadataResult = await Promise.race([
        pdf.getMetadata(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Metadata extraction timeout')), 5000)
        )
      ]) as any;
      
      metadata = metadataResult.info || {};
      console.log('PDF metadata extracted:', metadata);
    } catch (metadataError) {
      console.error('Error extracting PDF metadata:', metadataError);
    }
    
    console.log('PDF extraction completed. Total text length:', fullText.length);
    
    if (fullText.trim().length === 0) {
      throw new Error('No text content could be extracted from the PDF. The PDF may be image-based or corrupted.');
    }
    
    return {
      text: fullText.trim(),
      numPages,
      metadata
    };
  } catch (error) {
    console.error('Error extracting PDF content:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        throw new Error('PDF processing timed out. The file may be too large or complex. Please try a smaller PDF file.');
      } else if (error.message.includes('worker')) {
        throw new Error('PDF processing service is temporarily unavailable. Please try again in a moment.');
      } else if (error.message.includes('Invalid PDF')) {
        throw new Error('The uploaded file appears to be corrupted or is not a valid PDF. Please check the file and try again.');
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
