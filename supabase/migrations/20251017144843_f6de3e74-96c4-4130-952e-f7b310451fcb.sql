-- Fix Super Admin authentication - remove NULL confirmation_token
DO $$
DECLARE
  _user_id UUID := '8a65f6e7-15e1-4de9-8292-c09babb94480';
BEGIN
  -- Update auth.users to fix NULL confirmation_token
  UPDATE auth.users
  SET 
    confirmation_token = '',
    email_confirmed_at = COALESCE(email_confirmed_at, now()),
    encrypted_password = crypt('Admin123!', gen_salt('bf')),
    updated_at = now()
  WHERE id = _user_id;

  -- Ensure profile is set
  UPDATE public.profiles
  SET 
    full_name = 'Super Admin',
    mobile = '9962901122',
    phone = '9962901122',
    status = 'approved'
  WHERE user_id = _user_id;

  -- Ensure super_admin role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, 'super_admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  RAISE NOTICE 'Fixed - Login with Mobile: 9962901122, Password: Admin123!';
END $$;