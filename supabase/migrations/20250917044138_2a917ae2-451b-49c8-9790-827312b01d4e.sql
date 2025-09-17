-- Add school assignment to user roles if not exists
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE;

-- Drop ALL existing policies on schools table
DROP POLICY IF EXISTS "Admins and super admins can manage schools" ON public.schools;
DROP POLICY IF EXISTS "Super admins can manage all schools" ON public.schools;
DROP POLICY IF EXISTS "Admins can view assigned school" ON public.schools;

-- Create new policies with proper school assignment
-- Super admins can manage all schools
CREATE POLICY "Super admin full access" 
ON public.schools 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 
    FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'super_admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'super_admin'
  )
);

-- Regular admins can only manage their assigned school
CREATE POLICY "Admin assigned school access" 
ON public.schools 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 
    FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'admin'
    AND ur.school_id = schools.id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'admin'
    AND ur.school_id = schools.id
  )
);

-- Update vans table policies to match
DROP POLICY IF EXISTS "Admins can manage their school's vans" ON public.vans;
DROP POLICY IF EXISTS "Super admins can manage all vans" ON public.vans;

CREATE POLICY "Van access by school assignment" 
ON public.vans 
FOR ALL 
USING (
  -- Super admins can access all vans
  EXISTS (
    SELECT 1 
    FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'super_admin'
  ) OR
  -- Admins can access vans from their assigned school  
  EXISTS (
    SELECT 1 
    FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'admin'
    AND ur.school_id = vans.school_id
  ) OR
  -- Drivers can access their assigned van
  (driver_id = auth.uid())
)
WITH CHECK (
  -- Super admins can modify all vans
  EXISTS (
    SELECT 1 
    FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'super_admin'
  ) OR
  -- Admins can modify vans from their assigned school
  EXISTS (
    SELECT 1 
    FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'admin'
    AND ur.school_id = vans.school_id
  )
);