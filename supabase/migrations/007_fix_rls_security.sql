-- Fix overly permissive RLS policies for better security
-- This addresses the security concern about FOR ALL policies allowing DELETE without checks

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Users can manage own todo recurrence" ON public.todo_recurrence;
DROP POLICY IF EXISTS "Users can manage own todo completions" ON public.todo_completions;
DROP POLICY IF EXISTS "Users can manage own todo attempts" ON public.todo_attempts;
DROP POLICY IF EXISTS "Users can manage own todo relationships" ON public.todo_relationships;
DROP POLICY IF EXISTS "Users can manage own todo tags" ON public.todo_tags;
DROP POLICY IF EXISTS "Users can manage own braindump todos" ON public.braindump_todos;
DROP POLICY IF EXISTS "Users can manage own journal todos" ON public.journal_todos;
DROP POLICY IF EXISTS "Users can manage own routine todos" ON public.routine_todos;

-- Create more specific policies for todo_recurrence
CREATE POLICY "Users can create own todo recurrence" ON public.todo_recurrence
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.todos WHERE todos.id = todo_recurrence.todo_id AND todos.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own todo recurrence" ON public.todo_recurrence
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.todos WHERE todos.id = todo_recurrence.todo_id AND todos.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own todo recurrence" ON public.todo_recurrence
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM public.todos WHERE todos.id = todo_recurrence.todo_id AND todos.user_id = auth.uid()
  ));

-- Create more specific policies for todo_completions
CREATE POLICY "Users can create own todo completions" ON public.todo_completions
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.todos WHERE todos.id = todo_completions.todo_id AND todos.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own todo completions" ON public.todo_completions
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.todos WHERE todos.id = todo_completions.todo_id AND todos.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own todo completions" ON public.todo_completions
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM public.todos WHERE todos.id = todo_completions.todo_id AND todos.user_id = auth.uid()
  ));

-- Create more specific policies for todo_attempts
CREATE POLICY "Users can create own todo attempts" ON public.todo_attempts
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.todos WHERE todos.id = todo_attempts.todo_id AND todos.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own todo attempts" ON public.todo_attempts
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.todos WHERE todos.id = todo_attempts.todo_id AND todos.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own todo attempts" ON public.todo_attempts
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM public.todos WHERE todos.id = todo_attempts.todo_id AND todos.user_id = auth.uid()
  ));

-- Create more specific policies for todo_relationships
CREATE POLICY "Users can create own todo relationships" ON public.todo_relationships
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.todos WHERE todos.id = todo_relationships.parent_todo_id AND todos.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own todo relationships" ON public.todo_relationships
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.todos WHERE todos.id = todo_relationships.parent_todo_id AND todos.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own todo relationships" ON public.todo_relationships
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM public.todos WHERE todos.id = todo_relationships.parent_todo_id AND todos.user_id = auth.uid()
  ));

-- Create more specific policies for todo_tags
CREATE POLICY "Users can create own todo tags" ON public.todo_tags
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.todos WHERE todos.id = todo_tags.todo_id AND todos.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own todo tags" ON public.todo_tags
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.todos WHERE todos.id = todo_tags.todo_id AND todos.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own todo tags" ON public.todo_tags
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM public.todos WHERE todos.id = todo_tags.todo_id AND todos.user_id = auth.uid()
  ));

-- Create more specific policies for braindump_todos
CREATE POLICY "Users can create own braindump todos" ON public.braindump_todos
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.brain_dumps WHERE brain_dumps.id = braindump_todos.braindump_id AND brain_dumps.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own braindump todos" ON public.braindump_todos
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.brain_dumps WHERE brain_dumps.id = braindump_todos.braindump_id AND brain_dumps.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own braindump todos" ON public.braindump_todos
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM public.brain_dumps WHERE brain_dumps.id = braindump_todos.braindump_id AND brain_dumps.user_id = auth.uid()
  ));

-- Create more specific policies for journal_todos
CREATE POLICY "Users can create own journal todos" ON public.journal_todos
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.journal_entries WHERE journal_entries.id = journal_todos.journal_entry_id AND journal_entries.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own journal todos" ON public.journal_todos
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.journal_entries WHERE journal_entries.id = journal_todos.journal_entry_id AND journal_entries.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own journal todos" ON public.journal_todos
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM public.journal_entries WHERE journal_entries.id = journal_todos.journal_entry_id AND journal_entries.user_id = auth.uid()
  ));

-- Create more specific policies for routine_todos
CREATE POLICY "Users can create own routine todos" ON public.routine_todos
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.routine_entries WHERE routine_entries.id = routine_todos.routine_entry_id AND routine_entries.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own routine todos" ON public.routine_todos
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.routine_entries WHERE routine_entries.id = routine_todos.routine_entry_id AND routine_entries.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own routine todos" ON public.routine_todos
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM public.routine_entries WHERE routine_entries.id = routine_todos.routine_entry_id AND routine_entries.user_id = auth.uid()
  ));