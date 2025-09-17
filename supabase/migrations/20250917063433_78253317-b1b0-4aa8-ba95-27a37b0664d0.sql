-- Update the mobile login function to handle different phone number formats
CREATE OR REPLACE FUNCTION public.get_user_for_mobile_login(_mobile text)
 RETURNS TABLE(user_id uuid, email text, full_name text, mobile text, status user_status, roles text[])
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  WHERE 
    -- Match exact mobile number
    p.mobile = _mobile 
    -- Match mobile with +91 prefix if user enters 10 digits
    OR p.mobile = ('+91' || _mobile)
    -- Match mobile without +91 prefix if stored with prefix
    OR (p.mobile LIKE '+91%' AND RIGHT(p.mobile, 10) = _mobile)
    -- Also check phone field for compatibility
    OR p.phone = _mobile 
    OR p.phone = ('+91' || _mobile)
    OR (p.phone LIKE '+91%' AND RIGHT(p.phone, 10) = _mobile);
END;
$function$;