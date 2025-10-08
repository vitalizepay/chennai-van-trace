-- Fix existing parent user 9944205805 (Senthil) by adding their students
-- This parent was created before the van assignment fix

-- First, check if the parent already has students (shouldn't, but let's be safe)
-- If they do, we won't insert duplicates

-- Get the parent's school_id from their user_roles
DO $$
DECLARE
  _parent_id UUID := '888267fe-e96f-49ec-9730-4aff7aed4c0f';
  _van_id UUID := '7e8badb0-8e00-47b4-833d-0a454c038846'; -- CHINMAYA01
  _school_id UUID;
  _student_count INT;
BEGIN
  -- Get school_id for this parent
  SELECT school_id INTO _school_id
  FROM user_roles
  WHERE user_id = _parent_id AND role = 'parent'
  LIMIT 1;

  -- Check if parent already has students
  SELECT COUNT(*) INTO _student_count
  FROM students
  WHERE parent_id = _parent_id;

  -- Only insert if no students exist
  IF _student_count = 0 AND _school_id IS NOT NULL THEN
    -- Insert a student for this parent (we'll use data from parent_details)
    -- Since we don't know the actual student names, we'll create a placeholder
    -- The admin can update this later
    INSERT INTO students (
      full_name,
      grade,
      pickup_stop,
      parent_id,
      school_id,
      van_id,
      status,
      boarded,
      dropped,
      emergency_contact
    )
    SELECT
      'Student of ' || p.full_name,
      'Grade 1',
      'Karthinagar', -- Using the route name from the van
      _parent_id,
      _school_id,
      _van_id,
      'active',
      false,
      false,
      pd.emergency_contact
    FROM profiles p
    LEFT JOIN parent_details pd ON pd.user_id = p.user_id
    WHERE p.user_id = _parent_id;

    -- Update van's current_students count
    UPDATE vans
    SET current_students = (
      SELECT COUNT(*) 
      FROM students 
      WHERE van_id = _van_id AND status = 'active'
    )
    WHERE id = _van_id;

    RAISE NOTICE 'Created student for parent % and updated van student count', _parent_id;
  ELSE
    RAISE NOTICE 'Parent % already has % students or no school assigned', _parent_id, _student_count;
  END IF;
END $$;