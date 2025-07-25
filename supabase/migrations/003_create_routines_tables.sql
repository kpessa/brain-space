-- Create routines-related tables (safe version that checks for existing objects)

-- First, ensure the tables don't exist before creating them
DO $$ 
BEGIN
    -- Drop tables if they exist (in reverse dependency order)
    DROP TABLE IF EXISTS routine_history CASCADE;
    DROP TABLE IF EXISTS routine_entries CASCADE;
    DROP TABLE IF EXISTS routine_templates CASCADE;
END $$;

-- Create routine_templates table
CREATE TABLE routine_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic info
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  
  -- Timing
  routine_type TEXT NOT NULL CHECK (routine_type IN ('morning', 'evening', 'custom')),
  custom_time TIME, -- For custom routines
  
  -- Content stored as JSONB for flexibility
  structure JSONB NOT NULL DEFAULT '{}',
  -- Structure includes: rituals, mits, improvements, etc.
  
  -- Tracking
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique active routine per type per user
  UNIQUE(user_id, routine_type, is_active)
);

-- Create routine_entries table (daily routine instances)
CREATE TABLE routine_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID REFERENCES routine_templates(id) ON DELETE SET NULL,
  
  -- When
  date DATE NOT NULL,
  routine_type TEXT NOT NULL CHECK (routine_type IN ('morning', 'evening', 'custom')),
  
  -- Content (snapshot of template + actual completion)
  planned_content JSONB NOT NULL DEFAULT '{}', -- What was planned
  actual_content JSONB DEFAULT '{}', -- What was actually done
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Reflection
  energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 10),
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- One routine entry per type per day per user
  UNIQUE(user_id, date, routine_type)
);

-- Create routine_history table for analytics
CREATE TABLE routine_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Streak tracking
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  total_completed INTEGER DEFAULT 0,
  
  -- Performance metrics
  average_completion_rate DECIMAL(5,2) DEFAULT 0.00, -- Percentage
  average_energy_level DECIMAL(3,1) DEFAULT 0.0,
  
  -- Milestones
  milestones JSONB DEFAULT '[]',
  achievements JSONB DEFAULT '[]',
  
  last_completed_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_routine_templates_user_id ON routine_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_routine_entries_user_date ON routine_entries(user_id, date);
CREATE INDEX IF NOT EXISTS idx_routine_entries_status ON routine_entries(status);

-- Enable RLS
ALTER TABLE routine_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
    -- Drop routine_templates policies if they exist
    DROP POLICY IF EXISTS "Users can manage own routine templates" ON routine_templates;
    
    -- Drop routine_entries policies if they exist
    DROP POLICY IF EXISTS "Users can manage own routine entries" ON routine_entries;
    
    -- Drop routine_history policies if they exist
    DROP POLICY IF EXISTS "Users can manage own routine history" ON routine_history;
END $$;

-- Create RLS policies
CREATE POLICY "Users can manage own routine templates" ON routine_templates
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own routine entries" ON routine_entries
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own routine history" ON routine_history
  FOR ALL USING (auth.uid() = user_id);