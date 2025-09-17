-- Fix RLS policies for schools table to allow admins to create schools
-- Drop the existing restrictive admin policy
DROP POLICY IF EXISTS "Admins can view assigned school" ON public.schools;

-- Create new policies that allow admins to manage schools
CREATE POLICY "Admins can manage schools" 
ON public.schools 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 
    FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('admin', 'super_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('admin', 'super_admin')
  )
);

-- Also ensure the super admin policy remains
CREATE POLICY "Super admins can manage all schools" 
ON public.schools 
FOR ALL 
USING (
  EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'super_admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'super_admin'
  )
);