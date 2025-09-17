-- Insert sample schools
INSERT INTO public.schools (name, location, address, contact_email, contact_phone, status) VALUES
('Chennai Public School', 'Chennai Central', '123 Mount Road, Chennai Central, Tamil Nadu 600001', 'admin@chennai-public.edu', '+91-44-12345678', 'active'),
('St. Mary''s International School', 'T. Nagar', '456 Ranganathan Street, T. Nagar, Chennai, Tamil Nadu 600017', 'office@stmarys-intl.edu', '+91-44-87654321', 'active'),
('DAV Senior Secondary School', 'Anna Nagar', '789 Anna Salai, Anna Nagar West, Chennai, Tamil Nadu 600040', 'principal@dav-anna.edu', '+91-44-11223344', 'active');

-- Insert sample vans for the schools
INSERT INTO public.vans (van_number, school_id, capacity, status, route_name, current_students, current_lat, current_lng) 
SELECT 
  'TN01AB1234', 
  s.id, 
  25, 
  'active', 
  'Route A - Chennai Central', 
  15, 
  13.0827, 
  80.2707
FROM public.schools s WHERE s.name = 'Chennai Public School'
LIMIT 1;

INSERT INTO public.vans (van_number, school_id, capacity, status, route_name, current_students, current_lat, current_lng) 
SELECT 
  'TN01CD5678', 
  s.id, 
  30, 
  'active', 
  'Route B - T. Nagar', 
  22, 
  13.0418, 
  80.2341
FROM public.schools s WHERE s.name = 'St. Mary''s International School'
LIMIT 1;

INSERT INTO public.vans (van_number, school_id, capacity, status, route_name, current_students, current_lat, current_lng) 
SELECT 
  'TN01EF9012', 
  s.id, 
  28, 
  'active', 
  'Route C - Anna Nagar', 
  18, 
  13.0850, 
  80.2101
FROM public.schools s WHERE s.name = 'DAV Senior Secondary School'
LIMIT 1;