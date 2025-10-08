-- Drop the existing policy that allows parents to see all vans
DROP POLICY IF EXISTS "Parents can view active vans" ON public.vans;

-- Create new policy that restricts parents to only their assigned van
CREATE POLICY "Parents can view their assigned van only"
ON public.vans
FOR SELECT
TO authenticated
USING (
  status = 'active'
  AND (
    -- Admins and super admins can see all vans
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('admin', 'super_admin')
    )
    OR 
    -- Drivers can see their assigned van
    driver_id = auth.uid()
    OR
    -- Parents can ONLY see vans where their student is assigned
    EXISTS (
      SELECT 1 FROM students s
      WHERE s.van_id = vans.id 
      AND s.parent_id = auth.uid()
    )
  )
);