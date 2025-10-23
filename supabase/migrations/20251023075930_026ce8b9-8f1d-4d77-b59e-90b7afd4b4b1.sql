-- Add latitude and longitude columns for pickup locations
ALTER TABLE public.students 
ADD COLUMN pickup_lat NUMERIC,
ADD COLUMN pickup_lng NUMERIC;

-- Add comments for clarity
COMMENT ON COLUMN public.students.pickup_lat IS 'Latitude of the pickup location';
COMMENT ON COLUMN public.students.pickup_lng IS 'Longitude of the pickup location';