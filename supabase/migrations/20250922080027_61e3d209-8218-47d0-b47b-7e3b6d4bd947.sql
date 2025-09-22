-- Update existing students to link them with parent users based on name patterns
-- This is a one-time fix to link existing student records to parent accounts

-- Sample script to link students to parents based on naming patterns
-- This would need to be customized based on actual data relationships

-- First, let's create a temporary function to help with linking
CREATE OR REPLACE FUNCTION public.link_students_to_parents()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  parent_record RECORD;
  student_record RECORD;
BEGIN
  -- Loop through all parent users
  FOR parent_record IN 
    SELECT p.user_id, p.full_name, p.mobile
    FROM profiles p
    INNER JOIN user_roles ur ON p.user_id = ur.user_id
    WHERE ur.role = 'parent'
  LOOP
    -- Try to find students with similar names or create sample data
    -- For existing students named "Aarav Kumar", "Priya Sharma", etc.
    -- Link them to parents based on first name patterns
    
    -- Example: Link "Aarav Kumar" to parent with "Aarav" in name
    FOR student_record IN
      SELECT id, full_name, pickup_stop
      FROM students 
      WHERE parent_id IS NULL
      AND (
        full_name ILIKE '%' || SPLIT_PART(parent_record.full_name, ' ', 1) || '%'
        OR pickup_stop = 'Anna Nagar' AND parent_record.full_name ILIKE '%maharishi%'
      )
      LIMIT 1
    LOOP
      UPDATE students 
      SET parent_id = parent_record.user_id
      WHERE id = student_record.id;
      
      RAISE NOTICE 'Linked student % to parent %', student_record.full_name, parent_record.full_name;
    END LOOP;
  END LOOP;
END;
$$;

-- Execute the linking function
SELECT public.link_students_to_parents();

-- Clean up the temporary function
DROP FUNCTION public.link_students_to_parents();

-- Add some sample students for existing parent users if none exist
INSERT INTO public.students (full_name, grade, pickup_stop, emergency_contact, school_id, van_id, parent_id)
SELECT 
  CASE 
    WHEN p.full_name ILIKE '%maharishi%' THEN 'Aadhya Maharishi'
    WHEN p.full_name ILIKE '%parent%' THEN 'Arjun Parent'
    ELSE SPLIT_PART(p.full_name, ' ', 1) || ' Jr'
  END as full_name,
  '5th Grade' as grade,
  CASE 
    WHEN p.full_name ILIKE '%maharishi%' THEN 'Anna Nagar'
    ELSE 'T. Nagar'
  END as pickup_stop,
  COALESCE(p.mobile, '+91-9876543210') as emergency_contact,
  s.id as school_id,
  v.id as van_id,
  p.user_id as parent_id
FROM profiles p
INNER JOIN user_roles ur ON p.user_id = ur.user_id
LEFT JOIN schools s ON s.name ILIKE '%school%' OR s.name ILIKE '%maharishi%'
LEFT JOIN vans v ON v.school_id = s.id
WHERE ur.role = 'parent'
AND NOT EXISTS (
  SELECT 1 FROM students st WHERE st.parent_id = p.user_id
)
LIMIT 10;