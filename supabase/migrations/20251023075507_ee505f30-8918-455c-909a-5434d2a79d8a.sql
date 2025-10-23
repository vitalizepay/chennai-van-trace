-- Add pickup and drop times to students table
ALTER TABLE public.students 
ADD COLUMN pickup_time TEXT,
ADD COLUMN drop_time TEXT;

-- Add comment for clarity
COMMENT ON COLUMN public.students.pickup_time IS 'Pickup time range (e.g., "06:30 AM - 07:41 AM")';
COMMENT ON COLUMN public.students.drop_time IS 'Drop time range (e.g., "10:30 AM - 12:00 PM")';