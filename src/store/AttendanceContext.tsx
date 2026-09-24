import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type {
  StudentProfile,
  OfficialSnapshot,
  AttendanceSnapshotSubject,
  DailyAttendanceRecord,
  TimetableEntry,
  Holiday,
  Settings,
  Subject,
} from '../types';
import { useAuth } from '../contexts/AuthContext';
import { profileService } from '../services/profileService';
import { settingsService } from '../services/settingsService';
import { subjectService } from '../services/subjectService';
import { attendanceService } from '../services/attendanceService';
import { timetableService } from '../services/timetableService';
import { holidayService } from '../services/holidayService';

interface AttendanceContextType {
  profile: StudentProfile | null;
  settings: Settings | null;
  subjects: Subject[];
  snapshot: OfficialSnapshot | null;
  snapshotSubjects: AttendanceSnapshotSubject[];
  dailyRecords: DailyAttendanceRecord[];
  timetable: TimetableEntry[];
  holidays: Holiday[];
  loading: boolean;
  
  updateSettings: (settings: Partial<Settings>) => Promise<void>;
  addDailyRecord: (record: Omit<DailyAttendanceRecord, 'id'>) => Promise<void>;
  deleteDailyRecord: (id: string) => Promise<void>;
  updateTimetable: (timetable: TimetableEntry[]) => Promise<void>;
  addSubject: (subject: Omit<Subject, 'id'>) => Promise<Subject>;
  refreshData: () => Promise<void>;
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

export function AttendanceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [snapshot, setSnapshot] = useState<OfficialSnapshot | null>(null);
  const [snapshotSubjects, setSnapshotSubjects] = useState<AttendanceSnapshotSubject[]>([]);
  const [dailyRecords, setDailyRecords] = useState<DailyAttendanceRecord[]>([]);
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const [
        p, 
        set, 
        sub, 
        snapData, 
        daily, 
        time, 
        hol
      ] = await Promise.all([
        profileService.getProfile(user.id),
        settingsService.getSettings(user.id),
        subjectService.getSubjects(),
        attendanceService.getCurrentSnapshot(),
        attendanceService.getDailyRecords(),
        timetableService.getTimetable(user.id),
        holidayService.getHolidays()
      ]);

      setProfile(p);
      
      // Setup default settings if not exists
      if (!set) {
        const defaultSet = { user_id: user.id, required_percentage: 75, theme: 'system' as const, notifications_enabled: true };
        await settingsService.updateSettings(user.id, defaultSet);
        setSettings(defaultSet);
      } else {
        setSettings(set);
      }

      setSubjects(sub);
      if (snapData) {
        setSnapshot(snapData.snapshot);
        setSnapshotSubjects(snapData.snapshotSubjects);
      }
      setDailyRecords(daily);
      setTimetable(time);
      setHolidays(hol);
    } catch (e) {
      console.error('Failed to load attendance data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const updateSettings = async (newSettings: Partial<Settings>) => {
    if (!user) return;
    try {
      await settingsService.updateSettings(user.id, newSettings);
      setSettings(prev => prev ? { ...prev, ...newSettings } : null);
    } catch (error) {
      console.error("Error updating settings:", error);
    }
  };

  const addDailyRecord = async (record: Omit<DailyAttendanceRecord, 'id'>) => {
    const saved = await attendanceService.addDailyRecord(record);
    setDailyRecords([saved, ...dailyRecords]);
  };

  const deleteDailyRecord = async (id: string) => {
    await attendanceService.deleteDailyRecord(id);
    setDailyRecords(dailyRecords.filter(r => r.id !== id));
  };

  const updateTimetable = async (newTimetable: TimetableEntry[]) => {
    if (!user) return;
    const saved = await timetableService.updateTimetable(newTimetable, user.id);
    setTimetable(saved);
  };

  const addSubject = async (subject: Omit<Subject, 'id'>) => {
    const saved = await subjectService.addSubject(subject);
    setSubjects([...subjects, saved]);
    return saved;
  };

  const refreshData = async () => {
    await loadData();
  };

  return (
    <AttendanceContext.Provider value={{
      profile, settings, subjects, snapshot, snapshotSubjects, dailyRecords, timetable, holidays, loading,
      updateSettings, addDailyRecord, deleteDailyRecord, updateTimetable, addSubject, refreshData
    }}>
      {children}
    </AttendanceContext.Provider>
  );
}

export function useAttendance() {
  const context = useContext(AttendanceContext);
  if (context === undefined) {
    throw new Error('useAttendance must be used within an AttendanceProvider');
  }
  return context;
}
