-- Create students table for proper student management
CREATE TABLE public.students (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  van_id UUID REFERENCES public.vans(id) ON DELETE SET NULL,
  parent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  grade TEXT,
  pickup_stop TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'transferred')),
  emergency_contact TEXT,
  medical_info TEXT,
  boarded BOOLEAN DEFAULT false,
  dropped BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- RLS Policies for students table
CREATE POLICY "Admins can manage students for their school" 
ON public.students 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('admin', 'super_admin')
    AND (ur.school_id = students.school_id OR ur.role = 'super_admin')
  )
);

CREATE POLICY "Parents can view their own children" 
ON public.students 
FOR SELECT 
USING (parent_id = auth.uid());

CREATE POLICY "Drivers can view students in their van" 
ON public.students 
FOR SELECT 
USING (
  van_id IN (
    SELECT id FROM public.vans WHERE driver_id = auth.uid()
  )
);

CREATE POLICY "Drivers can update boarding status" 
ON public.students 
FOR UPDATE 
USING (
  van_id IN (
    SELECT id FROM public.vans WHERE driver_id = auth.uid()
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_students_updated_at
BEFORE UPDATE ON public.students
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample students data
INSERT INTO public.students (school_id, van_id, full_name, grade, pickup_stop, emergency_contact) 
SELECT 
  v.school_id,
  v.id,
  'Aarav Kumar',
  '5th Grade',
  'Anna Nagar',
  '+91-9876543210'
FROM public.vans v WHERE v.van_number = 'maharishi01'
LIMIT 1;

INSERT INTO public.students (school_id, van_id, full_name, grade, pickup_stop, emergency_contact) 
SELECT 
  v.school_id,
  v.id,
  'Priya Sharma',
  '6th Grade',
  'T. Nagar',
  '+91-9876543211'
FROM public.vans v WHERE v.van_number = 'maharishi01'
LIMIT 1;

INSERT INTO public.students (school_id, van_id, full_name, grade, pickup_stop, emergency_contact) 
SELECT 
  v.school_id,
  v.id,
  'Karthik Raja',
  '7th Grade',
  'Velachery',
  '+91-9876543212'
FROM public.vans v WHERE v.van_number = 'maharishi01'
LIMIT 1;

INSERT INTO public.students (school_id, van_id, full_name, grade, pickup_stop, emergency_contact) 
SELECT 
  v.school_id,
  v.id,
  'Sneha Patel',
  '8th Grade',
  'Adyar',
  '+91-9876543213'
FROM public.vans v WHERE v.van_number = 'maharishi01'
LIMIT 1;