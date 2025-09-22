-- Remove the extra vans, keeping only one
DELETE FROM public.vans 
WHERE school_id = '0d14739b-a4ca-4c9c-98a8-8953ac890633' 
AND van_number IN ('TN43MA5678', 'TN43MA9012');

-- Update the school's total_vans count to 1
UPDATE public.schools 
SET total_vans = 1
WHERE id = '0d14739b-a4ca-4c9c-98a8-8953ac890633';