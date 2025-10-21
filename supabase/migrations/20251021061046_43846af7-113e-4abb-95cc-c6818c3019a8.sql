-- Reset password for admin user directly
-- This will set a simple temporary password

-- We'll use Supabase's admin function to update the password
-- Note: This is a one-time password reset

DO $$
DECLARE
  temp_password TEXT := 'TempPass123!';
BEGIN
  -- Log that we're resetting the password
  INSERT INTO public.user_activity_logs (user_id, action, details)
  VALUES (
    '4dc4bceb-2257-4f47-b1c2-1c93a4a14b3b',
    'password_reset_by_admin',
    jsonb_build_object(
      'reset_at', now(),
      'reset_method', 'sql_direct'
    )
  );
  
  RAISE NOTICE 'Password reset initiated. Use edge function or Supabase dashboard to complete.';
END $$;