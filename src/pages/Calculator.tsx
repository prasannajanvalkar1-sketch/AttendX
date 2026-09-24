import React, { useState } from 'react';
import { Card } from '../components/ui';
import { calculateCurrentAttendance, classesNeededToReach, classesCanMiss, projectFutureAttendance } from '../utils/attendanceCalculations';
import { useAttendance } from '../store/AttendanceContext';
import { AlertCircle, Target, TrendingUp, CalendarDays, Calculator as CalculatorIcon } from 'lucide-react';

export default function Calculator() {
  const { subjects, snapshot, snapshotSubjects, dailyRecords, settings } = useAttendance();
  const requiredAttendance = settings?.required_percentage || 75;
  const currentAttendanceList = calculateCurrentAttendance(subjects, snapshot, snapshotSubjects, dailyRecords, requiredAttendance);
  
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [conducted, setConducted] = useState<number>(0);
  const [attended, setAttended] = useState<number>(0);
  
  const [classesPerDay, setClassesPerDay] = useState<number>(1);
  const [futureAttended, setFutureAttended] = useState<number>(0);
  const [futureMissed, setFutureMissed] = useState<number>(0);

  const handleSubjectChange = (id: string) => {
    setSelectedSubject(id);
    const sub = currentAttendanceList.find(s => s.subjectId === id);
    if (sub) {
      setConducted(sub.conducted);
      setAttended(sub.attended);
    }
  };

  const percentage = conducted === 0 ? 0 : (attended / conducted) * 100;
  
  const needed75 = classesNeededToReach(attended, conducted, 75);
  const needed80 = classesNeededToReach(attended, conducted, 80);
  const canMiss75 = classesCanMiss(attended, conducted, 75);

  const newAttended = attended + futureAttended;
  const newConducted = conducted + futureAttended + futureMissed;
  const predictedAttendance = newConducted === 0 ? 0 : (newAttended / newConducted) * 100;

  // Projections (assuming 20 working days per month)
  // Assuming the user attends ALL projected classes for these months to show maximum potential
  const classes1Month = 20 * classesPerDay;
  const proj1Month = projectFutureAttendance(attended, conducted, classes1Month, 0);
  
  const classes3Months = 60 * classesPerDay;
  const proj3Months = projectFutureAttendance(attended, conducted, classes3Months, 0);

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <header>
        <h1 className="text-3xl font-black text-primary mb-2 flex items-center gap-3">
          <CalculatorIcon size={32} /> Attendance Predictor
        </h1>
        <p className="text-muted-foreground text-lg">Calculate your future attendance based on planned leaves and schedule.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Current Status</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-muted-foreground mb-1 uppercase">Select Subject (Optional)</label>
                <select 
                  value={selectedSubject} 
                  onChange={(e) => handleSubjectChange(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary font-medium"
                >
                  <option value="">Custom Values</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-muted-foreground mb-1 uppercase">Classes Conducted</label>
                  <input 
                    type="number" min="0"
                    value={conducted}
                    onChange={(e) => setConducted(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 font-bold text-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-muted-foreground mb-1 uppercase">Classes Attended</label>
                  <input 
                    type="number" min="0" max={conducted}
                    value={attended}
                    onChange={(e) => setAttended(Math.max(0, Math.min(conducted, parseInt(e.target.value) || 0)))}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 font-bold text-lg"
                  />
                </div>
              </div>
              
              <div className="pt-4 border-t flex justify-between items-center">
                <span className="font-bold">Current Attendance</span>
                <span className={`text-2xl font-black ${percentage >= 75 ? 'text-green-500' : 'text-red-500'}`}>
                  {percentage.toFixed(2)}%
                </span>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-primary/20 bg-primary/5">
            <h2 className="text-xl font-bold mb-4">Future Planning</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-muted-foreground mb-1 uppercase">Future Attended</label>
                  <input 
                    type="number" min="0"
                    value={futureAttended}
                    onChange={(e) => setFutureAttended(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 font-bold text-lg text-green-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-muted-foreground mb-1 uppercase">Future Missed (Absent)</label>
                  <input 
                    type="number" min="0"
                    value={futureMissed}
                    onChange={(e) => setFutureMissed(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 font-bold text-lg text-red-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t flex justify-between items-center">
                <span className="font-bold">Predicted Attendance</span>
                <span className={`text-2xl font-black ${predictedAttendance >= 75 ? 'text-green-500' : 'text-red-500'}`}>
                  {predictedAttendance.toFixed(2)}%
                </span>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Target className="text-primary" /> Goals & Limits</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-100">
                <span className="font-medium text-red-800 dark:text-red-200">Classes needed for 75%</span>
                <span className="text-xl font-black text-red-600">{needed75}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-100">
                <span className="font-medium text-blue-800 dark:text-blue-200">Classes needed for 80%</span>
                <span className="text-xl font-black text-blue-600">{needed80}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-100">
                <span className="font-medium text-green-800 dark:text-green-200">Max classes you can miss (keep 75%)</span>
                <span className="text-xl font-black text-green-600">{canMiss75}</span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2"><TrendingUp className="text-primary" /> Projections</h2>
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-muted-foreground uppercase">Classes/Day</label>
                <input 
                  type="number" min="1" max="10"
                  value={classesPerDay}
                  onChange={(e) => setClassesPerDay(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-16 bg-background border border-border rounded-lg px-2 py-1 font-bold text-sm text-center"
                />
              </div>
            </div>
            
            <p className="text-xs text-muted-foreground mb-4">Assuming you attend all upcoming classes (20 days/month)</p>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-bold flex items-center gap-2"><CalendarDays size={16} /> After 1 Month</span>
                  <span className="font-black text-primary">{proj1Month.toFixed(2)}%</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div className="bg-primary rounded-full h-2 transition-all" style={{ width: `${Math.min(100, proj1Month)}%` }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-bold flex items-center gap-2"><CalendarDays size={16} /> After 3 Months</span>
                  <span className="font-black text-primary">{proj3Months.toFixed(2)}%</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div className="bg-primary rounded-full h-2 transition-all" style={{ width: `${Math.min(100, proj3Months)}%` }}></div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
