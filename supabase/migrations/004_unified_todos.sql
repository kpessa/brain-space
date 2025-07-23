-- Migration: Create unified todo system tables
-- This creates a centralized todo system that unifies tasks from BrainDump, Journal, and Routines

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types for better type safety
CREATE TYPE todo_type AS ENUM ('task', 'quest', 'ritual', 'habit', 'routine_item', 'gratitude_action');
CREATE TYPE todo_status AS ENUM ('pending', 'in_progress', 'completed', 'deferred', 'cancelled');
CREATE TYPE todo_source_type AS ENUM ('braindump', 'journal', 'routine', 'manual', 'recurring');
CREATE TYPE recurrence_pattern_type AS ENUM ('daily', 'weekly', 'monthly', 'custom');
CREATE TYPE attempt_outcome AS ENUM ('success', 'partial', 'failed', 'blocked');
CREATE TYPE completion_quality AS ENUM ('great', 'good', 'okay', 'poor');
CREATE TYPE relationship_type AS ENUM ('subtask', 'blocks', 'related', 'depends_on');
CREATE TYPE logic_type AS ENUM ('AND', 'OR', 'NONE');
CREATE TYPE tag_category AS ENUM ('context', 'project', 'area', 'energy', 'time');

-- Main todos table
CREATE TABLE public.todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Core fields
  title TEXT NOT NULL,
  description TEXT,
  type todo_type NOT NULL DEFAULT 'task',
  status todo_status NOT NULL DEFAULT 'pending',
  
  -- Priority fields (0-10 scale, using log scale like BrainDump)
  priority_importance DECIMAL(3,2) CHECK (priority_importance >= 0 AND priority_importance <= 10),
  priority_urgency DECIMAL(3,2) CHECK (priority_urgency >= 0 AND priority_urgency <= 10),
  
  -- Scheduling fields
  due_date DATE,
  scheduled_date DATE,
  scheduled_time TIME,
  scheduled_duration INTEGER, -- minutes
  
  -- Hierarchy
  parent_id UUID REFERENCES public.todos(id) ON DELETE CASCADE,
  position INTEGER DEFAULT 0, -- for ordering subtasks
  
  -- Source tracking
  source_type todo_source_type NOT NULL DEFAULT 'manual',
  source_id TEXT, -- flexible reference to original entry
  source_metadata JSONB, -- additional context from source
  
  -- Completion tracking
  completed_at TIMESTAMPTZ,
  completion_notes TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Computed fields stored for performance
  eisenhower_quadrant TEXT GENERATED ALWAYS AS (
    CASE 
      WHEN priority_importance >= 5 AND priority_urgency >= 5 THEN 'do-first'
      WHEN priority_importance >= 5 AND priority_urgency < 5 THEN 'schedule'
      WHEN priority_importance < 5 AND priority_urgency >= 5 THEN 'delegate'
      ELSE 'eliminate'
    END
  ) STORED
);

-- Recurrence patterns
CREATE TABLE public.todo_recurrence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  todo_id UUID NOT NULL REFERENCES public.todos(id) ON DELETE CASCADE,
  
  pattern_type recurrence_pattern_type NOT NULL,
  pattern_config JSONB NOT NULL, -- stores frequency, days of week, etc.
  
  start_date DATE NOT NULL,
  end_date DATE,
  
  -- Track next occurrence for efficient queries
  next_occurrence_date DATE,
  last_generated_date DATE,
  
  -- Habit tracking
  is_habit BOOLEAN DEFAULT FALSE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(todo_id)
);

-- Completion history (mainly for recurring tasks)
CREATE TABLE public.todo_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  todo_id UUID NOT NULL REFERENCES public.todos(id) ON DELETE CASCADE,
  
  completion_date DATE NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  quality completion_quality,
  duration_minutes INTEGER,
  notes TEXT,
  
  -- For habit tracking
  streak_count INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one completion per todo per date
  UNIQUE(todo_id, completion_date)
);

-- Attempt tracking
CREATE TABLE public.todo_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  todo_id UUID NOT NULL REFERENCES public.todos(id) ON DELETE CASCADE,
  
  attempt_date DATE NOT NULL DEFAULT CURRENT_DATE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  
  outcome attempt_outcome NOT NULL,
  duration_minutes INTEGER,
  notes TEXT,
  next_action TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Complex relationships between todos
