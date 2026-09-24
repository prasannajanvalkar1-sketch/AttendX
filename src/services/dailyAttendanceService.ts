import { supabase } from '../lib/supabase';

export interface DailyAttendanceRecord {
  id?: string;
  user_id: string;
  subject_id: string;
  attendance_date: string;
  status: 'present' | 'absent' | 'cancelled';
}

export const dailyAttendanceService = {
  async getDailyRecords(userId: string, date: string): Promise<DailyAttendanceRecord[]> {
    const { data, error } = await supabase
      .from('daily_attendance')
      .select('*')
      .eq('user_id', userId)
      .eq('attendance_date', date);

    if (error) {
      console.error('Error fetching daily attendance:', error);
      return [];
    }
    return data || [];
  },

  async upsertRecord(record: DailyAttendanceRecord): Promise<void> {
    const { data: existing } = await supabase
      .from('daily_attendance')
      .select('id')
      .eq('user_id', record.user_id)
      .eq('attendance_date', record.attendance_date)
      .eq('subject_id', record.subject_id)
      .single();

    let error;

    if (existing) {
      const { error: updateError } = await supabase
        .from('daily_attendance')
        .update({ status: record.status })
        .eq('id', existing.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from('daily_attendance')
        .insert(record);
      error = insertError;
    }

    if (error) {
      console.error('Error upserting daily attendance:', error);
      throw error;
    }
  },

  async bulkUpsertRecords(records: DailyAttendanceRecord[]): Promise<void> {
    if (records.length === 0) return;
    
    // For simplicity, we can do upsert for each, or a single upsert if the DB supports it.
    // Supabase supports upsert, but we need to know the unique constraint.
    // Let's just iterate and use our upsertRecord to ensure it handles the logic correctly
    // or we can use the supabase .upsert on constraints.
    // Since we don't have a known constraint name here, running sequentially is safer.
    await Promise.all(records.map(record => this.upsertRecord(record)));
  },

  async deleteRecordsByDate(userId: string, date: string): Promise<void> {
    const { error } = await supabase
      .from('daily_attendance')
      .delete()
      .eq('user_id', userId)
      .eq('attendance_date', date);

    if (error) {
      console.error('Error deleting daily records:', error);
      throw error;
    }
  },

  async deleteRecordBySubjectAndDate(userId: string, date: string, subjectId: string): Promise<void> {
    const { error } = await supabase
      .from('daily_attendance')
      .delete()
      .eq('user_id', userId)
      .eq('attendance_date', date)
      .eq('subject_id', subjectId);

    if (error) {
      console.error('Error deleting daily record:', error);
      throw error;
    }
  }
};
