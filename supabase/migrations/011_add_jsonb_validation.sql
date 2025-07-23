-- Add JSONB validation for source_metadata and pattern_config fields
-- This ensures data integrity and prevents malformed JSON from being stored

-- Function to validate source_metadata structure
CREATE OR REPLACE FUNCTION validate_source_metadata(metadata JSONB)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if metadata is null (allowed)
  IF metadata IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- Check if it's a valid JSON object
  IF jsonb_typeof(metadata) != 'object' THEN
    RETURN FALSE;
  END IF;
  
  -- Validate based on source type
  -- For braindump sources
  IF metadata ? 'braindump_id' THEN
    -- Required fields for braindump
    IF NOT (metadata ? 'node_id' AND metadata ? 'braindump_id') THEN
      RETURN FALSE;
    END IF;
    -- Validate types
    IF jsonb_typeof(metadata->'node_id') != 'string' OR
       jsonb_typeof(metadata->'braindump_id') != 'string' THEN
      RETURN FALSE;
    END IF;
  END IF;
  
  -- For journal sources
  IF metadata ? 'journal_entry_id' THEN
    -- Required fields for journal
    IF NOT (metadata ? 'journal_entry_id' AND metadata ? 'entry_date') THEN
      RETURN FALSE;
    END IF;
    -- Validate types
    IF jsonb_typeof(metadata->'journal_entry_id') != 'string' OR
       jsonb_typeof(metadata->'entry_date') != 'string' THEN
      RETURN FALSE;
    END IF;
  END IF;
  
  -- For routine sources
  IF metadata ? 'routine_entry_id' THEN
    -- Required fields for routine
    IF NOT (metadata ? 'routine_entry_id' AND metadata ? 'day_number' AND metadata ? 'entry_date') THEN
      RETURN FALSE;
    END IF;
    -- Validate types
    IF jsonb_typeof(metadata->'routine_entry_id') != 'string' OR
       jsonb_typeof(metadata->'day_number') != 'number' OR
       jsonb_typeof(metadata->'entry_date') != 'string' THEN
      RETURN FALSE;
    END IF;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to validate pattern_config structure
CREATE OR REPLACE FUNCTION validate_pattern_config(config JSONB)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if config is null (not allowed for recurrence)
  IF config IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if it's a valid JSON object
  IF jsonb_typeof(config) != 'object' THEN
    RETURN FALSE;
  END IF;
  
  -- Required fields
  IF NOT (config ? 'type') THEN
    RETURN FALSE;
  END IF;
  
  -- Validate pattern type
  IF NOT (config->>'type' IN ('daily', 'weekly', 'monthly', 'yearly', 'custom')) THEN
    RETURN FALSE;
  END IF;
  
  -- Validate specific pattern types
  CASE config->>'type'
    WHEN 'daily' THEN
      -- interval should be a number
      IF config ? 'interval' AND jsonb_typeof(config->'interval') != 'number' THEN
        RETURN FALSE;
      END IF;
      
    WHEN 'weekly' THEN
      -- days_of_week should be an array
      IF config ? 'days_of_week' AND jsonb_typeof(config->'days_of_week') != 'array' THEN
        RETURN FALSE;
      END IF;
      -- Each day should be a number 0-6
      IF config ? 'days_of_week' THEN
        FOR i IN 0..jsonb_array_length(config->'days_of_week') - 1 LOOP
          IF jsonb_typeof(config->'days_of_week'->i) != 'number' OR
             (config->'days_of_week'->i)::int NOT BETWEEN 0 AND 6 THEN
            RETURN FALSE;
          END IF;
        END LOOP;
      END IF;
      
    WHEN 'monthly' THEN
      -- day_of_month should be a number 1-31 or 'last'
      IF config ? 'day_of_month' THEN
        IF jsonb_typeof(config->'day_of_month') = 'number' THEN
          IF (config->'day_of_month')::int NOT BETWEEN 1 AND 31 THEN
            RETURN FALSE;
          END IF;
        ELSIF jsonb_typeof(config->'day_of_month') = 'string' THEN
          IF config->>'day_of_month' != 'last' THEN
            RETURN FALSE;
          END IF;
        ELSE
          RETURN FALSE;
        END IF;
      END IF;
      
    WHEN 'yearly' THEN
      -- month should be a number 1-12
      IF config ? 'month' AND jsonb_typeof(config->'month') != 'number' THEN
        RETURN FALSE;
      END IF;
      IF config ? 'month' AND ((config->'month')::int NOT BETWEEN 1 AND 12) THEN
        RETURN FALSE;
      END IF;
      -- day should be a number 1-31
      IF config ? 'day' AND jsonb_typeof(config->'day') != 'number' THEN
        RETURN FALSE;
      END IF;
      IF config ? 'day' AND ((config->'day')::int NOT BETWEEN 1 AND 31) THEN
        RETURN FALSE;
      END IF;
      
    WHEN 'custom' THEN
      -- Custom patterns must have a cron expression
      IF NOT (config ? 'cron' AND jsonb_typeof(config->'cron') = 'string') THEN
        RETURN FALSE;
      END IF;
  END CASE;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add check constraints to todos table
