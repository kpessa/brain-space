-- Migration functions to convert existing data to unified todo system

-- Function to migrate BrainDump thought nodes to todos
CREATE OR REPLACE FUNCTION migrate_braindump_nodes_to_todos()
RETURNS void AS $$
DECLARE
  dump RECORD;
  node JSONB;
  new_todo_id UUID;
  node_data JSONB;
BEGIN
  -- Loop through all brain dumps
  FOR dump IN SELECT * FROM public.brain_dumps LOOP
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
          node_data->>'label',
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
          CASE 
            WHEN node_data->>'importance' IS NOT NULL 
            THEN (node_data->>'importance')::DECIMAL(3,2)
            ELSE NULL
          END,
          CASE 
            WHEN node_data->>'urgency' IS NOT NULL 
            THEN (node_data->>'urgency')::DECIMAL(3,2)
            ELSE NULL
          END,
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
        
        -- Handle recurrence if present
        IF node_data->>'recurrencePattern' IS NOT NULL AND 
           node_data->'recurrencePattern' != 'null'::jsonb THEN
          
          INSERT INTO public.todo_recurrence (
            todo_id,
            pattern_type,
            pattern_config,
            start_date,
            end_date,
            is_habit,
            current_streak,
            longest_streak
          ) VALUES (
            new_todo_id,
            CASE (node_data->'recurrencePattern'->>'type')
              WHEN 'daily' THEN 'daily'::recurrence_pattern_type
              WHEN 'weekly' THEN 'weekly'::recurrence_pattern_type
              WHEN 'monthly' THEN 'monthly'::recurrence_pattern_type
              ELSE 'custom'::recurrence_pattern_type
            END,
            node_data->'recurrencePattern',
            COALESCE(
              (node_data->'recurrencePattern'->>'startDate')::DATE,
              CURRENT_DATE
            ),
            (node_data->'recurrencePattern'->>'endDate')::DATE,
            node_data->>'taskType' = 'habit',
            COALESCE((node_data->>'currentStreak')::INTEGER, 0),
            COALESCE((node_data->>'longestStreak')::INTEGER, 0)
          );
        END IF;
        
        -- Migrate attempts if present
        IF node_data->>'attempts' IS NOT NULL AND 
           jsonb_array_length(node_data->'attempts') > 0 THEN
          
          INSERT INTO public.todo_attempts (
            todo_id,
            attempt_date,
            started_at,
            outcome,
            duration_minutes,
            notes,
            next_action
          )
          SELECT 
            new_todo_id,
            COALESCE((attempt->>'timestamp')::DATE, CURRENT_DATE),
            (attempt->>'timestamp')::TIMESTAMPTZ,
            (attempt->>'outcome')::attempt_outcome,
            (attempt->>'duration')::INTEGER,
            attempt->>'notes',
            attempt->>'nextAction'
          FROM jsonb_array_elements(node_data->'attempts') AS attempt;
        END IF;
        
        -- Migrate recurring completions if present
        IF node_data->>'recurringCompletions' IS NOT NULL AND 
           jsonb_array_length(node_data->'recurringCompletions') > 0 THEN
          
          INSERT INTO public.todo_completions (
            todo_id,
            completion_date,
            completed_at,
            quality,
            duration_minutes,
            notes
          )
          SELECT 
            new_todo_id,
            (completion->>'date')::DATE,
            (completion->>'completedAt')::TIMESTAMPTZ,
            CASE completion->>'quality'
              WHEN 'great' THEN 'great'::completion_quality
              WHEN 'good' THEN 'good'::completion_quality
              WHEN 'okay' THEN 'okay'::completion_quality
              WHEN 'poor' THEN 'poor'::completion_quality
              ELSE NULL
            END,
            (completion->>'duration')::INTEGER,
            completion->>'notes'
          FROM jsonb_array_elements(node_data->'recurringCompletions') AS completion;
        END IF;
        
      END IF;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to migrate journal daily quests to todos
CREATE OR REPLACE FUNCTION migrate_journal_quests_to_todos()
RETURNS void AS $$
DECLARE
  entry RECORD;
  new_todo_id UUID;
