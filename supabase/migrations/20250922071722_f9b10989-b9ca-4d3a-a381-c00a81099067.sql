-- Add missing INSERT policy for vans table
CREATE POLICY "Admins can insert vans for their school" 
ON public.vans 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = ANY(ARRAY['admin'::app_role, 'super_admin'::app_role])
    AND (ur.school_id = school_id OR ur.role = 'super_admin'::app_role)
  )
);

-- Add missing UPDATE policy for vans table
CREATE POLICY "Admins can update vans for their school" 
ON public.vans 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 
    FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = ANY(ARRAY['admin'::app_role, 'super_admin'::app_role])
    AND (ur.school_id = school_id OR ur.role = 'super_admin'::app_role)
  )
) 
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = ANY(ARRAY['admin'::app_role, 'super_admin'::app_role])
    AND (ur.school_id = school_id OR ur.role = 'super_admin'::app_role)
  )
);

-- Add missing DELETE policy for vans table
CREATE POLICY "Admins can delete vans for their school" 
ON public.vans 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 
    FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = ANY(ARRAY['admin'::app_role, 'super_admin'::app_role])
    AND (ur.school_id = school_id OR ur.role = 'super_admin'::app_role)
  )
);

-- Also allow drivers to update their assigned van details
CREATE POLICY "Drivers can update their assigned van details" 
ON public.vans 
FOR UPDATE 
USING (driver_id = auth.uid()) 
WITH CHECK (driver_id = auth.uid());