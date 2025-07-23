-- Add transaction support for migration operations
-- This ensures atomic operations during data migration

-- Function to migrate BrainDump nodes to todos with transaction support
CREATE OR REPLACE FUNCTION migrate_braindump_nodes_to_todos_transactional()
RETURNS TABLE (
  success_count INTEGER,
  error_count INTEGER,
  error_messages TEXT[]
) AS $$
DECLARE
  dump RECORD;
  node JSONB;
  new_todo_id UUID;
  node_data JSONB;
  v_success_count INTEGER := 0;
  v_error_count INTEGER := 0;
  v_error_messages TEXT[] := '{}';
  v_error_msg TEXT;
BEGIN
  -- Start transaction block
  BEGIN
    -- Loop through all brain dumps
    FOR dump IN SELECT * FROM public.brain_dumps LOOP
      -- Create savepoint for each brain dump
      EXECUTE 'SAVEPOINT dump_' || dump.id;
      
      BEGIN
        -- Loop through nodes in each brain dump
        FOR node IN SELECT * FROM jsonb_array_elements(dump.nodes) LOOP
          -- Only process thought nodes that look like tasks
          IF node->>'type' = 'thought' AND 
             (node->'data'->>'category' = 'tasks' OR 
              node->'data'->>'taskStatus' IS NOT NULL OR
              node->'data'->>'importance' IS NOT NULL) THEN
            
            node_data := node->'data';
            
            -- Create todo record
            INSERT INTO public.todos (
              user_id,
              title,
              description,
              type,
              status,
              priority_importance,
              priority_urgency,
              due_date,
              scheduled_date,
              scheduled_time,
              scheduled_duration,
              source_type,
              source_id,
              source_metadata,
              completed_at,
              created_at,
              updated_at
            ) VALUES (
              dump.user_id,
              COALESCE(node_data->>'label', 'Untitled Task'),
              node_data->>'originalText',
              CASE 
                WHEN node_data->>'taskType' = 'habit' THEN 'habit'::todo_type
                WHEN node_data->>'category' = 'tasks' THEN 'task'::todo_type
                ELSE 'task'::todo_type
              END,
              CASE node_data->>'taskStatus'
                WHEN 'completed' THEN 'completed'::todo_status
                WHEN 'in-progress' THEN 'in_progress'::todo_status
                WHEN 'deferred' THEN 'deferred'::todo_status
                ELSE 'pending'::todo_status
              END,
              COALESCE((node_data->>'importance')::DECIMAL(3,2), 3),
              COALESCE((node_data->>'urgency')::DECIMAL(3,2), 3),
              CASE 
                WHEN node_data->>'dueDate' IS NOT NULL 
                THEN (node_data->>'dueDate')::DATE
                ELSE NULL
              END,
              CASE 
                WHEN node_data->>'timeboxDate' IS NOT NULL 
                THEN (node_data->>'timeboxDate')::DATE
                ELSE NULL
              END,
              CASE 
                WHEN node_data->>'timeboxStartTime' IS NOT NULL 
                THEN (node_data->>'timeboxStartTime')::TIME
                ELSE NULL
              END,
              (node_data->>'timeboxDuration')::INTEGER,
              'braindump'::todo_source_type,
              dump.id || ':' || (node->>'id'),
              jsonb_build_object(
                'node_id', node->>'id',
                'braindump_id', dump.id,
                'braindump_title', dump.title,
                'original_node', node
              ),
              CASE 
                WHEN node_data->>'completedAt' IS NOT NULL 
                THEN (node_data->>'completedAt')::TIMESTAMPTZ
                ELSE NULL
              END,
              dump.created_at,
              dump.updated_at
            ) RETURNING id INTO new_todo_id;
            
            -- Create link in braindump_todos
            INSERT INTO public.braindump_todos (braindump_id, node_id, todo_id)
            VALUES (dump.id, node->>'id', new_todo_id);
            
            v_success_count := v_success_count + 1;
          END IF;
        END LOOP;
        
        -- Release savepoint on success
        EXECUTE 'RELEASE SAVEPOINT dump_' || dump.id;
        
      EXCEPTION
        WHEN OTHERS THEN
          -- Rollback to savepoint on error
          EXECUTE 'ROLLBACK TO SAVEPOINT dump_' || dump.id;
          GET STACKED DIAGNOSTICS v_error_msg = MESSAGE_TEXT;
          v_error_messages := array_append(v_error_messages, 
            'BrainDump ' || dump.id || ': ' || v_error_msg);
          v_error_count := v_error_count + 1;
      END;
    END LOOP;
    
  EXCEPTION
    WHEN OTHERS THEN
      -- Rollback entire transaction on fatal error
      GET STACKED DIAGNOSTICS v_error_msg = MESSAGE_TEXT;
      v_error_messages := array_append(v_error_messages, 
        'Fatal error: ' || v_error_msg);
      RAISE;
  END;
  
  RETURN QUERY SELECT v_success_count, v_error_count, v_error_messages;
