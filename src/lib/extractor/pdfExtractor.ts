import * as pdfjsLib from 'pdfjs-dist';
import { parseTextToReport } from './textParser';
import { ParsedAttendanceReport, PdfRow } from './types';

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export async function extractFromPdf(file: File): Promise<ParsedAttendanceReport> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  const allItems: any[] = [];
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    
    for (const item of textContent.items as any[]) {
      if (item.str.trim() === '') continue;
      allItems.push({
        str: item.str.trim(),
        x: item.transform[4],
        y: item.transform[5],
        width: item.width,
        height: item.height,
        page: i
      });
    }
  }

  // Sort by page, then Y (descending, since PDF Y is bottom-up), then X
  allItems.sort((a, b) => {
    if (a.page !== b.page) return a.page - b.page;
    if (Math.abs(b.y - a.y) > 14) return b.y - a.y; // 14 points tolerance for Y to handle wrapped lines
    return a.x - b.x;
  });

  const rows: PdfRow[] = [];
  let currentRowItems: any[] = [];
  let currentY: number | null = null;

  for (const item of allItems) {
    if (currentY === null || Math.abs(currentY - item.y) > 14) {
      if (currentRowItems.length > 0) {
        currentRowItems.sort((a, b) => a.x - b.x);
        rows.push({ y: currentY as number, items: currentRowItems });
      }
      currentRowItems = [item];
      currentY = item.y;
    } else {
      currentRowItems.push(item);
    }
  }
  
  if (currentRowItems.length > 0) {
    currentRowItems.sort((a, b) => a.x - b.x);
    rows.push({ y: currentY as number, items: currentRowItems });
  }

  const fullText = rows.map(r => r.items.map(i => i.str).join(' ')).join('\n');

  // We pass the structured rows AND the full text to the textParser.
  return parseTextToReport({ rows, fullText });
}
