-- Add mobile column to profiles if not exists
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'mobile'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN mobile text UNIQUE;
  END IF;
END $$;

-- Create OTP table if not exists
CREATE TABLE IF NOT EXISTS public.otps (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mobile text NOT NULL,
  otp_code text NOT NULL,
  purpose text NOT NULL DEFAULT 'login',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL,
  verified boolean NOT NULL DEFAULT false,
  attempts integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 3
);

-- Create device sessions table if not exists
CREATE TABLE IF NOT EXISTS public.device_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  device_fingerprint text NOT NULL,
  device_info jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '30 days'),
  last_used_at timestamp with time zone NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true,
  UNIQUE(user_id, device_fingerprint)
);

-- Enable RLS
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'otps'
  ) THEN
    ALTER TABLE public.otps ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'device_sessions'  
  ) THEN
    ALTER TABLE public.device_sessions ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create functions for OTP management
CREATE OR REPLACE FUNCTION public.generate_otp(
  _mobile text,
  _purpose text DEFAULT 'login'
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
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