import React from 'react';
import { useAttendance } from '../store/AttendanceContext';
import { calculateCurrentAttendance, classesNeededToReach, classesCanMiss } from '../utils/attendanceCalculations';
import { Card, ProgressBar, StatusBadge } from '../components/ui';

export default function Subjects() {
  const { subjects, snapshot, snapshotSubjects, dailyRecords, settings } = useAttendance();

  const requiredAttendance = settings?.required_percentage || 75;

  const currentAttendance = calculateCurrentAttendance(subjects, snapshot, snapshotSubjects, dailyRecords, requiredAttendance);

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">All Subjects</h1>
          <p className="text-muted-foreground">View detailed attendance for each subject.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4">
        {currentAttendance.map(sub => {
          const needed = classesNeededToReach(sub.attended, sub.conducted, requiredAttendance);
          const canMiss = classesCanMiss(sub.attended, sub.conducted, requiredAttendance);
          
          return (
            <Card key={sub.subjectId} className="p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1">{sub.subjectName}</h3>
                <div className="text-sm text-muted-foreground mb-3 flex items-center space-x-2">
                  <span>{sub.attended} / {sub.conducted} Attended</span>
                  <span>•</span>
                  <span>{sub.conducted - sub.attended} Missed</span>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 text-sm">
                  {sub.status === 'NOT_SAFE' ? (
                    <div className="text-red-500 font-medium">
                      Need to attend {needed} more classes
                    </div>
                  ) : (
                    <div className="text-green-600 dark:text-green-400 font-medium">
                      Can safely miss {canMiss} classes
                    </div>
                  )}
                </div>
              </div>

              <div className="w-full md:w-48 flex flex-col items-end">
                <div className="flex justify-between w-full items-center mb-2">
                  <span className="text-2xl font-bold">{sub.percentage.toFixed(2)}%</span>
                  <StatusBadge status={sub.status} />
                </div>
                <ProgressBar percentage={sub.percentage} status={sub.status} className="w-full" />
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
