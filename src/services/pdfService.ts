
import { convertPDFToImages, extractBase64FromDataUrl } from './pdfToImageService';
import { generateVisionResponse } from './groqService';

export interface PDFContent {
  text: string;
  numPages: number;
  metadata: {
    title?: string;
    author?: string;
    subject?: string;
    creator?: string;
  };
  pageAnalyses?: string[];
}

export const extractPDFContent = async (file: File): Promise<PDFContent> => {
  try {
    console.log('Starting PDF extraction using vision model for file:', file.name);
    
    // Convert PDF pages to images
    const pageImages = await convertPDFToImages(file);
    console.log(`Converted ${pageImages.length} pages to images`);
    
    const pageAnalyses: string[] = [];
    let fullText = '';
    
    // Process each page with vision model
    for (const pageImage of pageImages) {
      try {
        console.log(`Analyzing page ${pageImage.pageNumber} with vision model`);
        
        const base64Image = extractBase64FromDataUrl(pageImage.imageDataUrl);
        
        const prompt = `Extract all text content from this PDF page. Please provide:
1. All visible text in the exact order it appears
2. Preserve formatting, bullet points, and structure
3. Include any headers, footers, and captions
4. If there are tables, preserve the tabular structure
5. If no text is visible, respond with "[No text content on this page]"

Please provide only the extracted text without additional commentary.`;
        
        const pageAnalysis = await generateVisionResponse(base64Image, prompt);
        pageAnalyses.push(pageAnalysis);
        
        // Add page text to full text with page separator
        if (pageAnalysis && !pageAnalysis.includes('[No text content on this page]')) {
          fullText += `\n--- Page ${pageImage.pageNumber} ---\n${pageAnalysis}\n`;
        }
        
        console.log(`Page ${pageImage.pageNumber} analysis completed`);
      } catch (pageError) {
        console.error(`Error analyzing page ${pageImage.pageNumber}:`, pageError);
        pageAnalyses.push(`[Error processing page ${pageImage.pageNumber}]`);
        fullText += `\n--- Page ${pageImage.pageNumber} ---\n[Error processing page]\n`;
      }
    }
    
    console.log('PDF extraction completed using vision model. Total text length:', fullText.length);
    
    if (fullText.trim().length === 0) {
      throw new Error('No text content could be extracted from the PDF');
    }
    
    return {
      text: fullText.trim(),
      numPages: pageImages.length,
      metadata: {
        title: file.name,
        creator: 'Vision-based extraction'
      },
      pageAnalyses
    };
  } catch (error) {
    console.error('Error extracting PDF content:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        throw new Error('PDF processing timed out. Please try a smaller file.');
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
