-- Add school assignment to user roles
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE;

-- Drop the current broad policy
DROP POLICY IF EXISTS "Admins and super admins can manage schools" ON public.schools;

-- Create separate policies for different admin types
-- Super admins can manage all schools
CREATE POLICY "Super admins can manage all schools" 
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
CREATE POLICY "Admins can manage their assigned school" 
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

-- Also update vans table policies to match school access
DROP POLICY IF EXISTS "Admins can manage their school's vans" ON public.vans;

CREATE POLICY "Admins can manage their school's vans" 
ON public.vans 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 
    FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'admin'
    AND ur.school_id = vans.school_id
  ) OR
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
    AND ur.role = 'admin'
    AND ur.school_id = vans.school_id
  ) OR
  EXISTS (
    SELECT 1 
    FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'super_admin'
  )
);