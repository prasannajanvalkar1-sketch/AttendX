import { extractFromPdf } from './pdfExtractor';
import { extractFromImage } from './imageExtractor';
import { extractFromExcel } from './excelExtractor';
import { ParsedAttendanceReport } from './types';

export type { ParsedAttendanceReport, ExtractedSubject } from './types';

export async function extractAttendanceData(
  file: File, 
  onProgress?: (status: string) => void
): Promise<ParsedAttendanceReport> {
  const type = file.type;
  const name = file.name.toLowerCase();

  if (type === 'application/pdf') {
    if (onProgress) onProgress('Reading PDF document...');
    return extractFromPdf(file);
  } else if (type.startsWith('image/') || name.endsWith('.jpg') || name.endsWith('.png') || name.endsWith('.jpeg')) {
    return extractFromImage(file, onProgress);
  } else if (
    type === 'text/csv' || 
    type === 'application/vnd.ms-excel' || 
    type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    name.endsWith('.csv') || name.endsWith('.xlsx') || name.endsWith('.xls')
  ) {
    if (onProgress) onProgress('Parsing spreadsheet...');
    return extractFromExcel(file);
  }

  throw new Error('Unsupported file type');
}
