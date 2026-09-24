import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/ui';
import { Save, Plus, Trash2, Clock, Upload, Loader2, Calendar } from 'lucide-react';
import { timetableService, WeeklySchedule, TimetableSlot } from '../services/timetableService';
import { v4 as uuidv4 } from 'uuid';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const DEFAULT_SCHEDULE: WeeklySchedule = {
  Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: []
};

export default function Timetable() {
  const { user } = useAuth();
  
  const [schedule, setSchedule] = useState<WeeklySchedule>(DEFAULT_SCHEDULE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchTimetable() {
      if (!user) return;
      setLoading(true);
      try {
        const data = await timetableService.getTimetable(user.id);
        if (data) {
          setSchedule(data);
        }
      } catch (e) {
        console.error("Failed to load timetable", e);
      } finally {
        setLoading(false);
      }
    }
    fetchTimetable();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await timetableService.saveTimetable(user.id, schedule);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      alert('Failed to save timetable: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    try {
      const parsedSchedule = await timetableService.mockParseTimetableFile(file);
      setSchedule(parsedSchedule);
    } catch (error) {
      alert("Failed to parse timetable image.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = ''; // reset
    }
  };

  const updateSlot = (day: keyof WeeklySchedule, index: number, field: keyof TimetableSlot, value: string) => {
    setSchedule(prev => {
      const newSchedule = { ...prev };
      const newDay = [...newSchedule[day]];
      newDay[index] = { ...newDay[index], [field]: value };
      newSchedule[day] = newDay;
      return newSchedule;
    });
  };

  const removeSlot = (day: keyof WeeklySchedule, index: number) => {
    setSchedule(prev => {
      const newSchedule = { ...prev };
      const newDay = [...newSchedule[day]];
      newDay.splice(index, 1);
      newSchedule[day] = newDay;
      return newSchedule;
    });
  };

  const addSlot = (day: keyof WeeklySchedule) => {
    setSchedule(prev => {
      const newSchedule = { ...prev };
      newSchedule[day] = [...newSchedule[day], { time: '', subject: '', type: 'Theory' }];
      return newSchedule;
    });
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading schedule...</div>;
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-primary flex items-center gap-2">
            <Calendar size={28} /> Timetable
          </h1>
          <p className="text-muted-foreground mt-1">Manage or auto-detect your weekly class schedule.</p>
        </div>
        <div className="flex items-center gap-3">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload}
            accept=".png,.jpg,.jpeg,.pdf"
            className="hidden" 
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || saving}
            className="bg-secondary text-secondary-foreground px-4 py-2 rounded-xl flex items-center space-x-2 hover:bg-secondary/90 transition shadow-sm font-bold"
          >
            {uploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
            <span>{uploading ? 'Scanning...' : 'Upload Timetable'}</span>
          </button>
          <button
            onClick={handleSave}
            disabled={saving || uploading}
            className="bg-primary text-primary-foreground px-6 py-2 rounded-xl flex items-center space-x-2 hover:bg-primary/90 transition disabled:opacity-50 shadow-md font-bold"
          >
            <Save size={18} />
            <span>{saving ? 'Saving...' : (saved ? 'Saved!' : 'Save Changes')}</span>
          </button>
        </div>
      </header>

      {uploading && (
        <div className="bg-primary/10 border border-primary/20 p-6 rounded-xl text-center text-primary font-medium animate-pulse">
          Scanning timetable and organizing weekly schedule...
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {DAYS.map(dayStr => {
          const day = dayStr as keyof WeeklySchedule;
          const slots = schedule[day];
          
          return (
            <Card key={day} className="p-5 flex flex-col h-full border-border/50 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-black tracking-tight">{day}</h2>
                <button onClick={() => addSlot(day)} className="text-primary hover:bg-primary/10 p-1.5 rounded-md transition">
                  <Plus size={18} />
                </button>
              </div>
              
              <div className="space-y-3 flex-grow">
                {slots.length === 0 ? (
                  <div className="text-sm text-muted-foreground italic text-center p-4 bg-muted/20 rounded-lg border border-dashed">
                    No classes scheduled.
                  </div>
                ) : (
                  slots.map((slot, index) => (
                    <div key={index} className="flex flex-col bg-secondary/20 border border-border/50 p-3 rounded-lg gap-2 group hover:border-primary/30 transition-colors">
                      <div className="flex justify-between items-start gap-2">
                         <input 
                           type="text" 
                           placeholder="Subject Name"
                           value={slot.subject} 
                           onChange={(e) => updateSlot(day, index, 'subject', e.target.value)}
                           className="bg-background border rounded px-2 py-1.5 text-sm font-semibold w-full outline-none focus:ring-1 focus:ring-primary"
                         />
                         <button onClick={() => removeSlot(day, index)} className="text-red-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-md opacity-50 group-hover:opacity-100 transition">
                           <Trash2 size={16} />
                         </button>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-1">
                         <div className="flex items-center gap-1.5 bg-background border rounded px-2 py-1 flex-1">
                           <Clock size={14} className="text-muted-foreground shrink-0" />
                           <input 
                             type="text" 
                             placeholder="HH:MM - HH:MM"
                             value={slot.time} 
                             onChange={(e) => updateSlot(day, index, 'time', e.target.value)}
                             className="bg-transparent text-xs w-full outline-none font-medium"
                           />
                         </div>
                         <select 
                           value={slot.type}
                           onChange={(e) => updateSlot(day, index, 'type', e.target.value)}
                           className={`border rounded px-2 py-1 text-xs font-bold outline-none cursor-pointer w-28 text-center
                             ${slot.type === 'Theory' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-purple-50 text-purple-700 border-purple-200'}
                           `}
                         >
                           <option value="Theory">Theory</option>
                           <option value="Practical">Practical</option>
                         </select>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
