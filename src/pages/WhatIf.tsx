import React, { useState } from 'react';
import { Card, ProgressBar, StatusBadge } from '../components/ui';
import { calculateCurrentAttendance, projectFutureAttendance } from '../utils/attendanceCalculations';
import { useAttendance } from '../store/AttendanceContext';

export default function WhatIf() {
  const { subjects, snapshot, snapshotSubjects, dailyRecords, settings } = useAttendance();
  const requiredAttendance = settings?.required_percentage || 75;
  const currentAttendanceList = calculateCurrentAttendance(subjects, snapshot, snapshotSubjects, dailyRecords, requiredAttendance);
  
  const [selectedSubject, setSelectedSubject] = useState<string>(subjects[0]?.id || '');
  const [futureAttended, setFutureAttended] = useState<number>(0);
  const [futureMissed, setFutureMissed] = useState<number>(0);

  const subjectData = currentAttendanceList.find(s => s.subjectId === selectedSubject);

  if (!subjectData) return null;

  const currentPercentage = subjectData.percentage;
  const projectedPercentage = projectFutureAttendance(
    subjectData.attended, 
    subjectData.conducted, 
    futureAttended, 
    futureMissed
  );

  let projectedStatus: 'SAFE' | 'WARNING' | 'NOT_SAFE' = 'SAFE';
  if (projectedPercentage < requiredAttendance) {
    projectedStatus = 'NOT_SAFE';
  } else if (projectedPercentage < requiredAttendance + 5) {
    projectedStatus = 'WARNING';
  }

  const difference = projectedPercentage - currentPercentage;

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-bold">What-If Calculator</h1>
        <p className="text-muted-foreground">Simulate future attendance for a specific subject.</p>
      </header>

      <Card className="p-6">
        <label className="block text-sm font-medium mb-1">Select Subject</label>
        <select 
          value={selectedSubject} 
          onChange={(e) => {
            setSelectedSubject(e.target.value);
            setFutureAttended(0);
            setFutureMissed(0);
          }}
          className="w-full bg-background border border-border rounded-lg px-3 py-2 mb-6 focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {subjects.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        <div className="flex justify-between items-center bg-secondary/50 p-4 rounded-xl mb-6">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Current Attendance</p>
            <p className="text-xl font-bold">{currentPercentage.toFixed(2)}%</p>
            <p className="text-xs text-muted-foreground">{subjectData.attended} / {subjectData.conducted}</p>
          </div>
          <StatusBadge status={subjectData.status} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div>
            <label className="block text-sm font-medium mb-1">Future Classes I WILL ATTEND</label>
            <div className="flex items-center space-x-2">
              <button onClick={() => setFutureAttended(Math.max(0, futureAttended - 1))} className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center font-bold text-xl">-</button>
              <input 
                type="number" 
                min="0"
                value={futureAttended}
                onChange={(e) => setFutureAttended(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full h-10 text-center font-bold text-xl bg-background border border-border rounded-lg"
              />
              <button onClick={() => setFutureAttended(futureAttended + 1)} className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center font-bold text-xl">+</button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Future Classes I WILL MISS</label>
            <div className="flex items-center space-x-2">
              <button onClick={() => setFutureMissed(Math.max(0, futureMissed - 1))} className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center font-bold text-xl">-</button>
              <input 
                type="number" 
                min="0"
                value={futureMissed}
                onChange={(e) => setFutureMissed(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full h-10 text-center font-bold text-xl bg-background border border-border rounded-lg"
              />
              <button onClick={() => setFutureMissed(futureMissed + 1)} className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center font-bold text-xl">+</button>
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">Projected Result</h3>
            <div className="text-right">
              <span className={`text-sm font-bold ${difference >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {difference > 0 ? '+' : ''}{difference.toFixed(2)}%
              </span>
            </div>
          </div>
          
          <div className="flex justify-between items-end mb-2">
            <span className={`text-4xl font-black ${projectedStatus === 'NOT_SAFE' ? 'text-red-500' : 'text-green-500'}`}>
              {projectedPercentage.toFixed(2)}%
            </span>
            <StatusBadge status={projectedStatus} />
          </div>
          <ProgressBar percentage={projectedPercentage} status={projectedStatus} />
          
          <p className="text-sm text-center text-muted-foreground mt-4">
            Based on {subjectData.attended + futureAttended} / {subjectData.conducted + futureAttended + futureMissed} total classes.
          </p>
        </div>
      </Card>
    </div>
  );
}
