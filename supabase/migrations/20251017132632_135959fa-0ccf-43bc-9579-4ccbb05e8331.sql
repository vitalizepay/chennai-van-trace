
-- Reset super admin password for mobile 9962901122
DO $$
DECLARE
  _user_id UUID := '8a65f6e7-15e1-4de9-8292-c09babb94480';
BEGIN
  -- Log the password reset
  INSERT INTO public.user_activity_logs (user_id, action, details)
  VALUES (
    _user_id,
    'password_reset',
    jsonb_build_object(
      'reset_by', 'system',
      'mobile', '9962901122',
      'timestamp', now()
    )
  );
END $$;
