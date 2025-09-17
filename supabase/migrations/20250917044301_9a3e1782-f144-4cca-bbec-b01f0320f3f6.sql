-- Update the create_admin_user function to accept school assignment
CREATE OR REPLACE FUNCTION public.create_admin_user(_email text, _mobile text, _full_name text, _school_id uuid DEFAULT NULL)
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
  
  -- Insert admin role with optional school assignment
  INSERT INTO public.user_roles (user_id, role, school_id)
  VALUES (_user_id, 'admin', _school_id)
  ON CONFLICT (user_id, role) 
  DO UPDATE SET school_id = _school_id;
  
  -- Log the action
  INSERT INTO public.user_activity_logs (user_id, action, details)
  VALUES (
    _user_id,
    'admin_created',
    jsonb_build_object(
      'email', _email, 
      'mobile', _mobile,
      'school_id', _school_id,
      'created_at', now()
    )
  );
  
  RETURN _user_id;
END;
$function$;