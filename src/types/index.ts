export interface StudentProfile {
  id: string; // auth.uid
  full_name: string;
  student_number: string;
  additional_id: string;
  program: string;
  academic_year: string;
  semester: string;
  onboarding_completed: boolean;
}

export interface Subject {
  id: string;
  user_id: string;
  name: string;
  theory_conducted: number;
  theory_attended: number;
  practical_conducted: number;
  practical_attended: number;
  is_active: boolean;
}

export interface OfficialSnapshot {
  id: string;
  user_id: string;
  report_date: string; // YYYY-MM-DD
  period_from: string | null;
  period_to: string | null;
  total_conducted: number;
  total_attended: number;
  source_file_name: string | null;
  source_file_hash: string | null;
  imported_at: string;
  is_current: boolean;
}

export interface AttendanceSnapshotSubject {
  id: string;
  snapshot_id: string;
  subject_id: string | null;
  subject_name_at_import: string;
  theory_conducted: number;
  theory_attended: number;
  practical_conducted: number;
  practical_attended: number;
  total_conducted: number;
  total_attended: number;
}

export interface DailyAttendanceRecord {
  id: string;
  user_id: string;
  subject_id: string;
  attendance_date: string; // YYYY-MM-DD
  timetable_slot_id: string | null;
  status: 'present' | 'absent';
}

export interface TimetableEntry {
  id: string;
  user_id: string;
  day_of_week: number; // 0-6
  subject_id: string;
  start_time: string | null;
  end_time: string | null;
  room: string | null;
  faculty: string | null;
  slot_order: number;
}

export interface Holiday {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  title: string;
  type: 'holiday' | 'exam' | 'event' | 'no-class';
}

export interface Settings {
  user_id: string;
  required_percentage: number;
  theme: 'light' | 'dark' | 'system';
  notifications_enabled: boolean;
}

export interface LeavePlan {
  id: string;
  user_id: string;
  title: string;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  missed_classes_count: number;
  projected_attendance: number;
  impact_summary: any;
  status: 'planned' | 'applied' | 'cancelled';
  created_at?: string;
}

export interface AttendanceImport {
  id: string;
  user_id: string;
  file_name: string | null;
  file_hash: string | null;
  report_date: string | null;
  imported_at: string;
  status: string;
  error_message: string | null;
}

// Client-side specific types (computed)
export interface CurrentAttendance {
  subjectId: string;
  subjectName: string;
  conducted: number;
  attended: number;
  percentage: number;
  status: 'SAFE' | 'WARNING' | 'NOT_SAFE';
}
