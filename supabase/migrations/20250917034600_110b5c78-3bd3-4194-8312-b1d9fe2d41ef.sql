-- Function to create super admin user
CREATE OR REPLACE FUNCTION public.create_super_admin_user(_email text, _mobile text, _full_name text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
  INSERT INTO public.profiles (user_id, email, full_name, mobile, status)
  VALUES (_user_id, _email, _full_name, _mobile, 'approved')
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    mobile = _mobile,
    full_name = _full_name,
    status = 'approved';
  
  -- Insert super_admin role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, 'super_admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Also insert admin role for backwards compatibility
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Log the action
  INSERT INTO public.user_activity_logs (user_id, action, details)
  VALUES (
    _user_id,
    'super_admin_created',
    jsonb_build_object(
      'email', _email, 
      'mobile', _mobile,
      'created_at', now()
    )
  );
  
  RETURN _user_id;
END;
$function$;