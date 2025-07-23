-- Add depth limits for circular references in parent_id
-- This prevents infinite recursion and deep nesting issues

-- Add depth column to todos table
ALTER TABLE public.todos 
ADD COLUMN IF NOT EXISTS depth INTEGER DEFAULT 0 CHECK (depth >= 0 AND depth <= 5);

-- Function to calculate todo depth
CREATE OR REPLACE FUNCTION calculate_todo_depth(p_todo_id UUID, p_parent_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_depth INTEGER := 0;
  v_current_parent_id UUID := p_parent_id;
  v_max_depth INTEGER := 5; -- Maximum allowed depth
  v_iterations INTEGER := 0;
  v_visited_ids UUID[] := ARRAY[p_todo_id]; -- Track visited IDs to detect cycles
BEGIN
  -- If no parent, depth is 0
  IF p_parent_id IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Traverse up the hierarchy
  WHILE v_current_parent_id IS NOT NULL LOOP
    v_iterations := v_iterations + 1;
    
    -- Prevent infinite loops
    IF v_iterations > v_max_depth + 1 THEN
      RAISE EXCEPTION 'Maximum depth exceeded or circular reference detected';
    END IF;
    
    -- Check for circular reference
    IF v_current_parent_id = ANY(v_visited_ids) THEN
      RAISE EXCEPTION 'Circular reference detected: todo % would create a cycle', p_todo_id;
    END IF;
    
    -- Add to visited IDs
    v_visited_ids := array_append(v_visited_ids, v_current_parent_id);
    
    -- Increment depth
    v_depth := v_depth + 1;
    
    -- Check depth limit
    IF v_depth > v_max_depth THEN
      RAISE EXCEPTION 'Maximum depth of % exceeded', v_max_depth;
    END IF;
    
    -- Get parent of current parent
    SELECT parent_id INTO v_current_parent_id
    FROM public.todos
    WHERE id = v_current_parent_id;
  END LOOP;
  
  RETURN v_depth;
END;
$$ LANGUAGE plpgsql;

-- Function to check if setting a parent would create a cycle
CREATE OR REPLACE FUNCTION would_create_cycle(p_todo_id UUID, p_new_parent_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_current_id UUID := p_new_parent_id;
  v_iterations INTEGER := 0;
  v_max_iterations INTEGER := 10;
BEGIN
  -- Can't be your own parent
  IF p_todo_id = p_new_parent_id THEN
    RETURN TRUE;
  END IF;
  
  -- If no new parent, no cycle possible
  IF p_new_parent_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if new parent is a descendant of this todo
  WHILE v_current_id IS NOT NULL LOOP
    v_iterations := v_iterations + 1;
    
    -- Prevent infinite loops
    IF v_iterations > v_max_iterations THEN
      RETURN TRUE; -- Assume cycle if we can't determine
    END IF;
    
    -- If we reach ourselves, it would create a cycle
    IF v_current_id = p_todo_id THEN
      RETURN TRUE;
    END IF;
    
    -- Move up the tree
    SELECT parent_id INTO v_current_id
    FROM public.todos
    WHERE id = v_current_id;
  END LOOP;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Trigger to enforce depth limits and prevent cycles
CREATE OR REPLACE FUNCTION enforce_todo_hierarchy_limits()
RETURNS TRIGGER AS $$
DECLARE
  v_depth INTEGER;
BEGIN
  -- Skip if parent_id hasn't changed
  IF TG_OP = 'UPDATE' AND OLD.parent_id IS NOT DISTINCT FROM NEW.parent_id THEN
    RETURN NEW;
  END IF;
  
  -- Check for self-reference
  IF NEW.id = NEW.parent_id THEN
    RAISE EXCEPTION 'A todo cannot be its own parent';
  END IF;
  
  -- Check if this would create a cycle
  IF would_create_cycle(NEW.id, NEW.parent_id) THEN
    RAISE EXCEPTION 'This would create a circular reference';
  END IF;
  
  -- Calculate and set depth
  v_depth := calculate_todo_depth(NEW.id, NEW.parent_id);
  NEW.depth := v_depth;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Re-raise with more context
    RAISE EXCEPTION 'Hierarchy validation failed for todo %: %', NEW.id, SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS enforce_todo_hierarchy_before_insert ON public.todos;
CREATE TRIGGER enforce_todo_hierarchy_before_insert
  BEFORE INSERT ON public.todos
  FOR EACH ROW
  EXECUTE FUNCTION enforce_todo_hierarchy_limits();

DROP TRIGGER IF EXISTS enforce_todo_hierarchy_before_update ON public.todos;
CREATE TRIGGER enforce_todo_hierarchy_before_update
  BEFORE UPDATE OF parent_id ON public.todos
  FOR EACH ROW
  EXECUTE FUNCTION enforce_todo_hierarchy_limits();

-- Function to update depths for existing todos
CREATE OR REPLACE FUNCTION update_existing_todo_depths()
RETURNS void AS $$
DECLARE
  v_todo RECORD;
  v_depth INTEGER;
BEGIN
  -- Update todos starting from root level
  FOR v_todo IN 
    SELECT id, parent_id 
    FROM public.todos 
    WHERE parent_id IS NULL
    ORDER BY created_at
  LOOP
    UPDATE public.todos SET depth = 0 WHERE id = v_todo.id;
  END LOOP;
  
  -- Update each level
  FOR i IN 1..5 LOOP
    FOR v_todo IN 
      SELECT id 
      FROM public.todos 
      WHERE depth = i - 1
    LOOP
      UPDATE public.todos 
      SET depth = i 
      WHERE parent_id = v_todo.id;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Run depth update for existing todos
SELECT update_existing_todo_depths();

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_todos_parent_id_depth ON public.todos(parent_id, depth);

-- Add helpful view for hierarchy
CREATE OR REPLACE VIEW todo_hierarchy AS
WITH RECURSIVE todo_tree AS (
  -- Base case: root todos
  SELECT 
    id,
    title,
    parent_id,
    depth,
    ARRAY[id] as path,
    title as full_path
  FROM public.todos
  WHERE parent_id IS NULL
  
  UNION ALL
  
  -- Recursive case
  SELECT 
    t.id,
    t.title,
    t.parent_id,
    t.depth,
    tt.path || t.id,
    tt.full_path || ' > ' || t.title
  FROM public.todos t
  JOIN todo_tree tt ON t.parent_id = tt.id
  WHERE t.depth <= 5 -- Safety limit
)
SELECT * FROM todo_tree;

-- Grant access to view
GRANT SELECT ON todo_hierarchy TO authenticated;

-- Add comment
COMMENT ON COLUMN public.todos.depth IS 
'Hierarchy depth of the todo. 0 for root todos, max 5 levels deep.';

COMMENT ON FUNCTION calculate_todo_depth IS 
'Calculates the depth of a todo in the hierarchy. Prevents circular references and enforces max depth of 5.';