import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAttendance } from '../store/AttendanceContext';
import { Card } from '../components/ui';
import { format, parseISO } from 'date-fns';
import { Check, X, Ban, Loader2, Bell, BellOff, Calendar as CalendarIcon, Palmtree } from 'lucide-react';
import { timetableService, WeeklySchedule, TimetableSlot } from '../services/timetableService';
import { dailyAttendanceService, DailyAttendanceRecord } from '../services/dailyAttendanceService';
import { holidayService } from '../services/holidayService';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function DailyAttendance() {
  const { user } = useAuth();
  const { refreshData, subjects, addSubject, holidays } = useAttendance(); // Call this when stats change

  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [schedule, setSchedule] = useState<WeeklySchedule | null>(null);
  const [dailyRecords, setDailyRecords] = useState<DailyAttendanceRecord[]>([]);
  
  const [loadingSchedule, setLoadingSchedule] = useState(true);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [isHolidayLoading, setIsHolidayLoading] = useState(false);

  const [notificationsEnabled, setNotificationsEnabled] = useState(Notification.permission === 'granted');

  const selectedDateObj = parseISO(selectedDate);
  const dayOfWeekStr = DAYS[selectedDateObj.getDay()] as keyof WeeklySchedule;
  const todaySlots: TimetableSlot[] = schedule ? schedule[dayOfWeekStr] || [] : [];

  const isHoliday = holidays.some(h => h.date === selectedDate);

  useEffect(() => {
    async function loadSchedule() {
      if (!user) return;
      try {
        const data = await timetableService.getTimetable(user.id);
        setSchedule(data);
      } catch (e) {
        console.error("Failed to load timetable", e);
      } finally {
        setLoadingSchedule(false);
      }
    }
    loadSchedule();
  }, [user]);

  useEffect(() => {
    async function loadDailyRecords() {
      if (!user) return;
      setLoadingRecords(true);
      try {
        const records = await dailyAttendanceService.getDailyRecords(user.id, selectedDate);
        setDailyRecords(records);
      } catch (e) {
        console.error("Failed to load daily records", e);
      } finally {
        setLoadingRecords(false);
      }
    }
    loadDailyRecords();
  }, [user, selectedDate]);

  useEffect(() => {
    if (!notificationsEnabled || !schedule || !user) return;

    const todayStr = format(new Date(), 'yyyy-MM-dd');
    if (selectedDate !== todayStr) return; // Only notify for today

    const interval = setInterval(() => {
      const now = new Date();
      const currentHHMM = format(now, 'HH:mm');

      todaySlots.forEach(slot => {
        // e.g. slot.time = "09:00 - 10:00" -> endTime = "10:00"
        const [_, endTimeStr] = slot.time.split(' - ').map(s => s.trim());
        if (!endTimeStr) return;
        
        // Convert '01:00' to 24h format if needed, but let's assume HH:mm matching for simplicity
        // or compare if current time >= end time
        if (currentHHMM === endTimeStr) {
          const subjectObj = subjects.find(s => s.name === slot.subject);
          const alreadyMarked = dailyRecords.some(r => r.subject_id === subjectObj?.id);
          if (!alreadyMarked) {
             new Notification(`Class Finished: ${slot.subject}`, {
                body: `Did you attend the ${slot.type} class (${slot.time})? Click to mark Present or Absent.`,
                icon: '/favicon.ico'
             });
          }
        }
      });
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [notificationsEnabled, schedule, dailyRecords, selectedDate, todaySlots, user]);

  const toggleNotifications = async () => {
    if (notificationsEnabled) {
      setNotificationsEnabled(false);
      return;
    }
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      setNotificationsEnabled(true);
    } else {
      alert("Notification permission denied by browser.");
    }
  };

  const handleMark = async (slot: TimetableSlot, status: 'present' | 'absent' | 'cancelled') => {
    if (!user) return;
    
    let subjectObj = subjects.find(s => s.name === slot.subject);
    
    const key = `${slot.subject}-${slot.time}`;
    try {
      setLoadingStates(prev => ({ ...prev, [key]: true }));

      if (!subjectObj) {
        // Auto-create missing subject so they don't get blocked
        subjectObj = await addSubject({
          user_id: user.id,
          name: slot.subject,
          theory_conducted: 0,
          theory_attended: 0,
          practical_conducted: 0,
          practical_attended: 0,
          is_active: true
        });
      }
      
      if (status === 'cancelled') {
        await dailyAttendanceService.deleteRecordBySubjectAndDate(user.id, selectedDate, subjectObj.id);
        setDailyRecords(prev => prev.filter(r => r.subject_id !== subjectObj!.id));
      } else {
        const record: DailyAttendanceRecord = {
          user_id: user.id,
          attendance_date: selectedDate,
          subject_id: subjectObj.id,
          status
        };
        
        await dailyAttendanceService.upsertRecord(record);
        
        // Update local state
        setDailyRecords(prev => {
          const filtered = prev.filter(r => r.subject_id !== subjectObj!.id);
          return [...filtered, record];
        });
      }

      // Refresh cumulative stats in context
      await refreshData();
    } catch (e: any) {
      alert(`Failed to save attendance: ${e.message}`);
    } finally {
      setLoadingStates(prev => ({ ...prev, [key]: false }));
    }
  };

  const toggleHoliday = async () => {
    if (!user) return;
    setIsHolidayLoading(true);
    try {
      if (isHoliday) {
        // Unmark holiday
        await holidayService.deleteHoliday(user.id, selectedDate);
      } else {
        // Mark as holiday
        await holidayService.addHoliday({
          user_id: user.id,
          date: selectedDate,
          title: 'College Off',
          type: 'holiday'
        });
        // Also clear any marked attendance for this day
        await dailyAttendanceService.deleteRecordsByDate(user.id, selectedDate);
        setDailyRecords([]);
      }
      await refreshData();
    } catch (e: any) {
      alert(`Failed to toggle holiday: ${e.message}`);
    } finally {
      setIsHolidayLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-black text-primary flex items-center gap-2">
            <CalendarIcon size={28} /> Daily Attendance
          </h1>
          <p className="text-muted-foreground mt-1">Mark your presence and keep stats updated.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <input 
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="bg-background border border-border px-4 py-2 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
          />
          <button 
            onClick={toggleHoliday}
            disabled={isHolidayLoading || todaySlots.length === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-colors ${isHoliday ? 'bg-orange-100 text-orange-700 border border-orange-200 hover:bg-orange-200' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
          >
            {isHolidayLoading ? <Loader2 size={18} className="animate-spin" /> : <Palmtree size={18} />}
            <span className="hidden sm:inline">{isHoliday ? 'Marked Holiday' : 'Mark as Holiday'}</span>
          </button>
          
          <button 
            onClick={toggleNotifications}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-colors ${notificationsEnabled ? 'bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
          >
            {notificationsEnabled ? <Bell size={18} /> : <BellOff size={18} />}
            {notificationsEnabled ? 'Alerts On' : 'Enable Alerts'}
          </button>
        </div>
      </header>

      {loadingSchedule || loadingRecords ? (
        <div className="flex justify-center p-12 text-primary">
          <Loader2 size={32} className="animate-spin" />
        </div>
      ) : todaySlots.length === 0 ? (
        <div className="p-12 border-2 border-dashed rounded-xl bg-muted/10 flex flex-col items-center justify-center text-center">
          <h2 className="text-2xl font-bold mb-2">No Classes Scheduled</h2>
          <p className="text-muted-foreground">You don't have any classes in your timetable for {dayOfWeekStr}.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-foreground">
            {format(selectedDateObj, 'EEEE, MMMM d, yyyy')} Schedule
          </h2>
          
          {isHoliday && (
            <div className="bg-orange-100/50 border border-orange-200 rounded-xl p-4 flex items-center gap-3 text-orange-800 animate-in fade-in zoom-in-95 duration-300">
              <Palmtree className="text-orange-500" size={24} />
              <div>
                <h3 className="font-bold">🎉 Today is marked as a Holiday / College Off.</h3>
                <p className="text-sm opacity-90">No lectures conducted. Attendance percentage is unaffected.</p>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 gap-4">
            {todaySlots.map((slot, index) => {
              const subjectObj = subjects.find(s => s.name === slot.subject);
              const record = dailyRecords.find(r => r.subject_id === subjectObj?.id);
              // Visually treat as cancelled if it's a holiday, though no record exists
              const isVisualCancelled = isHoliday || (!record && false); // We don't store cancelled, so only Holiday triggers visual cancel
              
              const key = `${slot.subject}-${slot.time}`;
              const isLoading = loadingStates[key];

              return (
                <Card key={index} className={`p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border-border/50 hover:shadow-md transition-shadow ${isHoliday ? 'opacity-60 grayscale' : ''}`}>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-sm font-black text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                        {slot.time}
                      </span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${slot.type === 'Theory' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                        {slot.type}
                      </span>
                    </div>
                    <h3 className="font-bold text-lg">{slot.subject}</h3>
                  </div>

                  <div className="flex gap-2 w-full md:w-auto">
                    <button
                      onClick={() => handleMark(slot, 'present')}
                      disabled={isLoading || isHoliday}
                      className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all ${record?.status === 'present' ? 'bg-green-500 text-white shadow-md scale-105' : 'bg-green-100 text-green-700 hover:bg-green-200 opacity-70 hover:opacity-100'}`}
                    >
                      {isLoading && record?.status === 'present' ? <Loader2 size={18} className="animate-spin"/> : <Check size={18} />}
                      <span>Present</span>
                    </button>
                    
                    <button
                      onClick={() => handleMark(slot, 'absent')}
                      disabled={isLoading || isHoliday}
                      className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all ${record?.status === 'absent' ? 'bg-red-500 text-white shadow-md scale-105' : 'bg-red-100 text-red-700 hover:bg-red-200 opacity-70 hover:opacity-100'}`}
                    >
                      {isLoading && record?.status === 'absent' ? <Loader2 size={18} className="animate-spin"/> : <X size={18} />}
                      <span>Absent</span>
                    </button>
                    
                    <button
                      onClick={() => handleMark(slot, 'cancelled')}
                      disabled={isLoading || isHoliday}
                      className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all ${isVisualCancelled ? 'bg-gray-500 text-white shadow-md scale-105' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 opacity-70 hover:opacity-100'}`}
                      title="Clear attendance mark for this class"
                    >
                      {isLoading && isVisualCancelled ? <Loader2 size={18} className="animate-spin"/> : <Ban size={18} />}
                      <span className="hidden sm:inline">Clear</span>
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
