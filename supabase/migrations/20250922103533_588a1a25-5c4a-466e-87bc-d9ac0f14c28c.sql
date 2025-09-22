-- Fix student parent assignments to ensure proper data linkage
-- Update students without parent assignments to link them properly

-- First, let's get the parent user ID for the mobile number 9087654321 (paranet-maharishi)
-- Then update the students without parent assignments

UPDATE students 
SET parent_id = (
  SELECT user_id 
  FROM profiles 
  WHERE mobile = '9087654321' 
  LIMIT 1
)
WHERE parent_id IS NULL 
  AND full_name IN ('Karthik Raja', 'Priya Sharma', 'Sneha Patel');

-- Update driver assignment to ensure proper van-driver linking
UPDATE vans 
SET driver_id = (
  SELECT user_id 
  FROM profiles 
  WHERE mobile = '9876543210' 
  LIMIT 1
)
WHERE driver_id IS NULL;

-- Ensure all students are properly assigned to the same van
UPDATE students 
SET van_id = (
  SELECT id 
  FROM vans 
  WHERE school_id = '0d14739b-a4ca-4c9c-98a8-8953ac890633'
  LIMIT 1
)
WHERE van_id IS NULL;