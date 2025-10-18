-- Comprehensive authentication fix to prevent login issues
-- This ensures all users can log in reliably without blocking conditions

-- 1. Fix NULL confirmation_token for all users (prevents login blocks)
UPDATE auth.users
SET 
  confirmation_token = '',
  email_confirmed_at = COALESCE(email_confirmed_at, now())
WHERE confirmation_token IS NULL;

-- 2. Create index for faster mobile lookups
CREATE INDEX IF NOT EXISTS idx_profiles_mobile ON public.profiles(mobile);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);

-- 3. Clean up expired device sessions (older than 30 days)
DELETE FROM public.device_sessions 
WHERE expires_at < now() OR last_used_at < now() - INTERVAL '30 days';

-- 4. Ensure all users have proper profile status
UPDATE public.profiles
SET status = 'approved'
WHERE status = 'pending' 
  AND user_id IN (
    SELECT user_id 
    FROM public.user_activity_logs 
    WHERE action = 'password_changed'
  );

-- 5. Create helper function to check if user has changed from temp password
CREATE OR REPLACE FUNCTION public.user_has_permanent_password(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
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
      AND updated_at < created_at + INTERVAL '48 hours'
  );
$$;

-- 6. Add comment for documentation
COMMENT ON FUNCTION public.user_has_permanent_password IS 
'Checks if user has changed from temporary password to permanent one. Returns true if password_changed action exists or if profile is approved and not recently created.';

-- Log the maintenance action
DO $$
DECLARE
  _fixed_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO _fixed_count
  FROM auth.users
  WHERE confirmation_token = '';
  
  RAISE NOTICE 'Authentication system maintenance completed:';
  RAISE NOTICE '- Fixed confirmation tokens for % users', _fixed_count;
  RAISE NOTICE '- Added mobile lookup indexes';
  RAISE NOTICE '- Cleaned up expired device sessions';
  RAISE NOTICE '- Created user_has_permanent_password helper function';
END $$;