-- Add vans to the maharishi school
INSERT INTO public.vans (van_number, capacity, school_id, route_name, status) VALUES
('TN43MA1234', 30, '0d14739b-a4ca-4c9c-98a8-8953ac890633', 'Route A - TPK Main Road', 'active'),
('TN43MA5678', 25, '0d14739b-a4ca-4c9c-98a8-8953ac890633', 'Route B - Anna Nagar', 'active'),
('TN43MA9012', 35, '0d14739b-a4ca-4c9c-98a8-8953ac890633', 'Route C - KK Nagar', 'active');

-- Update the school's total_vans count
UPDATE public.schools 
SET total_vans = 3
WHERE id = '0d14739b-a4ca-4c9c-98a8-8953ac890633';