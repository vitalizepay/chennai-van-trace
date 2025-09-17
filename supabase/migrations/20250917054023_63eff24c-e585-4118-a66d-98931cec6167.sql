-- Update the user's mobile field to match their phone number
UPDATE profiles 
SET mobile = '9962901133'
WHERE email = 'sirulapp83@gmail.com';

-- Also update any other users who might have similar issues
UPDATE profiles 
SET mobile = REGEXP_REPLACE(phone, '^\+91', '')
WHERE mobile IS NULL AND phone IS NOT NULL AND phone LIKE '+91%';