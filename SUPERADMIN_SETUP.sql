-- ============================================
-- SUPER ADMIN PASSWORD RESET SCRIPT
-- ============================================
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/zbsxipmvxtkxwavbhqsr/sql/new

DO $$
DECLARE
    v_user_id uuid;
    v_user_email text;
BEGIN
    -- Get super admin user details
    SELECT au.id, au.email INTO v_user_id, v_user_email
    FROM auth.users au
    JOIN user_roles ur ON ur.user_id = au.id
    WHERE ur.role = 'super_admin'
    AND (au.email = 'sirulappaws@gmail.com' OR au.id = '8a65f6e7-15e1-4de9-8292-c09babb94480')
    LIMIT 1;
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Super admin user not found';
    END IF;
    
    RAISE NOTICE 'Found super admin: % (ID: %)', v_user_email, v_user_id;
    
    -- Reset password to: SuperAdmin@2025
    UPDATE auth.users
    SET 
        encrypted_password = crypt('SuperAdmin@2025', gen_salt('bf')),
        email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
        confirmation_token = NULL,
        updated_at = NOW()
    WHERE id = v_user_id;
    
    RAISE NOTICE 'Password updated successfully';
    
    -- Ensure profile is correctly set
    UPDATE profiles
    SET 
        full_name = '9962901122',
        mobile = '9962901122',
        phone = '9962901122',
        status = 'approved',
        updated_at = NOW()
    WHERE user_id = v_user_id;
    
    RAISE NOTICE 'Profile updated successfully';
    
    -- Clear password change requirements
    DELETE FROM user_activity_logs 
    WHERE user_id = v_user_id 
    AND action IN ('password_changed', 'temp_password_set');
    
    RAISE NOTICE 'Activity logs cleared';
    
    -- Final verification
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'SUPER ADMIN LOGIN CREDENTIALS:';
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'URL: /admin-portal';
    RAISE NOTICE 'Mobile: 9962901122';
    RAISE NOTICE 'Password: SuperAdmin@2025';
    RAISE NOTICE '===========================================';
    
END $$;
