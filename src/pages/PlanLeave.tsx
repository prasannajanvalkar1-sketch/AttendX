import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAttendance } from '../store/AttendanceContext';
import { Card } from '../components/ui';
import { format, differenceInDays, addDays, parseISO } from 'date-fns';
import { calculateCurrentAttendance } from '../utils/attendanceCalculations';
import { leavePlanService } from '../services/leavePlanService';
import type { LeavePlan } from '../types';
import { Calendar, Trash2, ShieldCheck, AlertTriangle, Save, Loader2, BookOpen } from 'lucide-react';

export default function PlanLeave() {
  const { user } = useAuth();
  const { subjects, snapshot, snapshotSubjects, dailyRecords, settings, timetable, holidays } = useAttendance();
  
  const [title, setTitle] = useState('Personal Leave');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [savedPlans, setSavedPlans] = useState<LeavePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadPlans() {
      if (user) {
        const plans = await leavePlanService.getLeavePlans(user.id);
        setSavedPlans(plans);
      }
      setLoading(false);
    }
    loadPlans();
  }, [user]);

  const requiredAttendance = settings?.required_percentage || 75;
  const currentAttendance = calculateCurrentAttendance(subjects, snapshot, snapshotSubjects, dailyRecords, requiredAttendance);
  const totalCurrentConducted = currentAttendance.reduce((a, b) => a + b.conducted, 0);
  const totalCurrentAttended = currentAttendance.reduce((a, b) => a + b.attended, 0);
  const currentPercentage = totalCurrentConducted > 0 ? (totalCurrentAttended / totalCurrentConducted) * 100 : 0;

  // Calculate Leave Impact
  const calculateLeave = () => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > end) return { impact_summary: [], totalMissed: 0 };

    const daysCount = differenceInDays(end, start) + 1;
    const impact_summary: { date: string; dayName: string; slots: any[] }[] = [];
    let totalMissed = 0;

    for (let i = 0; i < daysCount; i++) {
      const currentDay = addDays(start, i);
      const dayOfWeek = currentDay.getDay();
      
      if (dayOfWeek === 0) continue; // Skip Sundays

      const dateStr = format(currentDay, 'yyyy-MM-dd');
      const isHoliday = holidays.find(h => h.date === dateStr && (h.type === 'holiday' || h.type === 'no-class'));
      if (isHoliday) continue;

      const dayName = format(currentDay, 'EEEE'); // "Monday", "Tuesday"
      const daySlots = timetable ? (timetable as any)[dayName] || [] : [];
      
      if (daySlots.length > 0) {
        impact_summary.push({
          date: dateStr,
          dayName,
          slots: daySlots.map((t: any) => ({
            time: t.time || `${t.start_time || ''} - ${t.end_time || ''}`,
            subject_id: t.subject_id || t.subject,
            type: t.type || 'Lecture'
          }))
        });
        totalMissed += daySlots.length;
      }
    }

    return { impact_summary, totalMissed };
  };

  const { impact_summary, totalMissed } = calculateLeave();
  
  const projectedConducted = totalCurrentConducted + totalMissed;
  const projectedAttended = totalCurrentAttended;
  const projectedPercentage = projectedConducted > 0 ? Number(((projectedAttended / projectedConducted) * 100).toFixed(2)) : 0;
  
  const isSafe = projectedPercentage >= requiredAttendance;
  
  let safeBunksRemaining = 0;
  let classesNeededToRecover = 0;
  const targetFraction = requiredAttendance / 100;
  
  if (isSafe) {
    safeBunksRemaining = Math.floor((projectedAttended - targetFraction * projectedConducted) / targetFraction);
  } else {
    classesNeededToRecover = Math.ceil((targetFraction * projectedConducted - projectedAttended) / (1 - targetFraction));
  }

  const handleSavePlan = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const plan = await leavePlanService.addLeavePlan({
        user_id: user.id,
        title,
        start_date: startDate,
        end_date: endDate,
        missed_classes_count: totalMissed,
        projected_attendance: projectedPercentage,
        impact_summary,
        status: 'planned'
      });
      setSavedPlans([plan, ...savedPlans]);
    } catch (e: any) {
      alert('Failed to save plan: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePlan = async (id: string) => {
    if (!user) return;
    try {
      await leavePlanService.deleteLeavePlan(id, user.id);
      setSavedPlans(savedPlans.filter(p => p.id !== id));
    } catch (e: any) {
      alert('Failed to delete plan: ' + e.message);
    }
  };

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-black text-primary flex items-center gap-2">
          <Calendar size={28} /> Plan Leave
        </h1>
        <p className="text-muted-foreground mt-1">Simulate future leaves and check if you stay above {requiredAttendance}%.</p>
      </header>

      {/* Config Bar */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-bold text-muted-foreground mb-1">Reason / Title</label>
            <input 
              type="text" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Personal Leave"
              className="w-full bg-background border border-border rounded-xl px-4 py-2.5 font-medium focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-muted-foreground mb-1">Start Date</label>
            <input 
              type="date" 
              value={startDate} 
              min={todayStr}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-4 py-2.5 font-medium focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-muted-foreground mb-1">End Date</label>
            <input 
              type="date" 
              value={endDate} 
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-4 py-2.5 font-medium focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
            />
          </div>
        </div>
      </Card>

      {/* Hero Card */}
      <Card className={`p-8 border-2 shadow-sm transition-all ${isSafe ? 'border-green-500 bg-green-50/50 dark:bg-green-900/10' : 'border-red-500 bg-red-50/50 dark:bg-red-900/10'}`}>
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex-1 space-y-4">
            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-black uppercase tracking-wider ${isSafe ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'}`}>
              {isSafe ? <ShieldCheck size={18} /> : <AlertTriangle size={18} />}
              {isSafe ? `SAFE LEAVE — You stay above ${requiredAttendance}%` : `WARNING — Attendance drops below ${requiredAttendance}%`}
            </div>
            
            <p className="text-lg font-medium text-foreground/80">
              Taking this leave will add <strong className="text-foreground text-xl">{totalMissed}</strong> missed lectures to your record.
            </p>

            <div className="pt-4 border-t border-border/50">
              {isSafe ? (
                <p className="text-green-700 dark:text-green-400 font-medium">
                  You will still have <strong className="text-xl">{safeBunksRemaining}</strong> safe bunks remaining after this leave.
                </p>
              ) : (
                <p className="text-red-700 dark:text-red-400 font-medium">
                  You will need to attend <strong className="text-xl">{classesNeededToRecover}</strong> extra classes to recover your attendance to {requiredAttendance}%.
                </p>
              )}
            </div>
          </div>

          <div className="flex-shrink-0 flex items-center gap-4 bg-background p-6 rounded-2xl shadow-sm border border-border">
            <div className="text-center">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">Current</p>
              <p className="text-3xl font-black">{currentPercentage.toFixed(2)}%</p>
            </div>
            <div className="text-muted-foreground text-2xl font-light">➔</div>
            <div className="text-center">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">Projected</p>
              <p className={`text-4xl font-black ${isSafe ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {projectedPercentage.toFixed(2)}%
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSavePlan}
            disabled={saving || totalMissed === 0}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            Save Plan
          </button>
        </div>
      </Card>

      {/* Impacted Lectures Timeline */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <BookOpen size={20} className="text-primary" /> Impacted Lectures Timeline
        </h2>
        {totalMissed === 0 ? (
          <div className="p-8 border-2 border-dashed rounded-xl bg-muted/10 text-center text-muted-foreground">
            No classes scheduled during this date range.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {impact_summary.map((day, idx) => (
              <Card key={idx} className="p-5 border-l-4 border-l-primary hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-border/50">
                  <h3 className="font-bold text-lg">{day.dayName}</h3>
                  <span className="text-sm font-semibold text-muted-foreground bg-muted px-2 py-1 rounded-md">{format(parseISO(day.date), 'MMM d, yyyy')}</span>
                </div>
                <ul className="space-y-3">
                  {day.slots.map((slot, sIdx) => {
                    const subjectName = subjects.find(s => s.id === slot.subject_id)?.name || slot.subject_id || 'Unknown Subject';
                    return (
                      <li key={sIdx} className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 shrink-0" />
                        <div>
                          <p className="font-bold text-sm leading-tight">{subjectName}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 flex gap-2">
                            <span>{slot.time}</span>
                            <span className="opacity-50">•</span>
                            <span className="text-primary">{slot.type}</span>
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Saved Leave Plans History */}
      <div className="space-y-4 pt-8 border-t border-border/50">
        <h2 className="text-xl font-bold text-foreground">Saved Leave Plans History</h2>
        {loading ? (
          <div className="flex justify-center p-8 text-primary">
            <Loader2 className="animate-spin" size={32} />
          </div>
        ) : savedPlans.length === 0 ? (
          <p className="text-muted-foreground italic">No saved leave plans yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {savedPlans.map(plan => (
              <Card key={plan.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-bold text-lg">{plan.title}</h3>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${plan.projected_attendance >= requiredAttendance ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {plan.projected_attendance >= requiredAttendance ? 'SAFE' : 'WARNING'}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-muted-foreground flex gap-2 items-center">
                    <Calendar size={14} /> 
                    {format(parseISO(plan.start_date), 'MMM d, yyyy')} - {format(parseISO(plan.end_date), 'MMM d, yyyy')}
                  </p>
                </div>
                
                <div className="flex items-center gap-6 bg-muted/50 p-3 rounded-xl">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground font-bold uppercase">Missed</p>
                    <p className="font-black text-red-500">{plan.missed_classes_count}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground font-bold uppercase">Projected</p>
                    <p className="font-black">{plan.projected_attendance}%</p>
                  </div>
                  <button 
                    onClick={() => handleDeletePlan(plan.id)}
                    className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Delete Plan"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
