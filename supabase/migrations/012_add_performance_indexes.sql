-- Add indexes on frequently queried columns for better performance
-- This improves query performance for common operations

-- Indexes for todos table
-- user_id + status for filtering user's todos by status
CREATE INDEX IF NOT EXISTS idx_todos_user_status ON public.todos(user_id, status)
WHERE status != 'completed'; -- Partial index for active todos

-- user_id + type for filtering by todo type
CREATE INDEX IF NOT EXISTS idx_todos_user_type ON public.todos(user_id, type);

-- scheduled_date for date-based queries
CREATE INDEX IF NOT EXISTS idx_todos_scheduled_date ON public.todos(scheduled_date)
WHERE scheduled_date IS NOT NULL;

-- due_date for deadline queries
CREATE INDEX IF NOT EXISTS idx_todos_due_date ON public.todos(due_date)
WHERE due_date IS NOT NULL;

-- source_type + source_id for reverse lookups
CREATE INDEX IF NOT EXISTS idx_todos_source ON public.todos(source_type, source_id)
WHERE source_type != 'manual';

-- completed_at for recent completions
CREATE INDEX IF NOT EXISTS idx_todos_completed_at ON public.todos(completed_at DESC)
WHERE completed_at IS NOT NULL;

-- Composite index for quadrant queries (importance + urgency)
CREATE INDEX IF NOT EXISTS idx_todos_priority_quadrant ON public.todos(priority_importance, priority_urgency, user_id)
WHERE status != 'completed';

-- Indexes for todo_recurrence table
-- todo_id for joins
CREATE INDEX IF NOT EXISTS idx_todo_recurrence_todo_id ON public.todo_recurrence(todo_id);

-- next_due_date for finding upcoming recurrences
CREATE INDEX IF NOT EXISTS idx_todo_recurrence_next_due ON public.todo_recurrence(next_due_date)
WHERE is_active = true;

-- Indexes for todo_completions table
-- todo_id + completion_date for history queries
CREATE INDEX IF NOT EXISTS idx_todo_completions_todo_date ON public.todo_completions(todo_id, completion_date DESC);

-- completion_date for daily/weekly/monthly aggregations
CREATE INDEX IF NOT EXISTS idx_todo_completions_date ON public.todo_completions(completion_date);

-- Indexes for todo_attempts table
-- todo_id + attempt_date for attempt history
CREATE INDEX IF NOT EXISTS idx_todo_attempts_todo_date ON public.todo_attempts(todo_id, attempt_date DESC);

-- Indexes for todo_relationships table
-- parent_todo_id for finding children
CREATE INDEX IF NOT EXISTS idx_todo_relationships_parent ON public.todo_relationships(parent_todo_id);

-- child_todo_id for finding parents
CREATE INDEX IF NOT EXISTS idx_todo_relationships_child ON public.todo_relationships(child_todo_id);

-- Indexes for todo_tags table
-- todo_id for finding tags of a todo
CREATE INDEX IF NOT EXISTS idx_todo_tags_todo ON public.todo_tags(todo_id);

-- tag_name for finding todos by tag
CREATE INDEX IF NOT EXISTS idx_todo_tags_name ON public.todo_tags(tag_name);

-- Indexes for braindump_todos table
-- braindump_id for finding todos from a braindump
CREATE INDEX IF NOT EXISTS idx_braindump_todos_braindump ON public.braindump_todos(braindump_id);

-- todo_id for reverse lookup
CREATE INDEX IF NOT EXISTS idx_braindump_todos_todo ON public.braindump_todos(todo_id);

-- Indexes for journal_todos table
-- journal_entry_id for finding todos from a journal entry
CREATE INDEX IF NOT EXISTS idx_journal_todos_journal ON public.journal_todos(journal_entry_id);

-- todo_id for reverse lookup
CREATE INDEX IF NOT EXISTS idx_journal_todos_todo ON public.journal_todos(todo_id);

-- Indexes for routine_todos table
-- routine_entry_id for finding todos from a routine entry
CREATE INDEX IF NOT EXISTS idx_routine_todos_routine ON public.routine_todos(routine_entry_id);

-- todo_id for reverse lookup
CREATE INDEX IF NOT EXISTS idx_routine_todos_todo ON public.routine_todos(todo_id);

-- Text search index for todo title and description
CREATE INDEX IF NOT EXISTS idx_todos_search ON public.todos 
USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- Create function for text search
CREATE OR REPLACE FUNCTION search_todos(
  p_user_id UUID,
  p_search_query TEXT,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  type todo_type,
  status todo_status,
  priority_importance DECIMAL,
  priority_urgency DECIMAL,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.title,
    t.description,
    t.type,
    t.status,
    t.priority_importance,
    t.priority_urgency,
    ts_rank(to_tsvector('english', t.title || ' ' || COALESCE(t.description, '')), 
            plainto_tsquery('english', p_search_query)) as rank
  FROM public.todos t
  WHERE t.user_id = p_user_id
    AND to_tsvector('english', t.title || ' ' || COALESCE(t.description, '')) 
        @@ plainto_tsquery('english', p_search_query)
  ORDER BY rank DESC, t.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Grant execute permission on search function
GRANT EXECUTE ON FUNCTION search_todos TO authenticated;

-- Analyze tables to update statistics for query planner
ANALYZE public.todos;
ANALYZE public.todo_recurrence;
ANALYZE public.todo_completions;
ANALYZE public.todo_attempts;
ANALYZE public.todo_relationships;
ANALYZE public.todo_tags;
ANALYZE public.braindump_todos;
ANALYZE public.journal_todos;
ANALYZE public.routine_todos;

-- Add comments
COMMENT ON INDEX idx_todos_user_status IS 
'Partial index for quickly finding active (non-completed) todos for a user';

COMMENT ON INDEX idx_todos_priority_quadrant IS 
'Composite index for Eisenhower matrix queries based on importance and urgency';

COMMENT ON INDEX idx_todos_search IS 
'Full text search index for finding todos by title or description content';

COMMENT ON FUNCTION search_todos IS 
'Full text search function for todos. Returns results ranked by relevance.';