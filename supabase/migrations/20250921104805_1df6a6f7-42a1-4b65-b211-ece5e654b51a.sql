-- Get the parent user ID and assign parent role
INSERT INTO public.user_roles (user_id, role)
SELECT 
  p.user_id,
  'parent'::app_role
FROM public.profiles p 
WHERE p.email = 'parent1@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;