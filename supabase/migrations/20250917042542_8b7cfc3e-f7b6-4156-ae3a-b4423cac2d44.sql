-- Create schools table
CREATE TABLE public.schools (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  address TEXT NOT NULL,
  contact_email TEXT,
  contact_phone TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  total_vans INTEGER DEFAULT 0,
  total_students INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

-- Create policies for schools
CREATE POLICY "Super admins can manage all schools" 
ON public.schools 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'super_admin'
  )
);

CREATE POLICY "Admins can view assigned school" 
ON public.schools 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.profiles p ON p.user_id = ur.user_id
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'admin'
    -- Add school assignment logic here when implemented
  )
);

-- Create vans table for proper van management
CREATE TABLE public.vans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  van_number TEXT NOT NULL,
  driver_id UUID REFERENCES auth.users(id),
  capacity INTEGER NOT NULL,
  current_students INTEGER DEFAULT 0,
  route_name TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
  current_lat DECIMAL(10, 8),
  current_lng DECIMAL(11, 8),
  last_location_update TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(school_id, van_number)
);

-- Enable RLS for vans
ALTER TABLE public.vans ENABLE ROW LEVEL SECURITY;

-- Van policies
CREATE POLICY "Super admins can manage all vans" 
ON public.vans 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'super_admin'
  )
);

CREATE POLICY "Admins can manage their school's vans" 
ON public.vans 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'admin'
    -- School assignment logic would go here
  )
);

CREATE POLICY "Drivers can view and update their assigned van" 
ON public.vans 
FOR SELECT 
USING (
  driver_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
  )
);

-- Create updated_at trigger for schools
CREATE TRIGGER update_schools_updated_at
BEFORE UPDATE ON public.schools
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create updated_at trigger for vans  
CREATE TRIGGER update_vans_updated_at
BEFORE UPDATE ON public.vans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample schools data
INSERT INTO public.schools (name, location, address, contact_email, contact_phone, total_vans, total_students) VALUES
('St. Mary''s High School', 'Chennai Central', '123 Main St, Chennai Central, Tamil Nadu 600001', 'admin@stmarys.edu', '+91-44-12345678', 4, 150),
('Gandhi Memorial School', 'T. Nagar', '456 Gandhi St, T. Nagar, Chennai, Tamil Nadu 600017', 'admin@gandhi.edu', '+91-44-87654321', 6, 220),
('Modern Public School', 'Anna Nagar', '789 Anna St, Anna Nagar, Chennai, Tamil Nadu 600040', 'admin@modern.edu', '+91-44-11223344', 3, 90),
('Sacred Heart School', 'Velachery', '321 Heart St, Velachery, Chennai, Tamil Nadu 600042', 'admin@sacredheart.edu', '+91-44-99887766', 5, 180);

-- Insert sample vans data
INSERT INTO public.vans (school_id, van_number, capacity, current_students, route_name, current_lat, current_lng, last_location_update) VALUES
-- St. Mary's vans
((SELECT id FROM public.schools WHERE name = 'St. Mary''s High School'), 'SMH-001', 30, 24, 'Route A - Central', 13.0827, 80.2707, now()),
((SELECT id FROM public.schools WHERE name = 'St. Mary''s High School'), 'SMH-002', 25, 18, 'Route B - North', 13.0878, 80.2785, now()),
((SELECT id FROM public.schools WHERE name = 'St. Mary''s High School'), 'SMH-003', 28, 22, 'Route C - South', 13.0744, 80.2642, now()),

-- Gandhi Memorial vans
((SELECT id FROM public.schools WHERE name = 'Gandhi Memorial School'), 'GMS-001', 35, 32, 'Route A - T.Nagar', 13.0418, 80.2341, now()),
((SELECT id FROM public.schools WHERE name = 'Gandhi Memorial School'), 'GMS-002', 30, 28, 'Route B - Adyar', 13.0067, 80.2206, now()),
((SELECT id FROM public.schools WHERE name = 'Gandhi Memorial School'), 'GMS-003', 32, 0, 'Route C - Mylapore', 13.0339, 80.2619, now()),

-- Modern Public vans
((SELECT id FROM public.schools WHERE name = 'Modern Public School'), 'MPS-001', 25, 22, 'Route A - Anna Nagar', 13.0850, 80.2101, now()),
((SELECT id FROM public.schools WHERE name = 'Modern Public School'), 'MPS-002', 28, 15, 'Route B - Kilpauk', 13.0732, 80.2415, now()),

-- Sacred Heart vans
((SELECT id FROM public.schools WHERE name = 'Sacred Heart School'), 'SHS-001', 30, 25, 'Route A - Velachery', 12.9716, 80.2209, now()),
((SELECT id FROM public.schools WHERE name = 'Sacred Heart School'), 'SHS-002', 32, 28, 'Route B - Tambaram', 12.9249, 80.1000, now()),
((SELECT id FROM public.schools WHERE name = 'Sacred Heart School'), 'SHS-003', 25, 0, 'Route C - Pallikaranai', 12.9698, 80.1991, now());