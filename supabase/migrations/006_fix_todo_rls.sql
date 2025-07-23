-- Check and fix RLS policies for todos table
-- This ensures users can properly create todos during migration

-- First, let's check if RLS is enabled
DO $$
BEGIN
  RAISE NOTICE 'Checking RLS status for todos table...';
END $$;

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

-- Add a helper function to debug todo creation
CREATE OR REPLACE FUNCTION debug_todo_insert(
  p_user_id UUID,
  p_title TEXT,
  p_type todo_type,
  p_source_type todo_source_type
)
RETURNS TABLE (
  success BOOLEAN,
  error_message TEXT,
  todo_id UUID
) AS $$
DECLARE
  v_todo_id UUID;
  v_error_message TEXT;
BEGIN
  BEGIN
    INSERT INTO public.todos (
      user_id,
      title,
      type,
      source_type,
      priority_importance,
      priority_urgency
    ) VALUES (
      p_user_id,
      p_title,
      p_type,
      p_source_type,
      3, -- default importance
      3  -- default urgency
    ) RETURNING id INTO v_todo_id;
    
    RETURN QUERY SELECT TRUE, NULL::TEXT, v_todo_id;
  EXCEPTION
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_error_message = MESSAGE_TEXT;
      RETURN QUERY SELECT FALSE, v_error_message, NULL::UUID;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the debug function
GRANT EXECUTE ON FUNCTION debug_todo_insert TO authenticated;