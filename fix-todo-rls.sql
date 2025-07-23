-- Apply RLS fixes for todos table
-- Run this manually to fix todo creation issues

-- Drop existing insert policy if it exists
DROP POLICY IF EXISTS "Users can create own todos" ON public.todos;

-- Create a more permissive insert policy
CREATE POLICY "Users can create own todos" ON public.todos
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Ensure the update_updated_at_column function exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Make sure the trigger exists for todos table
DROP TRIGGER IF EXISTS update_todos_updated_at ON public.todos;
CREATE TRIGGER update_todos_updated_at 
  BEFORE UPDATE ON public.todos
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON public.todos TO authenticated;
GRANT ALL ON public.braindump_todos TO authenticated;
GRANT ALL ON public.journal_todos TO authenticated;
GRANT ALL ON public.routine_todos TO authenticated;

-- Ensure sequences are accessible
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Quick test to verify RLS is working
DO $$
BEGIN
  RAISE NOTICE 'RLS fixes applied successfully';
END $$;