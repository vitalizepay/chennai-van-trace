-- Remove the placeholder van completely
DELETE FROM public.vans 
WHERE school_id = '0d14739b-a4ca-4c9c-98a8-8953ac890633' 
AND van_number = 'TN43MA1234';

-- Reset the school's total_vans count to 0
UPDATE public.schools 
SET total_vans = 0
WHERE id = '0d14739b-a4ca-4c9c-98a8-8953ac890633';