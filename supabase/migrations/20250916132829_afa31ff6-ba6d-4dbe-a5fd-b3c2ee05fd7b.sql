-- Function to create admin user with mobile number
CREATE OR REPLACE FUNCTION public.create_admin_user(
  _email text,
  _mobile text,
  _full_name text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _user_id UUID;
BEGIN
  -- First check if user already exists by email
  SELECT id INTO _user_id
  FROM auth.users
  WHERE email = _email;
  
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found. Please create user in Supabase dashboard first.', _email;
  END IF;
  
  -- Update or create profile with mobile number
  INSERT INTO public.profiles (user_id, email, full_name, mobile)
  VALUES (_user_id, _email, _full_name, _mobile)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    mobile = _mobile,
    full_name = _full_name,
    status = 'approved';
  
  -- Insert admin role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Log the action
  INSERT INTO public.user_activity_logs (user_id, action, details)
  VALUES (
    _user_id,
    'admin_created',
    jsonb_build_object(
      'email', _email, 
      'mobile', _mobile,
      'created_at', now()
    )
  );
  
  RETURN _user_id;
END;
$$;

-- Function to find user by mobile number
CREATE OR REPLACE FUNCTION public.get_user_by_mobile(_mobile text)
RETURNS TABLE (
  user_id uuid,
  email text,
  full_name text,
  mobile text,
  status user_status,
  roles text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.user_id,
    p.email,
    p.full_name,
    p.mobile,
    p.status,
    COALESCE(
      ARRAY(
        SELECT ur.role::text 
        FROM public.user_roles ur 
        WHERE ur.user_id = p.user_id
      ), 
      ARRAY[]::text[]
    ) as roles
  FROM public.profiles p
  WHERE p.mobile = _mobile;
END;
$$;