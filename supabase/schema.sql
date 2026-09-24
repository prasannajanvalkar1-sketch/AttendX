-- ==========================================
-- ATTENDX SUPABASE SCHEMA
-- ==========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. PROFILES TABLE
-- ==========================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  student_number TEXT,
  additional_id TEXT,
  program TEXT,
  academic_year TEXT,
  semester TEXT,
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- ==========================================
-- 2. SUBJECTS TABLE
-- ==========================================
CREATE TABLE public.subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  theory_conducted INTEGER DEFAULT 0,
  theory_attended INTEGER DEFAULT 0,
  practical_conducted INTEGER DEFAULT 0,
  practical_attended INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subjects" 
ON public.subjects FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subjects" 
ON public.subjects FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subjects" 
ON public.subjects FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own subjects" 
ON public.subjects FOR DELETE USING (auth.uid() = user_id);

-- ==========================================
-- 3. ATTENDANCE SNAPSHOTS
-- ==========================================
CREATE TABLE public.attendance_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_date DATE NOT NULL,
  period_from DATE,
  period_to DATE,
  total_conducted INTEGER DEFAULT 0,
  total_attended INTEGER DEFAULT 0,
  source_file_name TEXT,
  source_file_hash TEXT,
  imported_at TIMESTAMPTZ DEFAULT now(),
  is_current BOOLEAN DEFAULT false
);

ALTER TABLE public.attendance_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own snapshots" 
ON public.attendance_snapshots FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own snapshots" 
ON public.attendance_snapshots FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own snapshots" 
ON public.attendance_snapshots FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own snapshots" 
ON public.attendance_snapshots FOR DELETE USING (auth.uid() = user_id);

-- ==========================================
-- 4. ATTENDANCE SNAPSHOT SUBJECTS
-- ==========================================
CREATE TABLE public.attendance_snapshot_subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  snapshot_id UUID NOT NULL REFERENCES public.attendance_snapshots(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  subject_name_at_import TEXT NOT NULL,
  theory_conducted INTEGER DEFAULT 0,
  theory_attended INTEGER DEFAULT 0,
  practical_conducted INTEGER DEFAULT 0,
  practical_attended INTEGER DEFAULT 0,
  total_conducted INTEGER DEFAULT 0,
  total_attended INTEGER DEFAULT 0
);

ALTER TABLE public.attendance_snapshot_subjects ENABLE ROW LEVEL SECURITY;

-- Note: Access is controlled through the snapshot_id which is owned by user
CREATE POLICY "Users can view own snapshot subjects" 
ON public.attendance_snapshot_subjects FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.attendance_snapshots WHERE id = snapshot_id AND user_id = auth.uid()));

CREATE POLICY "Users can insert own snapshot subjects" 
ON public.attendance_snapshot_subjects FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM public.attendance_snapshots WHERE id = snapshot_id AND user_id = auth.uid()));

CREATE POLICY "Users can update own snapshot subjects" 
ON public.attendance_snapshot_subjects FOR UPDATE 
USING (EXISTS (SELECT 1 FROM public.attendance_snapshots WHERE id = snapshot_id AND user_id = auth.uid()));

CREATE POLICY "Users can delete own snapshot subjects" 
ON public.attendance_snapshot_subjects FOR DELETE 
USING (EXISTS (SELECT 1 FROM public.attendance_snapshots WHERE id = snapshot_id AND user_id = auth.uid()));

-- ==========================================
-- 5. TIMETABLE
-- ==========================================
CREATE TABLE public.timetable (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  start_time TIME,
  end_time TIME,
  room TEXT,
  faculty TEXT,
  slot_order INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE public.timetable ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own timetable" 
ON public.timetable FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own timetable" 
ON public.timetable FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own timetable" 
ON public.timetable FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own timetable" 
ON public.timetable FOR DELETE USING (auth.uid() = user_id);

-- ==========================================
-- 6. DAILY ATTENDANCE
-- ==========================================
CREATE TABLE public.daily_attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  timetable_slot_id UUID REFERENCES public.timetable(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK(status IN ('present','absent')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure a user can't mark attendance multiple times for the exact same slot on the same day
CREATE UNIQUE INDEX daily_attendance_unique_idx ON public.daily_attendance 
(user_id, attendance_date, subject_id, COALESCE(timetable_slot_id, '00000000-0000-0000-0000-000000000000'::uuid));

ALTER TABLE public.daily_attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own daily attendance" 
ON public.daily_attendance FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily attendance" 
ON public.daily_attendance FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily attendance" 
ON public.daily_attendance FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own daily attendance" 
ON public.daily_attendance FOR DELETE USING (auth.uid() = user_id);

-- ==========================================
-- 7. HOLIDAYS
-- ==========================================
CREATE TABLE public.holidays (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('holiday', 'exam', 'event', 'no-class'))
);

ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own holidays" 
ON public.holidays FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own holidays" 
ON public.holidays FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own holidays" 
ON public.holidays FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own holidays" 
ON public.holidays FOR DELETE USING (auth.uid() = user_id);

-- ==========================================
-- 8. SETTINGS
-- ==========================================
CREATE TABLE public.settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  required_percentage NUMERIC DEFAULT 75,
  theme TEXT DEFAULT 'system',
  notifications_enabled BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own settings" 
ON public.settings FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" 
ON public.settings FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" 
ON public.settings FOR UPDATE USING (auth.uid() = user_id);

-- ==========================================
-- 9. LEAVE PLANS
-- ==========================================
CREATE TABLE public.leave_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  result TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.leave_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own leave plans" 
ON public.leave_plans FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own leave plans" 
ON public.leave_plans FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own leave plans" 
ON public.leave_plans FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own leave plans" 
ON public.leave_plans FOR DELETE USING (auth.uid() = user_id);

-- ==========================================
-- 10. ATTENDANCE IMPORTS
-- ==========================================
CREATE TABLE public.attendance_imports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT,
  file_hash TEXT,
  report_date DATE,
  imported_at TIMESTAMPTZ DEFAULT now(),
  status TEXT NOT NULL,
  error_message TEXT
);

ALTER TABLE public.attendance_imports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own imports" 
ON public.attendance_imports FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own imports" 
ON public.attendance_imports FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own imports" 
ON public.attendance_imports FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own imports" 
ON public.attendance_imports FOR DELETE USING (auth.uid() = user_id);

-- ==========================================
-- TRIGGERS FOR UPDATED_AT
-- ==========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subjects_updated_at BEFORE UPDATE ON public.subjects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_daily_attendance_updated_at BEFORE UPDATE ON public.daily_attendance FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON public.settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
