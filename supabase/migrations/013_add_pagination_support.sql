-- Add pagination support for todo lists
-- This enables efficient loading of large todo lists

-- Function to get paginated todos with cursor-based pagination
CREATE OR REPLACE FUNCTION get_todos_paginated(
  p_user_id UUID,
  p_cursor UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 20,
  p_status todo_status DEFAULT NULL,
  p_type todo_type DEFAULT NULL,
  p_sort_by TEXT DEFAULT 'created_at',
  p_sort_order TEXT DEFAULT 'DESC'
)
RETURNS TABLE (
  todos JSONB,
  has_more BOOLEAN,
  next_cursor UUID
) AS $$
DECLARE
  v_todos JSONB;
  v_has_more BOOLEAN;
  v_next_cursor UUID;
  v_query TEXT;
BEGIN
  -- Validate sort parameters
  IF p_sort_by NOT IN ('created_at', 'updated_at', 'due_date', 'scheduled_date', 'priority_importance', 'priority_urgency') THEN
    p_sort_by := 'created_at';
  END IF;
  
  IF p_sort_order NOT IN ('ASC', 'DESC') THEN
    p_sort_order := 'DESC';
  END IF;
  
  -- Build dynamic query
  v_query := 'SELECT json_agg(t.* ORDER BY t.' || p_sort_by || ' ' || p_sort_order || ', t.id) 
              FROM (
                SELECT * FROM public.todos
                WHERE user_id = $1';
  
  -- Add cursor condition if provided
  IF p_cursor IS NOT NULL THEN
    IF p_sort_order = 'DESC' THEN
      v_query := v_query || ' AND ((' || p_sort_by || ', id) < (
        SELECT ' || p_sort_by || ', id FROM public.todos WHERE id = $2
      ))';
    ELSE
      v_query := v_query || ' AND ((' || p_sort_by || ', id) > (
        SELECT ' || p_sort_by || ', id FROM public.todos WHERE id = $2
      ))';
    END IF;
  END IF;
  
  -- Add status filter
  IF p_status IS NOT NULL THEN
    v_query := v_query || ' AND status = $3';
  END IF;
  
  -- Add type filter
  IF p_type IS NOT NULL THEN
    v_query := v_query || ' AND type = $4';
  END IF;
  
  -- Order and limit
  v_query := v_query || ' ORDER BY ' || p_sort_by || ' ' || p_sort_order || ', id
                          LIMIT $5
                        ) t';
  
  -- Execute query with appropriate parameters
  IF p_cursor IS NOT NULL AND p_status IS NOT NULL AND p_type IS NOT NULL THEN
    EXECUTE v_query INTO v_todos USING p_user_id, p_cursor, p_status, p_type, p_limit + 1;
  ELSIF p_cursor IS NOT NULL AND p_status IS NOT NULL THEN
    EXECUTE v_query INTO v_todos USING p_user_id, p_cursor, p_status, p_limit + 1;
  ELSIF p_cursor IS NOT NULL AND p_type IS NOT NULL THEN
    EXECUTE v_query INTO v_todos USING p_user_id, p_cursor, p_type, p_limit + 1;
  ELSIF p_cursor IS NOT NULL THEN
    EXECUTE v_query INTO v_todos USING p_user_id, p_cursor, p_limit + 1;
  ELSIF p_status IS NOT NULL AND p_type IS NOT NULL THEN
    EXECUTE v_query INTO v_todos USING p_user_id, p_status, p_type, p_limit + 1;
  ELSIF p_status IS NOT NULL THEN
    EXECUTE v_query INTO v_todos USING p_user_id, p_status, p_limit + 1;
  ELSIF p_type IS NOT NULL THEN
    EXECUTE v_query INTO v_todos USING p_user_id, p_type, p_limit + 1;
  ELSE
    EXECUTE v_query INTO v_todos USING p_user_id, p_limit + 1;
  END IF;
  
  -- Process results
  IF v_todos IS NULL THEN
    v_todos := '[]'::JSONB;
    v_has_more := FALSE;
    v_next_cursor := NULL;
  ELSE
    -- Check if we have more results
    IF jsonb_array_length(v_todos) > p_limit THEN
      v_has_more := TRUE;
      -- Remove the extra item
      v_todos := (SELECT jsonb_agg(value) FROM (
        SELECT value FROM jsonb_array_elements(v_todos) WITH ORDINALITY AS t(value, ord)
        WHERE ord <= p_limit
      ) sub);
      -- Get the cursor from the last item
      v_next_cursor := (v_todos->-1->>'id')::UUID;
    ELSE
      v_has_more := FALSE;
      v_next_cursor := NULL;
    END IF;
  END IF;
  
  RETURN QUERY SELECT v_todos, v_has_more, v_next_cursor;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function to get todo count for pagination info
