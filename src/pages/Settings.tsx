import React from 'react';
import { useAttendance } from '../store/AttendanceContext';
import { Card } from '../components/ui';

export default function SettingsPage() {
  const { settings, updateSettings, profile } = useAttendance();

  const handleExport = () => {
    alert("Export is coming soon!");
  };

  const handleReset = () => {
    alert("Resetting data is disabled for the production app. Please contact support.");
  };

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your app preferences.</p>
      </header>

      <Card className="p-6 space-y-6">
        <div>
          <h2 className="text-lg font-bold mb-4">Preferences</h2>
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="font-medium">Required Attendance</p>
              <p className="text-sm text-muted-foreground">The minimum percentage to stay in the SAFE zone.</p>
            </div>
            <div className="flex items-center space-x-2">
              <input 
                type="number" 
                value={settings?.required_percentage || 75}
                onChange={(e) => updateSettings({ required_percentage: Math.max(1, Math.min(100, parseInt(e.target.value) || 0)) })}
                className="w-20 bg-background border border-border rounded-lg px-3 py-2 text-center font-bold"
              />
              <span className="font-bold">%</span>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium">Theme</p>
              <p className="text-sm text-muted-foreground">Light or Dark mode.</p>
            </div>
            <select
              value={settings?.theme || 'system'}
              onChange={(e) => updateSettings({ theme: e.target.value as any })}
              className="bg-background border border-border rounded-lg px-3 py-2"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System Default</option>
            </select>
          </div>
        </div>

        <div className="border-t border-border pt-6">
          <h2 className="text-lg font-bold mb-4">Profile Info</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Name</p>
              <p className="font-medium">{profile?.full_name}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Student ID</p>
              <p className="font-medium">{profile?.student_number}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Program</p>
              <p className="font-medium">{profile?.program}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Semester</p>
              <p className="font-medium">{profile?.semester}</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
