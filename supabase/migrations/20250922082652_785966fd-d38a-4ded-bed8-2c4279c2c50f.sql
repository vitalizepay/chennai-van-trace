-- Fix student-parent linking and van assignments
-- Update the student "Aarav Kumar" to have correct parent_id linking

-- First, let's check the current parent ID for "Aarav Kumar" 
-- Based on the query results, the parent user_id is b1eab585-bb9d-4cd9-8b9e-24ef51fb72bd
-- and the student should be linked to this parent

UPDATE students 
SET parent_id = 'b1eab585-bb9d-4cd9-8b9e-24ef51fb72bd'
WHERE full_name = 'Aarav Kumar' 
AND id = 'b8a492f4-bc4b-46ce-b478-cc499fa451ec';

-- Also ensure the student is properly assigned to the correct van
UPDATE students 
SET van_id = '07ce6265-069a-4a80-bb38-b40fc776bfc3'
WHERE full_name = 'Aarav Kumar' 
AND id = 'b8a492f4-bc4b-46ce-b478-cc499fa451ec';

-- Verify all students in maharishi01 van are properly linked
UPDATE students 
SET van_id = '07ce6265-069a-4a80-bb38-b40fc776bfc3'
WHERE id IN (
  '0fb17ab2-077e-4e7d-8051-2628cdf0b393', -- Priya Sharma
  '60dfbf44-e50b-4152-a6c3-72a6eb59db15', -- Karthik Raja  
  '5fe6c6cf-903e-4f1d-972b-77c2a26ab661', -- Sneha Patel
  'b8a492f4-bc4b-46ce-b478-cc499fa451ec'  -- Aarav Kumar
);