import React from 'react';
import { Card } from '../components/ui';

export default function About() {
  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-bold">About AttendX</h1>
      </header>

      <Card className="p-6 space-y-4">
        <p>
          <strong>AttendX</strong> is a smart attendance management tool designed to help college students track attendance, understand attendance requirements, and plan future leave.
        </p>

        <h3 className="font-bold text-lg pt-4">Features:</h3>
        <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
          <li>Official Attendance Sheet Import</li>
          <li>Daily Attendance Tracking</li>
          <li>Attendance Calculator</li>
          <li>What-If Calculator</li>
          <li>Leave Planner</li>
          <li>Timetable Integration</li>
          <li>Attendance History</li>
          <li>Local Storage Privacy</li>
        </ul>

        <h3 className="font-bold text-lg pt-4">Privacy:</h3>
        <p className="text-muted-foreground">
          Your attendance data is stored locally in your browser in this version. 
          Files uploaded are processed locally and not sent to any external server.
        </p>
      </Card>
    </div>
  );
}
