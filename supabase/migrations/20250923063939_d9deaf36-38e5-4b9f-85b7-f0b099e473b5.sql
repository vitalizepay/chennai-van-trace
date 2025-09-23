-- Fix student assignments by using existing parents and distributing students correctly
-- We have 2 existing parents: paranet-maharishi and Senthil (paranet-CHINMAYA)
-- And 2 vans: maharishi01 and CHINMAYA01

-- First, get the existing parent and van IDs
DO $$
DECLARE
    maharishi_parent_id UUID;
    chinmaya_parent_id UUID;
    maharishi_van_id UUID;
    chinmaya_van_id UUID;
BEGIN
    -- Get existing parent IDs
    SELECT user_id INTO maharishi_parent_id FROM profiles WHERE mobile = '8428334557';
    SELECT user_id INTO chinmaya_parent_id FROM profiles WHERE mobile = '9944205805';
    
    -- Get existing van IDs
    SELECT id INTO maharishi_van_id FROM vans WHERE van_number = 'maharishi01';
    SELECT id INTO chinmaya_van_id FROM vans WHERE van_number = 'CHINMAYA01';
    
    -- If CHINMAYA01 van doesn't exist, create it
    IF chinmaya_van_id IS NULL THEN
        INSERT INTO vans (van_number, school_id, driver_id, route_name, capacity, status)
        SELECT 'CHINMAYA01', 
               (SELECT id FROM schools WHERE name LIKE '%CHINMAYA%' LIMIT 1),
               (SELECT user_id FROM driver_details WHERE van_assigned = 'CHINMAYA01'),
               'Karthinagar', 
               30, 
               'active'
        RETURNING id INTO chinmaya_van_id;
    END IF;
    
    -- Redistribute students:
    -- Aarav Kumar & Sneha Patel -> maharishi parent & maharishi van
    UPDATE students 
    SET parent_id = maharishi_parent_id, van_id = maharishi_van_id
    WHERE full_name IN ('Aarav Kumar', 'Sneha Patel');
    
    -- Priya Sharma & Karthik Raja -> chinmaya parent & chinmaya van  
    UPDATE students 
    SET parent_id = chinmaya_parent_id, van_id = chinmaya_van_id
    WHERE full_name IN ('Priya Sharma', 'Karthik Raja');
    
    -- Update van student counts
    UPDATE vans 
    SET current_students = (
        SELECT COUNT(*) 
        FROM students 
        WHERE van_id = vans.id AND status = 'active'
    );
    
END $$;