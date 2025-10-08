-- Clean up trailing spaces in mobile and phone numbers
UPDATE public.profiles 
SET 
  mobile = TRIM(mobile),
  phone = TRIM(phone)
WHERE 
  mobile IS NOT NULL OR phone IS NOT NULL;

-- Update the get_user_for_mobile_login function to handle trimming
CREATE OR REPLACE FUNCTION public.get_user_for_mobile_login(_mobile text)
RETURNS TABLE(user_id uuid, email text, full_name text, mobile text, status user_status, roles text[])
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _trimmed_mobile text;
BEGIN
  -- Trim the input mobile number
  _trimmed_mobile := TRIM(_mobile);
  
  RETURN QUERY
  SELECT 
    p.user_id,
    p.email,
    p.full_name,
    TRIM(p.mobile) as mobile,
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
    -- Match exact mobile number (trimmed)
    TRIM(p.mobile) = _trimmed_mobile
    -- Match mobile with +91 prefix if user enters 10 digits
    OR TRIM(p.mobile) = ('+91' || _trimmed_mobile)
    -- Match mobile without +91 prefix if stored with prefix
    OR (TRIM(p.mobile) LIKE '+91%' AND RIGHT(TRIM(p.mobile), 10) = _trimmed_mobile)
    -- Also check phone field for compatibility (trimmed)
    OR TRIM(p.phone) = _trimmed_mobile 
    OR TRIM(p.phone) = ('+91' || _trimmed_mobile)
    OR (TRIM(p.phone) LIKE '+91%' AND RIGHT(TRIM(p.phone), 10) = _trimmed_mobile);
END;
$function$;