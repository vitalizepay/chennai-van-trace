-- Fix security warnings by adding SET search_path to functions
CREATE OR REPLACE FUNCTION public.generate_otp(
  _mobile text,
  _purpose text DEFAULT 'login'
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _otp_code text;
  _expires_at timestamp with time zone;
BEGIN
  -- Generate 6-digit OTP
  _otp_code := LPAD(floor(random() * 1000000)::text, 6, '0');
  _expires_at := now() + interval '5 minutes';
  
  -- Cleanup any existing OTPs for this mobile
  DELETE FROM public.otps WHERE mobile = _mobile AND purpose = _purpose AND expires_at > now();
  
  -- Insert new OTP
  INSERT INTO public.otps (mobile, otp_code, purpose, expires_at)
  VALUES (_mobile, _otp_code, _purpose, _expires_at);
  
  RETURN _otp_code;
END;
$$;

CREATE OR REPLACE FUNCTION public.verify_otp(
  _mobile text,
  _otp_code text,
  _purpose text DEFAULT 'login'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _otp_record public.otps%ROWTYPE;
BEGIN
  SELECT * INTO _otp_record
  FROM public.otps
  WHERE mobile = _mobile 
    AND purpose = _purpose 
    AND expires_at > now()
    AND verified = false
    AND attempts < max_attempts
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  UPDATE public.otps 
  SET attempts = attempts + 1
  WHERE id = _otp_record.id;
  
  IF _otp_record.otp_code = _otp_code THEN
    UPDATE public.otps 
    SET verified = true
    WHERE id = _otp_record.id;
    
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_expired_otps()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.otps WHERE expires_at < now();
END;
$$;