BEGIN
  FOR entry IN SELECT * FROM public.journal_entries WHERE daily_quest IS NOT NULL LOOP
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
      created_at,
      updated_at
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
      entry.created_at,
      entry.updated_at
    ) RETURNING id INTO new_todo_id;
    
    -- Create link
    INSERT INTO public.journal_todos (journal_entry_id, todo_id, todo_type)
    VALUES (entry.id, new_todo_id, 'daily_quest');
    
    -- Mark as completed since journal entries are historical
    UPDATE public.todos 
    SET completed_at = entry.date::TIMESTAMPTZ
    WHERE id = new_todo_id;
    
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to migrate routine items to todos
CREATE OR REPLACE FUNCTION migrate_routine_items_to_todos()
RETURNS void AS $$
DECLARE
  entry RECORD;
  ritual_item TEXT;
  new_todo_id UUID;
  item_index INTEGER;
BEGIN
  FOR entry IN SELECT * FROM public.routine_entries LOOP
    -- Migrate MIT (Most Important Task)
    IF entry.mit IS NOT NULL THEN
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
        created_at,
        updated_at
      ) VALUES (
        entry.user_id,
        entry.mit,
        'Most Important Task for the day',
        'task'::todo_type,
        CASE 
          WHEN entry.morning_completed THEN 'completed'::todo_status
          ELSE 'pending'::todo_status
        END,
        entry.date,
        'routine'::todo_source_type,
        entry.id::TEXT,
        jsonb_build_object(
          'routine_entry_id', entry.id,
          'day_number', entry.day_number,
          'entry_date', entry.date
        ),
        entry.created_at,
        entry.updated_at
      ) RETURNING id INTO new_todo_id;
      
      -- Create link
      INSERT INTO public.routine_todos (routine_entry_id, todo_id, todo_type)
      VALUES (entry.id, new_todo_id, 'mit');
      
      -- Mark as completed if morning routine was completed
      IF entry.morning_completed THEN
        UPDATE public.todos 
        SET completed_at = entry.date::TIMESTAMPTZ + entry.actual_wake_time
        WHERE id = new_todo_id;
      END IF;
    END IF;
    
    -- Migrate morning ritual items
    IF entry.morning_ritual_plan IS NOT NULL AND 
       jsonb_typeof(entry.morning_ritual_plan) = 'array' THEN
      
      item_index := 0;
      FOR ritual_item IN 
        SELECT jsonb_array_elements_text(entry.morning_ritual_plan) 
      LOOP
        INSERT INTO public.todos (
          user_id,
          title,
          type,
          status,
          scheduled_date,
          scheduled_time,
          source_type,
          source_id,
          source_metadata,
          created_at,
          updated_at
        ) VALUES (
          entry.user_id,
          ritual_item,
          'ritual'::todo_type,
          CASE 
            WHEN entry.ritual_completed IS NOT NULL AND 
                 jsonb_array_length(entry.ritual_completed) > item_index AND
                 (entry.ritual_completed->>item_index)::BOOLEAN = true
            THEN 'completed'::todo_status
            ELSE 'pending'::todo_status
          END,
          entry.date,
          entry.wake_intention,
          'routine'::todo_source_type,
          entry.id::TEXT,
          jsonb_build_object(
            'routine_entry_id', entry.id,
            'day_number', entry.day_number,
            'entry_date', entry.date,
            'ritual_index', item_index
          ),
          entry.created_at,
          entry.updated_at
        ) RETURNING id INTO new_todo_id;
        
        -- Create link
        INSERT INTO public.routine_todos (routine_entry_id, todo_id, todo_type)
        VALUES (entry.id, new_todo_id, 'ritual_item');
        
        item_index := item_index + 1;
      END LOOP;
    END IF;
    
    -- Migrate one percent improvement as a todo
    IF entry.one_percent_improvement IS NOT NULL THEN
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
        created_at,
        updated_at
      ) VALUES (
        entry.user_id,
        '1% Improvement: ' || entry.one_percent_improvement,
        'Daily improvement goal',
        'habit'::todo_type,
        CASE 
          WHEN entry.morning_completed THEN 'completed'::todo_status
          ELSE 'pending'::todo_status
        END,
        entry.date,
        'routine'::todo_source_type,
        entry.id::TEXT,
        jsonb_build_object(
          'routine_entry_id', entry.id,
          'day_number', entry.day_number,
          'entry_date', entry.date
        ),
        entry.created_at,
        entry.updated_at
      ) RETURNING id INTO new_todo_id;
      
      -- Create link
      INSERT INTO public.routine_todos (routine_entry_id, todo_id, todo_type)
      VALUES (entry.id, new_todo_id, 'improvement');
    END IF;
    
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to establish parent-child relationships for migrated todos
CREATE OR REPLACE FUNCTION establish_todo_relationships()
RETURNS void AS $$
DECLARE
  dump RECORD;
  edge JSONB;
  parent_todo_id UUID;
  child_todo_id UUID;
