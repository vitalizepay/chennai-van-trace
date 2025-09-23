-- Remove sample students - parents should create their own students
DELETE FROM students WHERE full_name IN ('Aarav Kumar', 'Sneha Patel', 'Priya Sharma', 'Karthik Raja');