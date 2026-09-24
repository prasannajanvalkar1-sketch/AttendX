import * as XLSX from 'xlsx';
import { parseTextToReport } from './textParser';
import { ParsedAttendanceReport } from './types';

export async function extractFromExcel(file: File): Promise<ParsedAttendanceReport> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  
  let fullText = '';
  
  // Convert all sheets to a simple text format and let the text parser handle it
  // This is a naive approach but works well for unstructured excel reports
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const csv = XLSX.utils.sheet_to_csv(sheet);
    // Replace commas with spaces to simulate plain text lines
    fullText += csv.replace(/,/g, ' ') + '\n';
  }

  return parseTextToReport(fullText);
}
