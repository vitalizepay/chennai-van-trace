-- Fix RLS policies for schools table to allow admins to create schools
-- Drop the existing restrictive admin policy
DROP POLICY IF EXISTS "Admins can view assigned school" ON public.schools;

-- Drop the existing super admin policy to recreate it properly
DROP POLICY IF EXISTS "Super admins can manage all schools" ON public.schools;

-- Create new comprehensive policy that allows both admins and super admins to manage schools
CREATE POLICY "Admins and super admins can manage schools" 
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