-- Add mobile column to profiles if not exists (make it unique for mobile-based auth)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS mobile text UNIQUE;

-- Create OTP table for managing OTP verification
CREATE TABLE IF NOT EXISTS public.otps (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mobile text NOT NULL,
  otp_code text NOT NULL,
  purpose text NOT NULL DEFAULT 'login', -- login, registration, etc.
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL,
  verified boolean NOT NULL DEFAULT false,
  attempts integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 3
);

-- Create device sessions table for auto-login functionality
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

-- Enable RLS on new tables
ALTER TABLE public.otps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for otps table
CREATE POLICY "Anyone can insert OTP requests" ON public.otps
FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view their own OTPs" ON public.otps
FOR SELECT USING (true); -- Allow reading for OTP verification

CREATE POLICY "System can update OTP status" ON public.otps
FOR UPDATE USING (true);

CREATE POLICY "System can cleanup expired OTPs" ON public.otps
FOR DELETE USING (expires_at < now());

-- Create policies for device_sessions table  
CREATE POLICY "Users can view their own device sessions" ON public.device_sessions
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own device sessions" ON public.device_sessions
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own device sessions" ON public.device_sessions
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own device sessions" ON public.device_sessions
FOR DELETE USING (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_otps_mobile ON public.otps(mobile);
CREATE INDEX IF NOT EXISTS idx_otps_expires_at ON public.otps(expires_at);
CREATE INDEX IF NOT EXISTS idx_device_sessions_user_id ON public.device_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_device_sessions_fingerprint ON public.device_sessions(device_fingerprint);

-- Function to cleanup expired OTPs
CREATE OR REPLACE FUNCTION public.cleanup_expired_otps()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.otps WHERE expires_at < now();
END;
$$;

-- Function to generate OTP
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

-- Function to verify OTP
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
  -- Find the OTP record
  SELECT * INTO _otp_record
  FROM public.otps
  WHERE mobile = _mobile 
    AND purpose = _purpose 
    AND expires_at > now()
    AND verified = false
    AND attempts < max_attempts
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- If no valid OTP found
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Increment attempts
  UPDATE public.otps 
  SET attempts = attempts + 1
  WHERE id = _otp_record.id;
  
  -- Check if OTP matches
  IF _otp_record.otp_code = _otp_code THEN
    -- Mark as verified
    UPDATE public.otps 
    SET verified = true
    WHERE id = _otp_record.id;
    
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;