import type { OfficialSnapshot, AttendanceSnapshotSubject, DailyAttendanceRecord, CurrentAttendance, Subject } from '../types';

export function calculateCurrentAttendance(
  subjects: Subject[],
  snapshot: OfficialSnapshot | null,
  snapshotSubjects: AttendanceSnapshotSubject[],
  dailyRecords: DailyAttendanceRecord[],
  requiredPercentage: number = 75
): CurrentAttendance[] {
  const snapshotDateStr = snapshot ? snapshot.report_date : '1970-01-01';
  const snapshotDate = new Date(snapshotDateStr);

  return subjects.map((subject) => {
    let conducted = 0;
    let attended = 0;

    if (snapshot) {
      const snapData = snapshotSubjects.find((s) => s.subject_id === subject.id);
      if (snapData) {
        conducted = snapData.total_conducted || 0;
        attended = snapData.total_attended || 0;
      }
    }

    // Add valid daily records AFTER snapshot date
    const validDailyRecords = dailyRecords.filter((record) => {
      // Use 'date' for new schema or 'attendance_date' for old fallback
      const dateStr = (record as any).date || record.attendance_date;
      const recordDate = new Date(dateStr);
      // Support matching by string subject name (new schema) or subject_id (old schema)
      const matchesSubject = (record as any).subject === subject.name || record.subject_id === subject.id;
      return recordDate > snapshotDate && matchesSubject;
    });

    validDailyRecords.forEach((record) => {
      // New schema uses 'cancelled', old schema doesn't have it. Skip cancelled.
      if ((record.status as string) !== 'cancelled') {
        conducted += 1;
        if (record.status === 'present') {
          attended += 1;
        }
      }
    });

    const percentage = conducted === 0 ? 0 : (attended / conducted) * 100;
    
    let status: 'SAFE' | 'WARNING' | 'NOT_SAFE' = 'SAFE';
    if (percentage < requiredPercentage) {
      status = 'NOT_SAFE';
    } else if (percentage < requiredPercentage + 5) {
      status = 'WARNING';
    }

    return {
      subjectId: subject.id,
      subjectName: subject.name,
      conducted,
      attended,
      percentage,
      status,
    };
  });
}

export function classesNeededToReach(
  attended: number,
  conducted: number,
  requiredPercentage: number
): number {
  if (conducted === 0) return 0;
  const targetFraction = requiredPercentage / 100;
  if (attended / conducted >= targetFraction) return 0;

  if (targetFraction === 1) return Infinity; // Impossible
  
  const needed = (targetFraction * conducted - attended) / (1 - targetFraction);
  return Math.max(0, Math.ceil(needed));
}

export function classesCanMiss(
  attended: number,
  conducted: number,
  requiredPercentage: number
): number {
  if (conducted === 0) return 0;
  const targetFraction = requiredPercentage / 100;
  
  if (targetFraction === 0) return Infinity;
  
  const canMiss = (attended - targetFraction * conducted) / targetFraction;
  return Math.max(0, Math.floor(canMiss));
}

export function projectFutureAttendance(
  currentAttended: number,
  currentConducted: number,
  futureAttended: number,
  futureMissed: number
): number {
  const newAttended = currentAttended + futureAttended;
  const newConducted = currentConducted + futureAttended + futureMissed;
  if (newConducted === 0) return 0;
  return (newAttended / newConducted) * 100;
}
