-- Allow parents to view all active vans (for demo purposes)
-- In a production app, you'd want to filter by their child's assigned van/route
CREATE POLICY "Parents can view active vans"
ON public.vans
FOR SELECT
TO authenticated
USING (
  status = 'active' AND (
    -- Allow admins and drivers (existing access)
    (EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('admin', 'super_admin')
    )) OR
    (driver_id = auth.uid()) OR
    -- Allow parents to view active vans
    (EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'parent'
    ))
  )
);

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Van access by school assignment" ON public.vans;