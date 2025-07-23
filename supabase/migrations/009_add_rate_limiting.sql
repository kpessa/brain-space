-- Add rate limiting for todo creation to prevent abuse
-- This prevents users from creating unlimited todos

-- Create a table to track rate limits
CREATE TABLE IF NOT EXISTS public.todo_rate_limits (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  todos_created_today INTEGER DEFAULT 0,
  todos_created_this_hour INTEGER DEFAULT 0,
  last_reset_date DATE DEFAULT CURRENT_DATE,
  last_reset_hour TIMESTAMP DEFAULT DATE_TRUNC('hour', NOW()),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.todo_rate_limits ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own rate limits" ON public.todo_rate_limits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own rate limits" ON public.todo_rate_limits
  FOR UPDATE USING (auth.uid() = user_id);

-- System can manage all rate limits
CREATE POLICY "System can manage rate limits" ON public.todo_rate_limits
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Function to check and update rate limits
CREATE OR REPLACE FUNCTION check_todo_rate_limit(p_user_id UUID)
RETURNS TABLE (
  allowed BOOLEAN,
  reason TEXT,
  daily_limit INTEGER,
  daily_used INTEGER,
  hourly_limit INTEGER,
  hourly_used INTEGER
) AS $$
DECLARE
  v_rate_limit RECORD;
  v_daily_limit INTEGER := 100; -- Max 100 todos per day
  v_hourly_limit INTEGER := 20; -- Max 20 todos per hour
  v_allowed BOOLEAN := TRUE;
  v_reason TEXT := NULL;
BEGIN
  -- Get or create rate limit record
  INSERT INTO public.todo_rate_limits (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Get current rate limit
  SELECT * INTO v_rate_limit
  FROM public.todo_rate_limits
  WHERE user_id = p_user_id
  FOR UPDATE; -- Lock the row to prevent race conditions
  
  -- Reset counters if needed
  IF v_rate_limit.last_reset_date < CURRENT_DATE THEN
    UPDATE public.todo_rate_limits
    SET todos_created_today = 0,
        last_reset_date = CURRENT_DATE
    WHERE user_id = p_user_id;
    v_rate_limit.todos_created_today := 0;
  END IF;
  
  IF v_rate_limit.last_reset_hour < DATE_TRUNC('hour', NOW()) THEN
    UPDATE public.todo_rate_limits
    SET todos_created_this_hour = 0,
        last_reset_hour = DATE_TRUNC('hour', NOW())
    WHERE user_id = p_user_id;
    v_rate_limit.todos_created_this_hour := 0;
  END IF;
  
  -- Check limits
  IF v_rate_limit.todos_created_today >= v_daily_limit THEN
    v_allowed := FALSE;
    v_reason := 'Daily limit of ' || v_daily_limit || ' todos reached';
  ELSIF v_rate_limit.todos_created_this_hour >= v_hourly_limit THEN
    v_allowed := FALSE;
    v_reason := 'Hourly limit of ' || v_hourly_limit || ' todos reached';
  END IF;
  
  -- If allowed, increment counters
  IF v_allowed THEN
    UPDATE public.todo_rate_limits
    SET todos_created_today = todos_created_today + 1,
        todos_created_this_hour = todos_created_this_hour + 1,
        updated_at = NOW()
    WHERE user_id = p_user_id;
  END IF;
  
  RETURN QUERY SELECT 
    v_allowed,
    v_reason,
    v_daily_limit,
    v_rate_limit.todos_created_today,
    v_hourly_limit,
    v_rate_limit.todos_created_this_hour;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to enforce rate limit on todo creation
CREATE OR REPLACE FUNCTION enforce_todo_rate_limit()
RETURNS TRIGGER AS $$
DECLARE
  v_rate_check RECORD;
BEGIN
  -- Skip rate limit for migrations (source_type != 'manual')
  IF NEW.source_type != 'manual' THEN
    RETURN NEW;
  END IF;
  
  -- Check rate limit
  SELECT * INTO v_rate_check
  FROM check_todo_rate_limit(NEW.user_id);
  
  IF NOT v_rate_check.allowed THEN
    RAISE EXCEPTION 'Rate limit exceeded: %', v_rate_check.reason
      USING ERRCODE = 'P0001';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for rate limiting
CREATE TRIGGER enforce_todo_rate_limit_trigger
  BEFORE INSERT ON public.todos
  FOR EACH ROW
  EXECUTE FUNCTION enforce_todo_rate_limit();

-- Function to get user's current rate limit status
CREATE OR REPLACE FUNCTION get_todo_rate_limit_status(p_user_id UUID)
RETURNS TABLE (
  daily_remaining INTEGER,
  hourly_remaining INTEGER,
  daily_reset_at TIMESTAMPTZ,
  hourly_reset_at TIMESTAMPTZ
) AS $$
DECLARE
  v_rate_limit RECORD;
  v_daily_limit INTEGER := 100;
  v_hourly_limit INTEGER := 20;
BEGIN
  -- Get current rate limit
  SELECT * INTO v_rate_limit
  FROM public.todo_rate_limits
  WHERE user_id = p_user_id;
  
  -- If no record, user hasn't created any todos yet
  IF NOT FOUND THEN
    RETURN QUERY SELECT 
      v_daily_limit,
      v_hourly_limit,
      (CURRENT_DATE + INTERVAL '1 day')::TIMESTAMPTZ,
      (DATE_TRUNC('hour', NOW()) + INTERVAL '1 hour')::TIMESTAMPTZ;
    RETURN;
  END IF;
  
  -- Calculate remaining
  RETURN QUERY SELECT 
    GREATEST(0, v_daily_limit - COALESCE(v_rate_limit.todos_created_today, 0)),
    GREATEST(0, v_hourly_limit - COALESCE(v_rate_limit.todos_created_this_hour, 0)),
    (CURRENT_DATE + INTERVAL '1 day')::TIMESTAMPTZ,
    (DATE_TRUNC('hour', NOW()) + INTERVAL '1 hour')::TIMESTAMPTZ;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION check_todo_rate_limit TO authenticated;
GRANT EXECUTE ON FUNCTION get_todo_rate_limit_status TO authenticated;

-- Add indexes for performance
CREATE INDEX idx_todo_rate_limits_user_id ON public.todo_rate_limits(user_id);
CREATE INDEX idx_todo_rate_limits_reset_date ON public.todo_rate_limits(last_reset_date);
CREATE INDEX idx_todo_rate_limits_reset_hour ON public.todo_rate_limits(last_reset_hour);

-- Add comment
COMMENT ON TABLE public.todo_rate_limits IS 
'Tracks rate limits for todo creation per user to prevent abuse.
Limits: 100 todos per day, 20 todos per hour.
Automatically resets counters at appropriate intervals.';