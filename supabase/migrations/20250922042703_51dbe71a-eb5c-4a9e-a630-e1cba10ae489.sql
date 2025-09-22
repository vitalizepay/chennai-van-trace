-- Allow parents to view school information (needed for van tracking)
CREATE POLICY "Parents can view schools for van tracking"
ON public.schools
FOR SELECT
TO authenticated
USING (
  -- Allow existing admin access
  (EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('admin', 'super_admin')
  )) OR
  -- Allow parents to view school info for van tracking
  (EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'parent'
  ))
);