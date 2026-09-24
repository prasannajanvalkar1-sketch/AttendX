import React from 'react';
import { useAttendance } from '../store/AttendanceContext';
import { Card } from '../components/ui';

export default function HistoryPage() {
  const { dailyRecords, subjects } = useAttendance();

  // Sort by date descending
  const sortedRecords = [...dailyRecords].sort((a, b) => new Date(b.attendance_date).getTime() - new Date(a.attendance_date).getTime()).reverse();

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Attendance History</h1>
        <p className="text-muted-foreground">Log of your daily attendance records.</p>
      </header>

      <Card className="overflow-hidden">
        {sortedRecords.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No attendance records found.</div>
        ) : (
          <div className="divide-y divide-border">
            {sortedRecords.map((record) => {
              const subject = subjects.find(s => s.id === record.subject_id);
              const status = record.status === 'present' ? 'Present' : 'Absent';
              
              return (
                <div key={record.id} className="p-4 flex justify-between items-center hover:bg-secondary/20 transition">
                  <div>
                    <p className="font-semibold">{subject?.name || 'Unknown Subject'}</p>
                    <p className="text-sm text-muted-foreground">{record.attendance_date}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      status === 'Present' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
