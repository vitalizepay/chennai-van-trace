-- Function to get user for mobile login (bypasses RLS for this specific use case)
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
  WHERE p.mobile = _mobile;
END;
$function$;