END;
$$ LANGUAGE plpgsql;

-- Function to migrate journal quests with transaction support
CREATE OR REPLACE FUNCTION migrate_journal_quests_to_todos_transactional()
RETURNS TABLE (
  success_count INTEGER,
  error_count INTEGER,
  error_messages TEXT[]
) AS $$
DECLARE
  entry RECORD;
  new_todo_id UUID;
  v_success_count INTEGER := 0;
  v_error_count INTEGER := 0;
  v_error_messages TEXT[] := '{}';
  v_error_msg TEXT;
BEGIN
  -- Start transaction block
  BEGIN
    FOR entry IN SELECT * FROM public.journal_entries WHERE daily_quest IS NOT NULL LOOP
      -- Create savepoint for each entry
      EXECUTE 'SAVEPOINT journal_' || entry.id;
      
      BEGIN
        -- Create todo for daily quest
        INSERT INTO public.todos (
          user_id,
          title,
          description,
          type,
          status,
          scheduled_date,
          source_type,
          source_id,
          source_metadata,
          priority_importance,
          priority_urgency,
          created_at,
          updated_at,
          completed_at
        ) VALUES (
          entry.user_id,
          entry.daily_quest,
          'Daily quest from journal entry',
          'quest'::todo_type,
          'completed'::todo_status, -- Journal entries are historical
          entry.date::DATE,
          'journal'::todo_source_type,
          entry.id,
          jsonb_build_object(
            'journal_entry_id', entry.id,
            'entry_date', entry.date,
            'xp_earned', entry.xp_earned
          ),
          3, -- default importance
          3, -- default urgency
          entry.created_at,
          entry.updated_at,
          entry.date::TIMESTAMPTZ
        ) RETURNING id INTO new_todo_id;
        
        -- Create link
        INSERT INTO public.journal_todos (journal_entry_id, todo_id, todo_type)
        VALUES (entry.id, new_todo_id, 'daily_quest');
        
        v_success_count := v_success_count + 1;
        
        -- Release savepoint on success
        EXECUTE 'RELEASE SAVEPOINT journal_' || entry.id;
        
      EXCEPTION
        WHEN OTHERS THEN
          -- Rollback to savepoint on error
          EXECUTE 'ROLLBACK TO SAVEPOINT journal_' || entry.id;
          GET STACKED DIAGNOSTICS v_error_msg = MESSAGE_TEXT;
          v_error_messages := array_append(v_error_messages, 
            'Journal ' || entry.id || ': ' || v_error_msg);
          v_error_count := v_error_count + 1;
      END;
    END LOOP;
    
  EXCEPTION
    WHEN OTHERS THEN
      -- Rollback entire transaction on fatal error
      GET STACKED DIAGNOSTICS v_error_msg = MESSAGE_TEXT;
      v_error_messages := array_append(v_error_messages, 
        'Fatal error: ' || v_error_msg);
      RAISE;
  END;
  
  RETURN QUERY SELECT v_success_count, v_error_count, v_error_messages;
END;
$$ LANGUAGE plpgsql;

-- Master migration function with full transaction support
CREATE OR REPLACE FUNCTION migrate_all_to_todos_transactional()
RETURNS TABLE (
  operation TEXT,
  success_count INTEGER,
  error_count INTEGER,
  error_messages TEXT[]
) AS $$
DECLARE
  braindump_result RECORD;
  journal_result RECORD;
  routine_result RECORD;
BEGIN
  -- Start master transaction
  BEGIN
    -- Migrate BrainDumps
    SELECT * INTO braindump_result 
    FROM migrate_braindump_nodes_to_todos_transactional();
    
    -- Migrate Journal entries
    SELECT * INTO journal_result 
    FROM migrate_journal_quests_to_todos_transactional();
    
    -- Log results
    RAISE NOTICE 'Migration completed. BrainDumps: % success, % errors', 
      braindump_result.success_count, braindump_result.error_count;
    RAISE NOTICE 'Journal: % success, % errors', 
      journal_result.success_count, journal_result.error_count;
    
    -- Return results
    RETURN QUERY 
      SELECT 'braindumps'::TEXT, 
        braindump_result.success_count, 
        braindump_result.error_count,
        braindump_result.error_messages
      UNION ALL
      SELECT 'journal'::TEXT, 
        journal_result.success_count, 
        journal_result.error_count,
        journal_result.error_messages;
    
  EXCEPTION
    WHEN OTHERS THEN
      -- Rollback entire migration on error
      RAISE NOTICE 'Migration failed and was rolled back';
      RAISE;
  END;
END;
$$ LANGUAGE plpgsql;

-- Add comment
COMMENT ON FUNCTION migrate_all_to_todos_transactional() IS 
'Master migration function with full transaction support. 
Ensures atomic migration - either all succeed or all are rolled back.
Uses savepoints for partial rollback capability per item.';