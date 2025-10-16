-- Insert Little Indians school
INSERT INTO public.schools (name, location, address, contact_phone, status, total_vans, total_students)
SELECT 'Little Indians', 'City Center', '123 Main Street, City', '9876543210', 'active', 1, 3
WHERE NOT EXISTS (SELECT 1 FROM public.schools WHERE name = 'Little Indians');