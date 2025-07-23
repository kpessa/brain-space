-- Brain Space Data Migration for Current Authenticated User
-- Run this AFTER you've logged into the production app with your Google account

-- First, let's see what user ID you have in production
-- SELECT auth.uid() as current_user_id;

-- Get the current authenticated user ID
DO $$
DECLARE
    current_user_id UUID;
BEGIN
    -- Get the current user ID (you'll need to replace this with your actual production user ID)
    current_user_id := auth.uid();
    
    -- If no authenticated user, exit
    IF current_user_id IS NULL THEN
        RAISE NOTICE 'No authenticated user found. Please log in first.';
        RETURN;
    END IF;
    
    -- Insert/Update user profile for current user
    INSERT INTO "public"."profiles" ("id", "username", "avatar_url", "created_at", "updated_at") VALUES
        (current_user_id, NULL, NULL, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
        updated_at = NOW();
    
    -- Insert/Update user progress for current user
    INSERT INTO "public"."user_progress" ("user_id", "level", "current_xp", "total_xp", "current_streak", "longest_streak", "total_entries", "achievements", "last_entry_date", "created_at", "updated_at") VALUES
        (current_user_id, 1, 65, 65, 1, 1, 1, '[]', '2025-07-21 15:32:06.628+00', NOW(), NOW())
    ON CONFLICT (user_id) DO UPDATE SET
        level = 1,
        current_xp = 65,
        total_xp = 65,
        current_streak = 1,
        longest_streak = 1,
        total_entries = 1,
        achievements = '[]',
        last_entry_date = '2025-07-21 15:32:06.628+00',
        updated_at = NOW();
    
    -- Insert journal entry for current user
    INSERT INTO "public"."journal_entries" ("id", "user_id", "date", "gratitude", "daily_quest", "threats", "allies", "notes", "xp_earned", "created_at", "updated_at") VALUES
        ('entry-production-' || EXTRACT(EPOCH FROM NOW())::TEXT, current_user_id, '2025-07-21 15:32:06.628+00', '{family,"Weverton and Jessenia",Leo,PTO,"having a job"}', 'Scooter!', '', '', '', 65, '2025-07-21 15:32:06.628+00', NOW())
    ON CONFLICT (id) DO NOTHING; -- Don't update if exists
    
    RAISE NOTICE 'Data migration completed for user: %', current_user_id;
END $$;