-- Fix the user_has_permanent_password function to correctly identify temp passwords
-- The issue: function incorrectly returns TRUE for new users with temp passwords
-- because it checks if updated_at < created_at + 48 hours (which is TRUE for new users)
-- The fix: Check if account is OLD (created more than 48 hours ago), not if it's new

DROP FUNCTION IF EXISTS public.user_has_permanent_password(uuid);

CREATE OR REPLACE FUNCTION public.user_has_permanent_password(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  -- User has permanent password if:
  -- 1. They have a 'password_changed' action log (user-initiated password change), OR
  -- 2. Account is older than 48 hours AND approved (legacy users)
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_activity_logs
    WHERE user_id = _user_id 
      AND action = 'password_changed'
    LIMIT 1
  ) OR EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = _user_id
      AND status = 'approved'
      AND created_at < (now() - INTERVAL '48 hours')
  );
$$;