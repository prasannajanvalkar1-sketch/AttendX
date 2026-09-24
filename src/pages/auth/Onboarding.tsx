import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useAttendance } from '../../store/AttendanceContext';
import { profileService } from '../../services/profileService';
import { Card } from '../../components/ui';

export default function Onboarding() {
  const { user } = useAuth();
  const { refreshData } = useAttendance();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Profile data
  const [profile, setProfile] = useState({
    full_name: '',
    student_number: '',
    program: '',
    academic_year: '2026-2027',
    semester: 'V'
  });

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!profile.full_name.trim() || !profile.student_number.trim()) {
      setError("Please enter both your Full Name and Student Number to continue.");
      return;
    }
    if (!user) {
      setError("Authentication error: User session not found. Please try refreshing the page or logging in again.");
      return;
    }
    
    setLoading(true);
    try {
      await profileService.createOrUpdateProfile({
        id: user.id,
        ...profile,
        additional_id: '',
        onboarding_completed: true // Simplified for now to allow access
      });
      await refreshData();
      navigate('/');
    } catch (e: any) {
      console.error(e);
      setError('Failed to save profile: ' + (e.message || JSON.stringify(e)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl p-8">
        <h1 className="text-2xl font-bold mb-6">Welcome to AttendX! Let's get started.</h1>
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded-lg">
            {error}
          </div>
        )}
        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Full Name</label>
            <input 
              value={profile.full_name} 
              onChange={e => setProfile({...profile, full_name: e.target.value})}
              className="w-full bg-background border border-border rounded-lg px-4 py-2" 
              placeholder="e.g. John Doe"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Student Number</label>
            <input 
              value={profile.student_number} 
              onChange={e => setProfile({...profile, student_number: e.target.value})}
              className="w-full bg-background border border-border rounded-lg px-4 py-2" 
              placeholder="e.g. 12345678"
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-primary text-primary-foreground py-2 rounded-lg font-bold"
          >
            {loading ? 'Saving...' : 'Complete Onboarding'}
          </button>
        </form>
      </Card>
    </div>
  );
}
