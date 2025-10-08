-- Fix infinite recursion in RLS policies by using security definer functions

-- Create function to check if user is a parent of students in a van
CREATE OR REPLACE FUNCTION public.is_parent_of_van_students(_user_id uuid, _van_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.students
    WHERE van_id = _van_id 
    AND parent_id = _user_id
  )
$$;

-- Create function to check if user is driver of van
CREATE OR REPLACE FUNCTION public.is_van_driver(_user_id uuid, _van_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.vans
    WHERE id = _van_id 
    AND driver_id = _user_id
  )
$$;

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view their assigned vans" ON public.vans;

-- Recreate with security definer functions to avoid recursion
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
  public.is_parent_of_van_students(auth.uid(), id)
);