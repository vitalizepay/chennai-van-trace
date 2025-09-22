-- Create the missing van 'maharishi01' and link it to the driver
INSERT INTO public.vans (
  van_number, 
  school_id, 
  driver_id, 
  capacity, 
  route_name, 
  status,
  current_students
) VALUES (
  'maharishi01',
  '0d14739b-a4ca-4c9c-98a8-8953ac890633', -- maharishi school id  
  'b390dcb5-60b3-427e-abcf-ad27626321c9', -- driver user id
  30, -- default capacity
  'Tirumangalam', -- from driver details
  'active',
  0
);

-- Update school's total_vans count
UPDATE public.schools 
SET total_vans = total_vans + 1
WHERE id = '0d14739b-a4ca-4c9c-98a8-8953ac890633';