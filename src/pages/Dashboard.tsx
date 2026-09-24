import React from 'react';
import { useAttendance } from '../store/AttendanceContext';
import { calculateCurrentAttendance, classesNeededToReach } from '../utils/attendanceCalculations';
import { Card, ProgressCircle, ProgressBar, StatusBadge } from '../components/ui';
import { Link } from 'react-router-dom';
import { AlertCircle, CalendarCheck, Upload } from 'lucide-react';

export default function Dashboard() {
  const { profile, subjects, snapshot, snapshotSubjects, dailyRecords, settings } = useAttendance();

  // Handle case where settings are not loaded yet
  const requiredAttendance = settings?.required_percentage || 75;

  const currentAttendance = calculateCurrentAttendance(subjects, snapshot, snapshotSubjects, dailyRecords, requiredAttendance);

  const totalConducted = currentAttendance.reduce((acc, curr) => acc + curr.conducted, 0);
  const totalAttended = currentAttendance.reduce((acc, curr) => acc + curr.attended, 0);
  const overallPercentage = totalConducted === 0 ? 0 : (totalAttended / totalConducted) * 100;
  
  let overallStatus: 'SAFE' | 'WARNING' | 'NOT_SAFE' = 'SAFE';
  if (overallPercentage < requiredAttendance) {
    overallStatus = 'NOT_SAFE';
  } else if (overallPercentage < requiredAttendance + 5) {
    overallStatus = 'WARNING';
  }

  const needsAttention = currentAttendance.filter(s => s.status === 'NOT_SAFE');

  const firstName = profile?.full_name ? (profile.full_name.split(' ')[0]) : 'Student';

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Good evening, {firstName} 👋</h1>
        <p className="text-muted-foreground">Here's your attendance overview.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 md:col-span-2 flex flex-col md:flex-row items-center justify-between">
          <div className="mb-6 md:mb-0 text-center md:text-left">
            <h2 className="text-lg font-semibold mb-2">Overall Attendance</h2>
            <div className="text-4xl font-bold mb-2">
              {totalAttended} / {totalConducted} <span className="text-lg font-normal text-muted-foreground">Classes</span>
            </div>
            <div className="flex items-center space-x-4 justify-center md:justify-start">
              <span className="text-sm">Required: <span className="font-semibold">{requiredAttendance}%</span></span>
              <StatusBadge status={overallStatus} />
            </div>
          </div>
          <ProgressCircle percentage={overallPercentage} status={overallStatus} size={140} />
        </Card>

        <Card className="p-6 flex flex-col justify-between">
          <h2 className="text-lg font-semibold mb-4">Quick Stats</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total Classes</span>
              <span className="font-bold">{totalConducted}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Attended</span>
              <span className="font-bold text-green-600 dark:text-green-400">{totalAttended}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Missed</span>
              <span className="font-bold text-red-600 dark:text-red-400">{totalConducted - totalAttended}</span>
            </div>
          </div>
        </Card>
      </div>

      <div className="text-xs text-muted-foreground flex items-center space-x-1">
        <AlertCircle size={14} />
        <span>Source: Official report ({snapshot ? snapshot.report_date : 'None'}) + Daily attendance</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/daily" className="bg-primary text-primary-foreground p-4 rounded-xl flex items-center justify-center space-x-2 shadow hover:bg-primary/90 transition">
          <CalendarCheck size={20} />
          <span className="font-semibold">Mark Today's</span>
        </Link>
        <Link to="/upload" className="bg-secondary text-secondary-foreground p-4 rounded-xl flex items-center justify-center space-x-2 shadow hover:bg-secondary/80 transition">
          <Upload size={20} />
          <span className="font-semibold">Upload Sheet</span>
        </Link>
        <Link to="/plan-leave" className="bg-secondary text-secondary-foreground p-4 rounded-xl flex items-center justify-center space-x-2 shadow hover:bg-secondary/80 transition">
          <span className="font-semibold">Plan Leave</span>
        </Link>
        <Link to="/subjects" className="bg-secondary text-secondary-foreground p-4 rounded-xl flex items-center justify-center space-x-2 shadow hover:bg-secondary/80 transition">
          <span className="font-semibold">All Subjects</span>
        </Link>
      </div>

      {needsAttention.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4 flex items-center text-red-500">
            <AlertCircle className="mr-2" /> Needs Attention
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {needsAttention.map(sub => {
              const needed = classesNeededToReach(sub.attended, sub.conducted, requiredAttendance);
              return (
                <Card key={sub.subjectId} className="p-4 border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-900/10">
                  <h3 className="font-semibold mb-2">{sub.subjectName}</h3>
                  <div className="flex justify-between text-sm mb-2">
                    <span>{sub.percentage.toFixed(2)}%</span>
                    <span className="text-red-500 font-medium">Need {needed} classes to recover</span>
                  </div>
                  <ProgressBar percentage={sub.percentage} status="NOT_SAFE" />
                </Card>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Subjects</h2>
          <Link to="/subjects" className="text-primary text-sm font-medium hover:underline">View All</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentAttendance.slice(0, 6).map(sub => (
            <Card key={sub.subjectId} className="p-4 flex flex-col justify-between">
              <div>
                <h3 className="font-semibold line-clamp-1 mb-1" title={sub.subjectName}>{sub.subjectName}</h3>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-2xl font-bold">{sub.percentage.toFixed(2)}%</span>
                  <StatusBadge status={sub.status} />
                </div>
                <div className="text-sm text-muted-foreground mb-3">
                  {sub.attended} / {sub.conducted} classes
                </div>
              </div>
              <ProgressBar percentage={sub.percentage} status={sub.status} />
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