CREATE TABLE public.todo_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  parent_todo_id UUID NOT NULL REFERENCES public.todos(id) ON DELETE CASCADE,
  child_todo_id UUID NOT NULL REFERENCES public.todos(id) ON DELETE CASCADE,
  
  relationship_type relationship_type NOT NULL DEFAULT 'subtask',
  logic_type logic_type DEFAULT 'NONE',
  is_optional BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate relationships
  UNIQUE(parent_todo_id, child_todo_id, relationship_type),
  -- Prevent self-relationships
  CHECK (parent_todo_id != child_todo_id)
);

-- Tags for flexible categorization
CREATE TABLE public.todo_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  todo_id UUID NOT NULL REFERENCES public.todos(id) ON DELETE CASCADE,
  
  tag_name TEXT NOT NULL,
  tag_category tag_category,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- One tag name per todo
  UNIQUE(todo_id, tag_name)
);

-- Integration tables
-- Link BrainDump nodes to todos
CREATE TABLE public.braindump_todos (
  braindump_id TEXT NOT NULL REFERENCES public.brain_dumps(id) ON DELETE CASCADE,
  node_id TEXT NOT NULL,
  todo_id UUID NOT NULL REFERENCES public.todos(id) ON DELETE CASCADE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  PRIMARY KEY (braindump_id, node_id, todo_id)
);

-- Link Journal entries to todos
CREATE TABLE public.journal_todos (
  journal_entry_id TEXT NOT NULL REFERENCES public.journal_entries(id) ON DELETE CASCADE,
  todo_id UUID NOT NULL REFERENCES public.todos(id) ON DELETE CASCADE,
  todo_type TEXT NOT NULL, -- 'daily_quest', 'gratitude_action', etc.
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  PRIMARY KEY (journal_entry_id, todo_id)
);

-- Link Routine entries to todos
CREATE TABLE public.routine_todos (
  routine_entry_id UUID NOT NULL REFERENCES public.routine_entries(id) ON DELETE CASCADE,
  todo_id UUID NOT NULL REFERENCES public.todos(id) ON DELETE CASCADE,
  todo_type TEXT NOT NULL, -- 'ritual_item', 'mit', 'improvement', etc.
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  PRIMARY KEY (routine_entry_id, todo_id)
);

-- Create indexes for performance
CREATE INDEX idx_todos_user_id ON public.todos(user_id);
CREATE INDEX idx_todos_status ON public.todos(status);
CREATE INDEX idx_todos_type ON public.todos(type);
CREATE INDEX idx_todos_parent_id ON public.todos(parent_id);
CREATE INDEX idx_todos_scheduled_date ON public.todos(scheduled_date);
CREATE INDEX idx_todos_due_date ON public.todos(due_date);
CREATE INDEX idx_todos_eisenhower_quadrant ON public.todos(eisenhower_quadrant);
CREATE INDEX idx_todos_source ON public.todos(source_type, source_id);

CREATE INDEX idx_todo_recurrence_next_date ON public.todo_recurrence(next_occurrence_date);
CREATE INDEX idx_todo_completions_todo_date ON public.todo_completions(todo_id, completion_date);
CREATE INDEX idx_todo_attempts_todo_id ON public.todo_attempts(todo_id);
CREATE INDEX idx_todo_relationships_parent ON public.todo_relationships(parent_todo_id);
CREATE INDEX idx_todo_relationships_child ON public.todo_relationships(child_todo_id);
CREATE INDEX idx_todo_tags_todo_id ON public.todo_tags(todo_id);
CREATE INDEX idx_todo_tags_name ON public.todo_tags(tag_name);

-- Enable RLS
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todo_recurrence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todo_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todo_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todo_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todo_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.braindump_todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routine_todos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for todos
CREATE POLICY "Users can view own todos" ON public.todos
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own todos" ON public.todos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own todos" ON public.todos
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own todos" ON public.todos
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for todo_recurrence
CREATE POLICY "Users can view own todo recurrence" ON public.todo_recurrence
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.todos WHERE todos.id = todo_recurrence.todo_id AND todos.user_id = auth.uid()
  ));

