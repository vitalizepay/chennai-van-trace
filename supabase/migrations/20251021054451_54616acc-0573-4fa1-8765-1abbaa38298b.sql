-- Clean up orphaned data before adding cascade constraints

-- Remove device sessions with non-existent user_ids
DELETE FROM public.device_sessions
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Remove user_roles with non-existent user_ids
DELETE FROM public.user_roles
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Remove user_activity_logs with non-existent user_ids
DELETE FROM public.user_activity_logs
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Remove driver_details with non-existent user_ids
DELETE FROM public.driver_details
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Remove parent_details with non-existent user_ids
DELETE FROM public.parent_details
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Now add ON DELETE CASCADE constraints

-- user_roles table
ALTER TABLE public.user_roles 
DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey,
ADD CONSTRAINT user_roles_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

-- user_activity_logs table  
ALTER TABLE public.user_activity_logs
DROP CONSTRAINT IF EXISTS user_activity_logs_user_id_fkey,
ADD CONSTRAINT user_activity_logs_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

-- device_sessions table
ALTER TABLE public.device_sessions
DROP CONSTRAINT IF EXISTS device_sessions_user_id_fkey,
ADD CONSTRAINT device_sessions_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

-- driver_details table
ALTER TABLE public.driver_details
DROP CONSTRAINT IF EXISTS driver_details_user_id_fkey,
ADD CONSTRAINT driver_details_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

-- parent_details table
ALTER TABLE public.parent_details
DROP CONSTRAINT IF EXISTS parent_details_user_id_fkey,
ADD CONSTRAINT parent_details_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

-- students table - parent_id should SET NULL when parent is deleted
ALTER TABLE public.students
DROP CONSTRAINT IF EXISTS students_parent_id_fkey,
ADD CONSTRAINT students_parent_id_fkey
  FOREIGN KEY (parent_id)
  REFERENCES auth.users(id)
  ON DELETE SET NULL;

-- vans table - driver_id should SET NULL when driver is deleted
ALTER TABLE public.vans
DROP CONSTRAINT IF EXISTS vans_driver_id_fkey,
ADD CONSTRAINT vans_driver_id_fkey
  FOREIGN KEY (driver_id)
  REFERENCES auth.users(id)
  ON DELETE SET NULL;