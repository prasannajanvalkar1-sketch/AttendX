import { supabase } from '../lib/supabase';
import type { DailyAttendanceRecord, OfficialSnapshot, AttendanceSnapshotSubject } from '../types';

export const attendanceService = {
  getDailyRecords: async (): Promise<DailyAttendanceRecord[]> => {
    const { data, error } = await supabase
      .from('daily_attendance')
      .select('*')
      .order('attendance_date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  addDailyRecord: async (record: Omit<DailyAttendanceRecord, 'id'>): Promise<DailyAttendanceRecord> => {
    const { data, error } = await supabase
      .from('daily_attendance')
      .insert(record)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  deleteDailyRecord: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('daily_attendance')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  getCurrentSnapshot: async (): Promise<{ snapshot: OfficialSnapshot, snapshotSubjects: AttendanceSnapshotSubject[] } | null> => {
    const { data: snapshot, error: snapError } = await supabase
      .from('attendance_snapshots')
      .select('*')
      .eq('is_current', true)
      .single();

    if (snapError) {
      if (snapError.code === 'PGRST116') return null;
      throw snapError;
    }

    if (snapshot) {
      const { data: subjects, error: subjError } = await supabase
        .from('attendance_snapshot_subjects')
        .select('*')
        .eq('snapshot_id', snapshot.id);
        
      if (subjError) throw subjError;
      return { snapshot, snapshotSubjects: subjects || [] };
    }
    return null;
  }
};
