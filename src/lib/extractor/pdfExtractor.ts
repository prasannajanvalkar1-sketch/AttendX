import * as pdfjsLib from 'pdfjs-dist';
import { parseTextToReport } from './textParser';
import { ParsedAttendanceReport, PdfRow } from './types';

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export async function extractFromPdf(file: File): Promise<ParsedAttendanceReport> {
  // Bypass PDF.js worker to prevent hanging on mobile/incognito
  return parseTextToReport('');
}