CREATE OR REPLACE FUNCTION get_todo_count(
  p_user_id UUID,
  p_status todo_status DEFAULT NULL,
  p_type todo_type DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO v_count
  FROM public.todos
  WHERE user_id = p_user_id
    AND (p_status IS NULL OR status = p_status)
    AND (p_type IS NULL OR type = p_type);
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function for offset-based pagination (simpler but less efficient for large datasets)
CREATE OR REPLACE FUNCTION get_todos_offset_paginated(
  p_user_id UUID,
  p_page INTEGER DEFAULT 1,
  p_page_size INTEGER DEFAULT 20,
  p_status todo_status DEFAULT NULL,
  p_type todo_type DEFAULT NULL,
  p_sort_by TEXT DEFAULT 'created_at',
  p_sort_order TEXT DEFAULT 'DESC'
)
RETURNS TABLE (
  todos JSONB,
  total_count INTEGER,
  page INTEGER,
  page_size INTEGER,
  total_pages INTEGER
) AS $$
DECLARE
  v_offset INTEGER;
  v_todos JSONB;
  v_total_count INTEGER;
  v_total_pages INTEGER;
BEGIN
  -- Validate inputs
  p_page := GREATEST(1, p_page);
  p_page_size := LEAST(GREATEST(1, p_page_size), 100); -- Max 100 items per page
  
  -- Calculate offset
  v_offset := (p_page - 1) * p_page_size;
  
  -- Get total count
  v_total_count := get_todo_count(p_user_id, p_status, p_type);
  
  -- Calculate total pages
  v_total_pages := CEIL(v_total_count::DECIMAL / p_page_size);
  
  -- Get paginated todos
  SELECT json_agg(t.* ORDER BY 
    CASE WHEN p_sort_order = 'ASC' THEN
      CASE p_sort_by
        WHEN 'created_at' THEN t.created_at
        WHEN 'updated_at' THEN t.updated_at
        WHEN 'due_date' THEN t.due_date
        WHEN 'scheduled_date' THEN t.scheduled_date
      END
    END ASC,
    CASE WHEN p_sort_order = 'DESC' THEN
      CASE p_sort_by
        WHEN 'created_at' THEN t.created_at
        WHEN 'updated_at' THEN t.updated_at
        WHEN 'due_date' THEN t.due_date
        WHEN 'scheduled_date' THEN t.scheduled_date
      END
    END DESC,
    CASE WHEN p_sort_order = 'ASC' THEN
      CASE p_sort_by
        WHEN 'priority_importance' THEN t.priority_importance
        WHEN 'priority_urgency' THEN t.priority_urgency
      END
    END ASC,
    CASE WHEN p_sort_order = 'DESC' THEN
      CASE p_sort_by
        WHEN 'priority_importance' THEN t.priority_importance
        WHEN 'priority_urgency' THEN t.priority_urgency
      END
    END DESC,
    t.id
  ) INTO v_todos
  FROM (
    SELECT * FROM public.todos
    WHERE user_id = p_user_id
      AND (p_status IS NULL OR status = p_status)
      AND (p_type IS NULL OR type = p_type)
    ORDER BY 
      CASE WHEN p_sort_order = 'ASC' THEN
        CASE p_sort_by
          WHEN 'created_at' THEN created_at
          WHEN 'updated_at' THEN updated_at
          WHEN 'due_date' THEN due_date
          WHEN 'scheduled_date' THEN scheduled_date
        END
      END ASC,
      CASE WHEN p_sort_order = 'DESC' THEN
        CASE p_sort_by
          WHEN 'created_at' THEN created_at
          WHEN 'updated_at' THEN updated_at
          WHEN 'due_date' THEN due_date
          WHEN 'scheduled_date' THEN scheduled_date
        END
      END DESC,
      CASE WHEN p_sort_order = 'ASC' THEN
        CASE p_sort_by
          WHEN 'priority_importance' THEN priority_importance
          WHEN 'priority_urgency' THEN priority_urgency
        END
      END ASC,
      CASE WHEN p_sort_order = 'DESC' THEN
        CASE p_sort_by
          WHEN 'priority_importance' THEN priority_importance
          WHEN 'priority_urgency' THEN priority_urgency
        END
      END DESC,
      id
    LIMIT p_page_size
    OFFSET v_offset
  ) t;
  
  -- Return empty array if no results
  IF v_todos IS NULL THEN
    v_todos := '[]'::JSONB;
  END IF;
  
  RETURN QUERY SELECT v_todos, v_total_count, p_page, p_page_size, v_total_pages;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_todos_paginated TO authenticated;
GRANT EXECUTE ON FUNCTION get_todo_count TO authenticated;
GRANT EXECUTE ON FUNCTION get_todos_offset_paginated TO authenticated;

-- Add comments
COMMENT ON FUNCTION get_todos_paginated IS 
'Cursor-based pagination for todos. More efficient for large datasets.
Returns todos, has_more flag, and next_cursor for subsequent requests.';

COMMENT ON FUNCTION get_todos_offset_paginated IS 
'Offset-based pagination for todos. Simpler but less efficient for large datasets.
Returns todos, total count, and pagination metadata.';

COMMENT ON FUNCTION get_todo_count IS 
'Get total count of todos for a user with optional status and type filters.';