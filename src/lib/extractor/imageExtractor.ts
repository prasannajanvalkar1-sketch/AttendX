import Tesseract from 'tesseract.js';
import { parseTextToReport } from './textParser';
import { ParsedAttendanceReport } from './types';

export async function extractFromImage(file: File, onProgress?: (status: string) => void): Promise<ParsedAttendanceReport> {
  if (onProgress) {
    onProgress('Loading optical character recognition engine...');
  }
  
  const worker = await Tesseract.createWorker('eng', 1, {
    logger: (m: any) => {
      if (onProgress && m.status === 'recognizing text') {
        onProgress(`Reading image text... ${Math.round(m.progress * 100)}%`);
      }
    }
  });
  
  const { data: { text } } = await worker.recognize(file);
  await worker.terminate();

  return parseTextToReport(text);
}
