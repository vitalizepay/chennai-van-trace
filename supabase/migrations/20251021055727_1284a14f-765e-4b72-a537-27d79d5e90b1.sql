-- Complete database cleanup - Delete all schools, users, and related data
-- WARNING: This will delete ALL data from the application

-- Step 1: Delete all students (references parents and vans)
DELETE FROM public.students;

-- Step 2: Delete all vans (references schools and drivers)
DELETE FROM public.vans;

-- Step 3: Delete all role-specific details
DELETE FROM public.parent_details;
DELETE FROM public.driver_details;

-- Step 4: Delete all user roles
DELETE FROM public.user_roles;

-- Step 5: Delete all user activity logs
DELETE FROM public.user_activity_logs;

-- Step 6: Delete all device sessions
DELETE FROM public.device_sessions;

-- Step 7: Delete all OTPs
DELETE FROM public.otps;

-- Step 8: Delete all profiles
DELETE FROM public.profiles;

-- Step 9: Delete all schools
DELETE FROM public.schools;

-- Step 10: Note about auth.users
-- Auth users will be automatically cleaned up due to CASCADE constraints
-- But we'll trigger a cleanup by deleting all profiles which will cascade delete auth users