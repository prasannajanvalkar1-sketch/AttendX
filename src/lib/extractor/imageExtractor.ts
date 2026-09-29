import Tesseract from 'tesseract.js';
import { parseTextToReport } from './textParser';
import { ParsedAttendanceReport } from './types';

export async function extractFromImage(file: File, onProgress?: (status: string) => void): Promise<ParsedAttendanceReport> {
  if (onProgress) {
    onProgress('Bypassing image extraction for demo...');
  }
  
  // Bypass Tesseract worker to prevent hanging on mobile/incognito
  return parseTextToReport('');
}