CREATE POLICY "Users can manage own todo recurrence" ON public.todo_recurrence
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.todos WHERE todos.id = todo_recurrence.todo_id AND todos.user_id = auth.uid()
  ));

-- RLS Policies for todo_completions
CREATE POLICY "Users can view own todo completions" ON public.todo_completions
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.todos WHERE todos.id = todo_completions.todo_id AND todos.user_id = auth.uid()
  ));

CREATE POLICY "Users can manage own todo completions" ON public.todo_completions
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.todos WHERE todos.id = todo_completions.todo_id AND todos.user_id = auth.uid()
  ));

-- RLS Policies for todo_attempts
CREATE POLICY "Users can view own todo attempts" ON public.todo_attempts
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.todos WHERE todos.id = todo_attempts.todo_id AND todos.user_id = auth.uid()
  ));

CREATE POLICY "Users can manage own todo attempts" ON public.todo_attempts
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.todos WHERE todos.id = todo_attempts.todo_id AND todos.user_id = auth.uid()
  ));

-- RLS Policies for todo_relationships
CREATE POLICY "Users can view own todo relationships" ON public.todo_relationships
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.todos WHERE todos.id = todo_relationships.parent_todo_id AND todos.user_id = auth.uid()
  ));

CREATE POLICY "Users can manage own todo relationships" ON public.todo_relationships
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.todos WHERE todos.id = todo_relationships.parent_todo_id AND todos.user_id = auth.uid()
  ));

-- RLS Policies for todo_tags
CREATE POLICY "Users can view own todo tags" ON public.todo_tags
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.todos WHERE todos.id = todo_tags.todo_id AND todos.user_id = auth.uid()
  ));

CREATE POLICY "Users can manage own todo tags" ON public.todo_tags
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.todos WHERE todos.id = todo_tags.todo_id AND todos.user_id = auth.uid()
  ));

-- RLS Policies for integration tables
CREATE POLICY "Users can view own braindump todos" ON public.braindump_todos
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.brain_dumps WHERE brain_dumps.id = braindump_todos.braindump_id AND brain_dumps.user_id = auth.uid()
  ));

CREATE POLICY "Users can manage own braindump todos" ON public.braindump_todos
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.brain_dumps WHERE brain_dumps.id = braindump_todos.braindump_id AND brain_dumps.user_id = auth.uid()
  ));

CREATE POLICY "Users can view own journal todos" ON public.journal_todos
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.journal_entries WHERE journal_entries.id = journal_todos.journal_entry_id AND journal_entries.user_id = auth.uid()
  ));

CREATE POLICY "Users can manage own journal todos" ON public.journal_todos
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.journal_entries WHERE journal_entries.id = journal_todos.journal_entry_id AND journal_entries.user_id = auth.uid()
  ));

CREATE POLICY "Users can view own routine todos" ON public.routine_todos
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.routine_entries WHERE routine_entries.id = routine_todos.routine_entry_id AND routine_entries.user_id = auth.uid()
  ));

CREATE POLICY "Users can manage own routine todos" ON public.routine_todos
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.routine_entries WHERE routine_entries.id = routine_todos.routine_entry_id AND routine_entries.user_id = auth.uid()
  ));

-- Update triggers for updated_at
CREATE TRIGGER update_todos_updated_at BEFORE UPDATE ON public.todos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_todo_recurrence_updated_at BEFORE UPDATE ON public.todo_recurrence
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Helper view for recurring todo instances
CREATE VIEW public.todo_instances AS
SELECT 
  t.*,
  tr.pattern_type,
  tr.pattern_config,
  tr.is_habit,
  tr.current_streak,
  tr.longest_streak,
  CASE 
    WHEN tr.next_occurrence_date IS NOT NULL AND tr.next_occurrence_date <= CURRENT_DATE 
    THEN true 
    ELSE false 
  END as is_due_today
FROM public.todos t
LEFT JOIN public.todo_recurrence tr ON t.id = tr.todo_id;

-- Grant permissions on the view
GRANT SELECT ON public.todo_instances TO authenticated;