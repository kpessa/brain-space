-- Create routine_progress table
CREATE TABLE IF NOT EXISTS public.routine_progress (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_day INTEGER DEFAULT 0 CHECK (current_day >= 0 AND current_day <= 66),
  started_at DATE,
  last_completed_date DATE,
  total_days_completed INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  morning_routines_completed INTEGER DEFAULT 0,
  evening_routines_completed INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create routine_entries table
CREATE TABLE IF NOT EXISTS public.routine_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL CHECK (day_number >= 0 AND day_number <= 66),
  date DATE NOT NULL,
  
  -- Evening routine fields
  evening_completed BOOLEAN DEFAULT FALSE,
  sleep_intention TIME,
  wake_intention TIME,
  magical_moment TEXT,
  morning_ritual_plan JSONB,
  
  -- Morning routine fields
  morning_completed BOOLEAN DEFAULT FALSE,
  actual_sleep_time TIME,
  actual_wake_time TIME,
  ritual_completed JSONB,
  mit TEXT,
  one_percent_improvement TEXT,
  distractions_to_minimize JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one entry per user per day
  UNIQUE(user_id, date)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_routine_entries_user_id ON public.routine_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_routine_entries_date ON public.routine_entries(date);
CREATE INDEX IF NOT EXISTS idx_routine_entries_day_number ON public.routine_entries(day_number);

-- Enable RLS
ALTER TABLE public.routine_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routine_entries ENABLE ROW LEVEL SECURITY;

-- Create policies for routine_progress
CREATE POLICY "Users can view own routine progress" ON public.routine_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own routine progress" ON public.routine_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own routine progress" ON public.routine_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- Create policies for routine_entries
CREATE POLICY "Users can view own routine entries" ON public.routine_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own routine entries" ON public.routine_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own routine entries" ON public.routine_entries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own routine entries" ON public.routine_entries
  FOR DELETE USING (auth.uid() = user_id);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_routine_progress_updated_at BEFORE UPDATE ON public.routine_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_routine_entries_updated_at BEFORE UPDATE ON public.routine_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();