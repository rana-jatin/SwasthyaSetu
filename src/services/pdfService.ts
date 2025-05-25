
import * as pdfjsLib from 'pdfjs-dist';
import { FileAnalysisResult } from './groqService';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

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
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    const numPages = pdf.numPages;
    
    // Extract text from all pages
    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n';
    }
    
    // Get PDF metadata
    const metadata = await pdf.getMetadata();
    
    return {
      text: fullText.trim(),
      numPages,
      metadata: metadata.info || {}
    };
  } catch (error) {
    console.error('Error extracting PDF content:', error);
    throw new Error('Failed to extract PDF content. Please ensure the file is a valid PDF.');
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
