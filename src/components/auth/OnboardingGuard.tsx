import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAttendance } from '../../store/AttendanceContext';

export default function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAttendance();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-primary font-bold">Loading your data...</div>
      </div>
    );
  }

  // If there's no profile or it's not completed, redirect to onboarding
  if (!profile || !profile.onboarding_completed) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}
