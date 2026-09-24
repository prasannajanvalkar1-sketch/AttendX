export interface ExtractedSubject {
  name: string;
  theoryConducted: number;
  theoryAttended: number;
  practicalConducted: number;
  practicalAttended: number;
  totalConducted: number;
  totalAttended: number;
  percentage: number; // This is the calculated percentage
  pdfPercentage?: number; // The percentage extracted from the PDF
  validated?: boolean; // Whether the calculated percentage matches the PDF percentage
  confidence: 'high' | 'low';
}

export interface ExtractedRow {
  sNo: number;
  subject: string;
  type: 'Theory' | 'Practical';
  conducted: number;
  attended: number;
  missed: number;
  percentage?: number;
}

export interface ParsedAttendanceReport {
  student: {
    name: string | null;
    studentNumber: string | null;
    additionalId: string | null;
    program: string | null;
    academicYear: string | null;
    semester: string | null;
  };
  report: {
    reportDate: string | null;
    periodFrom: string | null;
    periodTo: string | null;
  };
  subjects: ExtractedSubject[];
  rows?: ExtractedRow[];
  overall: {
    totalConducted: number;
    totalAttended: number;
    percentage: number;
  } | null;
}

export interface PdfTextItem {
  str: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PdfRow {
  y: number;
  items: PdfTextItem[];
}

export interface PdfExtractionResult {
  fullText: string;
  rows: PdfRow[];
}
