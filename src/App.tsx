import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from './components/ui/Sidebar';
import MobileNav from './components/ui/MobileNav';
import Dashboard from './pages/Dashboard';
import Subjects from './pages/Subjects';
import DailyAttendance from './pages/DailyAttendance';
import PlanLeave from './pages/PlanLeave';
import Timetable from './pages/Timetable';
import UploadSheet from './pages/UploadSheet';
import CalculatorPage from './pages/Calculator';
import WhatIf from './pages/WhatIf';
import HistoryPage from './pages/History';
import SettingsPage from './pages/Settings';
import About from './pages/About';

import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import Onboarding from './pages/auth/Onboarding';
import ProtectedRoute from './components/auth/ProtectedRoute';
import OnboardingGuard from './components/auth/OnboardingGuard';

import { useAttendance } from './store/AttendanceContext';

function AppLayout() {
  const { settings } = useAttendance();

  useEffect(() => {
    if (settings?.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings?.theme]);

  return (
    <div className="flex h-screen bg-background text-foreground transition-colors duration-300 overflow-hidden">
      <Sidebar />
      <div className="flex-1 overflow-y-auto pb-20 md:pb-0">
        <Routes>
          <Route path="/" element={<OnboardingGuard><Dashboard /></OnboardingGuard>} />
          <Route path="/subjects" element={<OnboardingGuard><Subjects /></OnboardingGuard>} />
          <Route path="/daily" element={<OnboardingGuard><DailyAttendance /></OnboardingGuard>} />
          <Route path="/plan-leave" element={<OnboardingGuard><PlanLeave /></OnboardingGuard>} />
          <Route path="/timetable" element={<OnboardingGuard><Timetable /></OnboardingGuard>} />
          <Route path="/upload" element={<OnboardingGuard><UploadSheet /></OnboardingGuard>} />
          <Route path="/calculator" element={<OnboardingGuard><CalculatorPage /></OnboardingGuard>} />
          <Route path="/what-if" element={<OnboardingGuard><WhatIf /></OnboardingGuard>} />
          <Route path="/history" element={<OnboardingGuard><HistoryPage /></OnboardingGuard>} />
          <Route path="/settings" element={<OnboardingGuard><SettingsPage /></OnboardingGuard>} />
          <Route path="/about" element={<About />} />
        </Routes>
      </div>
      <MobileNav />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      
      {/* Protect everything else */}
      <Route path="/onboarding" element={
        <ProtectedRoute>
          <Onboarding />
        </ProtectedRoute>
      } />
      
      <Route path="/*" element={
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      } />
    </Routes>
  );
}
