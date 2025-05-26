
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker to use CDN version
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;

export interface PDFPageImage {
  pageNumber: number;
  imageDataUrl: string;
  width: number;
  height: number;
}

export const convertPDFToImages = async (file: File): Promise<PDFPageImage[]> => {
  try {
    console.log('Converting PDF to images:', file.name);
    
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      verbosity: 0,
      useWorkerFetch: false,
      isEvalSupported: false
    });
    
    const pdf = await Promise.race([
      loadingTask.promise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('PDF loading timeout')), 30000)
      )
    ]) as any;
    
    console.log('PDF loaded, converting pages to images...');
    const images: PDFPageImage[] = [];
    
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      try {
        console.log(`Converting page ${pageNum}/${pdf.numPages} to image`);
        
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2.0 }); // High quality scale
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d')!;
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        const renderContext = {
          canvasContext: context,
          viewport: viewport
        };
        
        await page.render(renderContext).promise;
        
        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
        
        images.push({
          pageNumber: pageNum,
          imageDataUrl,
          width: viewport.width,
          height: viewport.height
        });
        
        console.log(`Page ${pageNum} converted successfully`);
      } catch (pageError) {
        console.error(`Error converting page ${pageNum}:`, pageError);
        throw new Error(`Failed to convert page ${pageNum} to image`);
      }
    }
    
    console.log(`Successfully converted ${images.length} pages to images`);
    return images;
  } catch (error) {
    console.error('Error converting PDF to images:', error);
    throw new Error('Failed to convert PDF to images. Please ensure the file is a valid PDF.');
  }
};

export const extractBase64FromDataUrl = (dataUrl: string): string => {
  return dataUrl.split(',')[1];
};
