-- Fix student-parent relationships by creating individual parents for each student
-- and distributing students more realistically

-- First, let's create individual parent accounts for students who don't have dedicated parents
-- We'll use the existing parent for one student and create new ones for others

-- Create parent for Aarav Kumar (keep existing parent)
-- Aarav Kumar stays with existing parent: paranet-maharishi (8428334557)

-- Create parent for Priya Sharma
DO $$
DECLARE
    priya_parent_id UUID;
BEGIN
    -- Create parent user in auth.users table manually first, so let's use a different approach
    -- We'll create a placeholder parent and update later
    SELECT gen_random_uuid() INTO priya_parent_id;
    
    -- Insert parent profile
    INSERT INTO public.profiles (user_id, email, full_name, mobile, status)
    VALUES (
        priya_parent_id,
        'parent-priya@gmail.com',
        'Priya Parent',
        '9876543210',
        'approved'
    );
    
    -- Assign parent role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (priya_parent_id, 'parent');
    
    -- Update Priya's parent_id
    UPDATE public.students 
    SET parent_id = priya_parent_id 
    WHERE full_name = 'Priya Sharma';
END $$;

-- Create parent for Karthik Raja
DO $$
DECLARE
    karthik_parent_id UUID;
BEGIN
    SELECT gen_random_uuid() INTO karthik_parent_id;
    
    -- Insert parent profile
    INSERT INTO public.profiles (user_id, email, full_name, mobile, status)
    VALUES (
        karthik_parent_id,
        'parent-karthik@gmail.com',
        'Karthik Parent',
        '9876543211',
        'approved'
    );
    
    -- Assign parent role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (karthik_parent_id, 'parent');
    
    -- Update Karthik's parent_id
    UPDATE public.students 
    SET parent_id = karthik_parent_id 
    WHERE full_name = 'Karthik Raja';
END $$;

-- Create parent for Sneha Patel
DO $$
DECLARE
    sneha_parent_id UUID;
BEGIN
    SELECT gen_random_uuid() INTO sneha_parent_id;
    
    -- Insert parent profile
    INSERT INTO public.profiles (user_id, email, full_name, mobile, status)
    VALUES (
        sneha_parent_id,
        'parent-sneha@gmail.com',
        'Sneha Parent',
        '9876543212',
        'approved'
    );
    
    -- Assign parent role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (sneha_parent_id, 'parent');
    
    -- Update Sneha's parent_id
    UPDATE public.students 
    SET parent_id = sneha_parent_id 
    WHERE full_name = 'Sneha Patel';
END $$;

-- Now let's create a second van and distribute students between vans
-- Create CHINMAYA van and assign some students to it
DO $$
DECLARE
    chinmaya_van_id UUID;
    chinmaya_driver_id UUID;
BEGIN
    -- Get the CHINMAYA driver ID
    SELECT user_id INTO chinmaya_driver_id
    FROM driver_details
    WHERE van_assigned = 'CHINMAYA01';
    
    -- Get or create CHINMAYA van
    SELECT id INTO chinmaya_van_id
    FROM public.vans
    WHERE van_number = 'CHINMAYA01';
    
    IF chinmaya_van_id IS NULL THEN
        INSERT INTO public.vans (van_number, school_id, driver_id, route_name, capacity, status)
        SELECT 'CHINMAYA01', school_id, chinmaya_driver_id, 'Karthinagar', 30, 'active'
        FROM public.schools
        WHERE name = 'CHINMAYA School'
        RETURNING id INTO chinmaya_van_id;
    END IF;
    
    -- Move Priya and Karthik to CHINMAYA van
    UPDATE public.students 
    SET van_id = chinmaya_van_id
    WHERE full_name IN ('Priya Sharma', 'Karthik Raja');
END $$;

-- Update van student counts
UPDATE public.vans 
SET current_students = (
    SELECT COUNT(*)
    FROM public.students
    WHERE van_id = vans.id AND status = 'active'
);