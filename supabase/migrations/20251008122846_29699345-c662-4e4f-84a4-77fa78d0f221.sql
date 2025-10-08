-- Fix RLS policies to ensure parents and drivers can access their data properly

-- Drop the overly restrictive policy
DROP POLICY IF EXISTS "Parents can view their assigned van only" ON public.vans;

-- Recreate with simpler, more permissive logic for parents and drivers
CREATE POLICY "Users can view their assigned vans" ON public.vans
FOR SELECT
USING (
  -- Admins and super admins can see all vans
  (EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('admin', 'super_admin')
  ))
  OR
  -- Drivers can see their assigned van
  (driver_id = auth.uid())
  OR
  -- Parents can see vans where their children are assigned
  (EXISTS (
    SELECT 1 FROM students s 
    WHERE s.van_id = vans.id 
    AND s.parent_id = auth.uid()
  ))
);