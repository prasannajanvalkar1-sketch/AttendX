import { supabase } from '../lib/supabase';
import type { AttendanceImport, OfficialSnapshot, AttendanceSnapshotSubject, Subject } from '../types';

export const importService = {
  getImports: async (): Promise<AttendanceImport[]> => {
    const { data, error } = await supabase
      .from('attendance_imports')
      .select('*')
      .order('imported_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  uploadFile: async (filePath: string, file: File) => {
    return await supabase.storage
      .from('attendance_sheets')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
  },

  checkDuplicateHash: async (hash: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from('attendance_snapshots')
      .select('id')
      .eq('source_file_hash', hash)
      .limit(1);
    
    if (error) throw error;
    return data && data.length > 0;
  },

  saveSnapshot: async (
    snapshot: Omit<OfficialSnapshot, 'id' | 'user_id' | 'imported_at' | 'is_current'>, 
    subjects: Omit<AttendanceSnapshotSubject, 'id' | 'snapshot_id'>[],
    newSubjectsToCreate: Omit<Subject, 'id' | 'user_id' | 'is_active'>[]
  ) => {
    // 1. Check Session & Auth
    const { data: { session }, error: sessionErr } = await supabase.auth.getSession();
    if (sessionErr || !session?.user) {
      throw new Error("Your login session has expired or is invalid. Please sign in again.");
    }
    const userId = session.user.id;

    // 2. Create any new subjects
    for (const sub of newSubjectsToCreate) {
      const { error: subjInsertErr } = await supabase.from('subjects').insert({
        ...sub,
        user_id: userId,
        is_active: true
      });
      if (subjInsertErr) {
        throw new Error(`Failed to create new subject "${sub.name}": ` + subjInsertErr.message);
      }
    }

    // Refresh subjects list to get their DB IDs
    const { data: allSubjects, error: subjErr } = await supabase.from('subjects').select('*').eq('user_id', userId);
    if (subjErr) throw new Error("Failed to fetch subjects: " + subjErr.message);

    // 3. Unset previous current snapshot
    await supabase.from('attendance_snapshots')
      .update({ is_current: false })
      .eq('user_id', userId)
      .eq('is_current', true);

    // 4. Create new snapshot
    const { data: snapData, error: snapErr } = await supabase
      .from('attendance_snapshots')
      .insert({
        ...snapshot,
        user_id: userId,
        is_current: true
      })
      .select()
      .single();

    if (snapErr) throw new Error("Failed to save snapshot: " + snapErr.message);

    // 5. Map subject names to IDs and create snapshot subjects
    const snapshotSubjectsToInsert = subjects.map(sub => {
      // Find matching subject by name (case-insensitive)
      const matchingDbSub = allSubjects?.find(s => s.name.toLowerCase() === sub.subject_name_at_import.toLowerCase());
      return {
        ...sub,
        snapshot_id: snapData.id,
        subject_id: matchingDbSub ? matchingDbSub.id : null
      };
    });

    if (snapshotSubjectsToInsert.length > 0) {
      const { error: snapSubjErr } = await supabase
        .from('attendance_snapshot_subjects')
        .insert(snapshotSubjectsToInsert);
      
      if (snapSubjErr) throw new Error("Failed to link subjects to snapshot: " + snapSubjErr.message);
    }

    // Optional: Log import event to `attendance_imports` (if required by schema)
    // Based on types, it looks like attendance_imports might exist, but we aren't inserting there yet.
    // If it's just a view or not strictly required for the core flow, we'll skip for now to match old behavior.

    return snapData;
  }
};
