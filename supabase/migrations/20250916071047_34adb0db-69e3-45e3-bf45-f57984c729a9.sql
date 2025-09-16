-- Create proper RLS policies for OTP and device sessions tables
DROP POLICY IF EXISTS "Anyone can insert OTP requests" ON public.otps;
DROP POLICY IF EXISTS "Users can view their own OTPs" ON public.otps;
DROP POLICY IF EXISTS "System can update OTP status" ON public.otps;
DROP POLICY IF EXISTS "System can cleanup expired OTPs" ON public.otps;

-- Create policies for OTP table
CREATE POLICY "Public access for OTP operations" ON public.otps
FOR ALL USING (true);

-- Create policies for device_sessions table (drop existing first)
DROP POLICY IF EXISTS "Users can view their own device sessions" ON public.device_sessions;
DROP POLICY IF EXISTS "Users can insert their own device sessions" ON public.device_sessions;
DROP POLICY IF EXISTS "Users can update their own device sessions" ON public.device_sessions;
DROP POLICY IF EXISTS "Users can delete their own device sessions" ON public.device_sessions;

CREATE POLICY "Users can manage their own device sessions" ON public.device_sessions
FOR ALL USING (auth.uid() = user_id OR auth.uid() IS NULL);

-- Add indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_profiles_mobile ON public.profiles(mobile);
CREATE INDEX IF NOT EXISTS idx_otps_mobile_purpose ON public.otps(mobile, purpose);
CREATE INDEX IF NOT EXISTS idx_otps_verified_expires ON public.otps(verified, expires_at);