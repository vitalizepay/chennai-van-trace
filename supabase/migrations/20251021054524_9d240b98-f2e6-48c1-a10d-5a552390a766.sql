-- Clean up orphaned data and add ON DELETE CASCADE constraints

-- Step 1: Clean up orphaned records in device_sessions
DELETE FROM public.device_sessions
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Step 2: Clean up orphaned records in user_roles
DELETE FROM public.user_roles
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Step 3: Clean up orphaned records in user_activity_logs
DELETE FROM public.user_activity_logs
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Step 4: Clean up orphaned records in driver_details
DELETE FROM public.driver_details
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Step 5: Clean up orphaned records in parent_details
DELETE FROM public.parent_details
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Step 6: Clean up orphaned parent_id references in students
UPDATE public.students
SET parent_id = NULL
WHERE parent_id IS NOT NULL 
  AND parent_id NOT IN (SELECT id FROM auth.users);

-- Step 7: Clean up orphaned driver_id references in vans
UPDATE public.vans
SET driver_id = NULL
WHERE driver_id IS NOT NULL
  AND driver_id NOT IN (SELECT id FROM auth.users);

-- Step 8: Now add CASCADE constraints to user_id foreign keys

ALTER TABLE public.user_roles 
DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey,
ADD CONSTRAINT user_roles_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

ALTER TABLE public.user_activity_logs
DROP CONSTRAINT IF EXISTS user_activity_logs_user_id_fkey,
ADD CONSTRAINT user_activity_logs_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

ALTER TABLE public.device_sessions
DROP CONSTRAINT IF EXISTS device_sessions_user_id_fkey,
ADD CONSTRAINT device_sessions_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

ALTER TABLE public.driver_details
DROP CONSTRAINT IF EXISTS driver_details_user_id_fkey,
ADD CONSTRAINT driver_details_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

ALTER TABLE public.parent_details
DROP CONSTRAINT IF EXISTS parent_details_user_id_fkey,
ADD CONSTRAINT parent_details_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

ALTER TABLE public.students
DROP CONSTRAINT IF EXISTS students_parent_id_fkey,
ADD CONSTRAINT students_parent_id_fkey
  FOREIGN KEY (parent_id)
  REFERENCES auth.users(id)
  ON DELETE SET NULL;

ALTER TABLE public.vans
DROP CONSTRAINT IF EXISTS vans_driver_id_fkey,
ADD CONSTRAINT vans_driver_id_fkey
  FOREIGN KEY (driver_id)
  REFERENCES auth.users(id)
  ON DELETE SET NULL;