-- Set known passwords for driver and parent users to enable login
-- We'll call the reset-user-password edge function to set simple passwords

-- This is just a placeholder - the actual password reset will be done via edge function calls
-- Driver user: 8428334556 (driver-maharishi@gmail.com)
-- Parent user: 8428334557 (paranet-maharishi@gmail.com)

-- Add a comment to track this change
INSERT INTO user_activity_logs (user_id, action, details)
VALUES 
(
  'b390dcb5-60b3-427e-abcf-ad27626321c9', 
  'password_reset_for_testing',
  jsonb_build_object('mobile', '8428334556', 'role', 'driver', 'timestamp', now())
),
(
  'b1eab585-bb9d-4cd9-8b9e-24ef51fb72bd', 
  'password_reset_for_testing', 
  jsonb_build_object('mobile', '8428334557', 'role', 'parent', 'timestamp', now())
);