BEGIN
  -- Process edges from brain dumps to create todo relationships
  FOR dump IN SELECT * FROM public.brain_dumps LOOP
    FOR edge IN SELECT * FROM jsonb_array_elements(dump.edges) LOOP
      -- Find todos for source and target nodes
      SELECT todo_id INTO parent_todo_id
      FROM public.braindump_todos
      WHERE braindump_id = dump.id 
        AND node_id = edge->>'source'
      LIMIT 1;
      
      SELECT todo_id INTO child_todo_id
      FROM public.braindump_todos
      WHERE braindump_id = dump.id 
        AND node_id = edge->>'target'
      LIMIT 1;
      
      -- Create relationship if both todos exist
      IF parent_todo_id IS NOT NULL AND child_todo_id IS NOT NULL THEN
        INSERT INTO public.todo_relationships (
          parent_todo_id,
          child_todo_id,
          relationship_type,
          logic_type
        ) VALUES (
          parent_todo_id,
          child_todo_id,
          'subtask'::relationship_type,
          'NONE'::logic_type
        ) ON CONFLICT DO NOTHING;
        
        -- Also update the child's parent_id for simpler queries
        UPDATE public.todos
        SET parent_id = parent_todo_id
        WHERE id = child_todo_id AND parent_id IS NULL;
      END IF;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Master migration function
CREATE OR REPLACE FUNCTION migrate_all_to_todos()
RETURNS void AS $$
BEGIN
  -- Run all migrations in order
  PERFORM migrate_braindump_nodes_to_todos();
  PERFORM migrate_journal_quests_to_todos();
  PERFORM migrate_routine_items_to_todos();
  PERFORM establish_todo_relationships();
  
  -- Update stats
  RAISE NOTICE 'Migration complete. Todos created: %', 
    (SELECT COUNT(*) FROM public.todos);
END;
$$ LANGUAGE plpgsql;

-- Function to generate recurring todo instances for a date range
CREATE OR REPLACE FUNCTION generate_recurring_todo_instances(
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE DEFAULT CURRENT_DATE + INTERVAL '30 days'
)
RETURNS TABLE (
  todo_id UUID,
  instance_date DATE,
  is_completed BOOLEAN
) AS $$
BEGIN
  -- This is a placeholder for the complex recurrence generation logic
  -- Will be implemented based on the pattern_type and pattern_config
  RETURN QUERY
  SELECT 
    tr.todo_id,
    generate_series(
      GREATEST(tr.start_date, start_date),
      LEAST(COALESCE(tr.end_date, end_date), end_date),
      CASE tr.pattern_type
        WHEN 'daily' THEN INTERVAL '1 day'
        WHEN 'weekly' THEN INTERVAL '1 week'
        WHEN 'monthly' THEN INTERVAL '1 month'
        ELSE INTERVAL '1 day'
      END
    )::DATE as instance_date,
    EXISTS (
      SELECT 1 FROM public.todo_completions tc
      WHERE tc.todo_id = tr.todo_id 
        AND tc.completion_date = instance_date
    ) as is_completed
  FROM public.todo_recurrence tr
  JOIN public.todos t ON t.id = tr.todo_id
  WHERE t.status != 'cancelled'
    AND tr.start_date <= end_date
    AND (tr.end_date IS NULL OR tr.end_date >= start_date);
END;
$$ LANGUAGE plpgsql;

-- Add comment explaining migration
COMMENT ON FUNCTION migrate_all_to_todos() IS 
'Master migration function to convert all existing task-like data to the unified todo system. 
Run this once after creating the todo tables. It migrates:
- BrainDump thought nodes (with importance/urgency/status)
- Journal daily quests
- Routine MITs and ritual items
- All relationships and recurrence patterns';