// pdfExtractor.ts
import { convertPDFToImages, extractBase64FromDataUrl } from './pdfToImageService';
import { generateVisionResponse } from './groqService';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface PageImage {
  pageNumber: number;
  imageDataUrl: string; // e.g., data:image/jpeg;base64,...
}

export interface PDFContent {
  text: string;
  numPages: number;
  metadata: {
    title?: string;
    author?: string;
    subject?: string;
    creator?: string;
  };
  pageAnalyses: string[];
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const VISION_PROMPT = `Extract all text content from this PDF page. Please provide:
1. All visible text in the exact order it appears
2. Preserve formatting, bullet points, and structure
3. Include any headers, footers, and captions
4. If there are tables, preserve the tabular structure
5. If no text is visible, respond with "[No text content on this page]"

Please provide only the extracted text without additional commentary.`;

/* ------------------------------------------------------------------ */
/*  Main function                                                      */
/* ------------------------------------------------------------------ */

export const extractPDFContent = async (file: File): Promise<PDFContent> => {
  console.log(`[extractPDFContent] Starting extraction for: ${file.name}`);

  // 1. Convert PDF to images
  let pageImages: PageImage[];
  try {
    pageImages = await convertPDFToImages(file);
  } catch (error) {
    console.error('[extractPDFContent] Failed converting PDF to images:', error);
    throw new Error('PDF to image conversion failed. Ensure the PDF file is valid.');
  }

  if (!pageImages.length) {
    throw new Error('The PDF appears to contain no pages.');
  }

  console.log(`[extractPDFContent] Successfully converted ${pageImages.length} pages.`);

  const pageAnalyses: string[] = [];
  let fullText = '';

  // 2. Analyze each page using vision model
  for (const { pageNumber, imageDataUrl } of pageImages) {
  try {
    const base64 = extractBase64FromDataUrl(imageDataUrl);
    
    if (!base64) throw new Error('Empty base64 image data');

    const analysis = (await generateVisionResponse(base64, VISION_PROMPT)).trim();
    
    const isEmpty = analysis.startsWith('[No text content');
    pageAnalyses.push(isEmpty ? '' : analysis);

    if (!isEmpty) {
      fullText += `\n--- Page ${pageNumber} ---\n${analysis}\n`;
    }
  } catch (err) {
    console.error(`Error on page ${pageNumber}:`, err);
    const errorMsg = `[Vision API error on page ${pageNumber}]`;
    pageAnalyses.push(errorMsg);
    fullText += `\n--- Page ${pageNumber} ---\n${errorMsg}\n`;
  }
}


  // 3. Verify final content
  if (!fullText.trim()) {
    throw new Error('No text content extracted from the PDF.');
  }

  console.log(`[extractPDFContent] Extraction complete. Total extracted length: ${fullText.length}`);

  return {
    text: fullText.trim(),
    numPages: pageImages.length,
    metadata: {
      title: file.name,
      creator: 'Vision-based extraction',
    },
    pageAnalyses,
  };
};

/* ------------------------------------------------------------------ */
/*  Utility functions                                                  */
/* ------------------------------------------------------------------ */

/** Robustly chunk text into manageable pieces without breaking sentences. */
export const chunkText = (text: string, chunkSize = 1000): string[] => {
  const sentences =
    text.match(/[^.!?]+[.!?]+|\s*$/g)?.map((s) => s.trim()) ?? [];

  const chunks: string[] = [];
  let current = '';

  for (const sentence of sentences) {
    if (current.length && current.length + sentence.length > chunkSize) {
      chunks.push(current.trim());
      current = '';
    }
    current += sentence;
    if (!/[.!?]\s*$/.test(sentence)) current += ' ';
  }
  if (current.trim()) chunks.push(current.trim());

  return chunks;
};

/** Perform case-insensitive search within chunked text. */
export const searchInText = (
  text: string,
  query: string,
  chunkSize = 500,
): string[] => {
  const lowerQuery = query.toLowerCase();
  return chunkText(text, chunkSize).filter((chunk) =>
    chunk.toLowerCase().includes(lowerQuery),
  );
};
