-- Fix parent-student relationships
-- First, let's properly link the students to the parent user
-- Based on the data, we have parent 'paranet-maharishi' with mobile 8428334557
-- and student 'Aarav Kumar' is already linked, but other students need parent assignment

-- Update the other students in maharishi school to be linked to the parent
UPDATE students 
SET parent_id = 'b1eab585-bb9d-4cd9-8b9e-24ef51fb72bd'
WHERE school_id = '0d14739b-a4ca-4c9c-98a8-8953ac890633' 
AND parent_id IS NULL
AND id IN ('60dfbf44-e50b-4152-a6c3-72a6eb59db15', '0fb17ab2-077e-4e7d-8051-2628cdf0b393', '5fe6c6cf-903e-4f1d-972b-77c2a26ab661');