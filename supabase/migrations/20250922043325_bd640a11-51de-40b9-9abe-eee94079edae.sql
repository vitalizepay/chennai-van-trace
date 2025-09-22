-- Assign the driver to a van so they can update location
UPDATE public.vans 
SET driver_id = (
  SELECT p.user_id 
  FROM profiles p 
  JOIN user_roles ur ON p.user_id = ur.user_id 
  WHERE p.email = 'driver1@gmail.com' 
  AND ur.role = 'driver'
  LIMIT 1
)
WHERE van_number = 'TN01CD5678';