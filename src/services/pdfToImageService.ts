// pdfToImageService.ts
import * as pdfjsLib from 'pdfjs-dist';

// Worker configuration (modern approach with proper version handling)
const pdfVersion = (pdfjsLib as any).version || 'latest';
const [majorVersion] = pdfVersion.split('.').map(Number);
const workerUrl =
  majorVersion >= 5
    ? `https://unpkg.com/pdfjs-dist@${pdfVersion}/build/pdf.worker.min.mjs` // Modern ESM worker
    : `https://unpkg.com/pdfjs-dist@${pdfVersion}/legacy/build/pdf.worker.min.js`; // Legacy worker

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
export interface PDFPageImage {
  pageNumber: number;
  imageDataUrl: string;  // data:image/jpeg;base64,...
  width: number;
  height: number;
}

/* ------------------------------------------------------------------ */
/*  Main                                                               */
/* ------------------------------------------------------------------ */

/**
 * Convert PDF pages into JPEG images (browser-based).
 * @throws on invalid PDFs or timeout.
 */
export const convertPDFToImages = async (
  file: File,
  { scale = 2.0, timeoutMs = 30000 }: { scale?: number; timeoutMs?: number } = {},
): Promise<PDFPageImage[]> => {
  console.debug('[convertPDFToImages] Converting:', file.name);

  // 1. Load PDF with timeout handling
  const arrayBuffer = await file.arrayBuffer();

  let pdf: pdfjsLib.PDFDocumentProxy;
  try {
    pdf = await Promise.race([
      pdfjsLib.getDocument({ data: arrayBuffer }).promise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('PDF loading timed out')), timeoutMs),
      ),
    ]);
  } catch (error) {
    console.error('[convertPDFToImages] Failed to load PDF:', error);
    throw new Error('PDF loading failed. Check file validity and size.');
  }

  console.debug('[convertPDFToImages] PDF loaded:', pdf.numPages, 'pages');

  const images: PDFPageImage[] = [];

  // 2. Iterate pages and convert to images
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    try {
      console.debug(`[convertPDFToImages] Rendering page ${pageNum}`);

      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      const context = canvas.getContext('2d');
      if (!context) throw new Error('Failed to create canvas context');

      await page.render({ canvasContext: context, viewport }).promise;

      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);

      images.push({
        pageNumber: pageNum,
        imageDataUrl,
        width: viewport.width,
        height: viewport.height,
      });

      page.cleanup();
    } catch (err) {
      console.error(`[convertPDFToImages] Page ${pageNum} rendering failed:`, err);
      throw new Error(`Page ${pageNum} conversion failed.`);
    }
  }

  console.debug('[convertPDFToImages] Conversion successful:', images.length, 'pages');
  return images;
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Extract base64 data from a data URL */
export const extractBase64FromDataUrl = (dataUrl: string): string => {
  const [, base64] = dataUrl.split(',', 2);
  if (!base64) throw new Error('Invalid Data URL format.');
  return base64;
};