ALTER TABLE public.todos 
ADD CONSTRAINT check_source_metadata_valid 
CHECK (validate_source_metadata(source_metadata));

-- Add check constraint to todo_recurrence table
ALTER TABLE public.todo_recurrence 
ADD CONSTRAINT check_pattern_config_valid 
CHECK (validate_pattern_config(pattern_config));

-- Function to enforce source_metadata validation on insert/update
CREATE OR REPLACE FUNCTION enforce_todo_jsonb_validation()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate source_metadata
  IF NEW.source_metadata IS NOT NULL AND NOT validate_source_metadata(NEW.source_metadata) THEN
    RAISE EXCEPTION 'Invalid source_metadata structure for source_type %', NEW.source_type
      USING DETAIL = 'source_metadata must be a valid JSON object with required fields based on source_type';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to enforce pattern_config validation on insert/update
CREATE OR REPLACE FUNCTION enforce_recurrence_jsonb_validation()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate pattern_config
  IF NOT validate_pattern_config(NEW.pattern_config) THEN
    RAISE EXCEPTION 'Invalid pattern_config structure for pattern_type %', NEW.pattern_type
      USING DETAIL = 'pattern_config must be a valid JSON object with required fields based on pattern_type';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for additional validation with better error messages
CREATE TRIGGER validate_todo_jsonb_before_insert
  BEFORE INSERT ON public.todos
  FOR EACH ROW
  EXECUTE FUNCTION enforce_todo_jsonb_validation();

CREATE TRIGGER validate_todo_jsonb_before_update
  BEFORE UPDATE OF source_metadata ON public.todos
  FOR EACH ROW
  EXECUTE FUNCTION enforce_todo_jsonb_validation();

CREATE TRIGGER validate_recurrence_jsonb_before_insert
  BEFORE INSERT ON public.todo_recurrence
  FOR EACH ROW
  EXECUTE FUNCTION enforce_recurrence_jsonb_validation();

CREATE TRIGGER validate_recurrence_jsonb_before_update
  BEFORE UPDATE OF pattern_config ON public.todo_recurrence
  FOR EACH ROW
  EXECUTE FUNCTION enforce_recurrence_jsonb_validation();

-- Add helpful comments
COMMENT ON FUNCTION validate_source_metadata IS 
'Validates the structure of source_metadata JSONB field based on source_type.
Ensures required fields are present and have correct types for each source.';

COMMENT ON FUNCTION validate_pattern_config IS 
'Validates the structure of pattern_config JSONB field based on pattern_type.
Ensures required fields are present and have correct types for each recurrence pattern.';

-- Example valid source_metadata structures:
COMMENT ON CONSTRAINT check_source_metadata_valid ON public.todos IS 
'Validates source_metadata JSON structure. Examples:
- braindump: {"node_id": "123", "braindump_id": "456", "braindump_title": "My Tasks"}
- journal: {"journal_entry_id": "789", "entry_date": "2024-01-15", "xp_earned": 100}
- routine: {"routine_entry_id": "abc", "day_number": 1, "entry_date": "2024-01-15"}';

-- Example valid pattern_config structures:
COMMENT ON CONSTRAINT check_pattern_config_valid ON public.todo_recurrence IS 
'Validates pattern_config JSON structure. Examples:
- daily: {"type": "daily", "interval": 1}
- weekly: {"type": "weekly", "days_of_week": [1, 3, 5]}
- monthly: {"type": "monthly", "day_of_month": 15}
- yearly: {"type": "yearly", "month": 12, "day": 25}
- custom: {"type": "custom", "cron": "0 0 * * 1"}';