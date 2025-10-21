# Single School Setup Guide

This application is designed for **ONE SCHOOL ONLY**. Follow these steps to set up your school.

## Initial Setup (Run Once)

### Step 1: Create Your School
1. Go to: https://supabase.com/dashboard/project/zbsxipmvxtkxwavbhqsr/sql/new
2. Run this SQL:

```sql
-- Create your school
INSERT INTO schools (name, location, address, contact_email, contact_phone, status)
VALUES (
  'ABC International School',      -- Your school name
  'Chennai, Tamil Nadu',            -- Your location
  '123 Main Road, Chennai',        -- Full address
  'admin@abcschool.com',           -- School email
  '044-12345678',                  -- School phone
  'active'
)
RETURNING id, name;
```

**IMPORTANT**: Copy the `id` that's returned - you'll need it for Step 2!

### Step 2: Create Your First Admin User

1. Go to Auth Users: https://supabase.com/dashboard/project/zbsxipmvxtkxwavbhqsr/auth/users
2. Click "Add User" → "Create new user"
3. Enter:
   - Email: `admin@yourschool.com`
   - Password: `TempPass123!` (temporary)
4. Click "Create user"

5. Go back to SQL Editor: https://supabase.com/dashboard/project/zbsxipmvxtkxwavbhqsr/sql/new
6. Run this SQL:

```sql
-- Assign admin role (replace with your values)
SELECT create_admin_user(
  'admin@yourschool.com',                        -- Email from Auth
  '9876543210',                                  -- Admin's mobile number
  'John Smith',                                  -- Admin's full name
  'paste-school-id-from-step-1-here'            -- School ID from Step 1
);
```

### Step 3: Login and Start Using

1. Go to: /school-admin
2. Login with:
   - Email: `admin@yourschool.com`
   - Password: `TempPass123!`
3. Change password on first login
4. Start creating Parent and Driver accounts!

## Day-to-Day Operations

### As Admin, You Can:
✅ Create Parent accounts (with student information)
✅ Create Driver accounts (with license information)
✅ Assign vans to routes and drivers
✅ Reset passwords for parents and drivers
✅ Track vans in real-time
✅ View analytics and reports

### Creating More Admins (If Needed)
Only you (super admin) can create additional admin users. Repeat Step 2 above for each new admin.

## Example Setup

```sql
-- Example: Step 1 - Create School
INSERT INTO schools (name, location, address, contact_email, contact_phone, status)
VALUES (
  'St. Mary''s High School',
  'Coimbatore, Tamil Nadu',
  '45 Avinashi Road, Coimbatore - 641001',
  'admin@stmarysschool.edu.in',
  '0422-2234567',
  'active'
)
RETURNING id, name;
-- Result: id = 'abc-123-def-456'

-- Example: Step 2 - Create Admin (after creating in Auth UI first!)
SELECT create_admin_user(
  'principal@stmarysschool.edu.in',
  '9876543210',
  'Mrs. Sarah Johnson',
  'abc-123-def-456'
);
```

## Verification

After setup, verify everything works:

```sql
-- Check your school exists
SELECT * FROM schools;

-- Check admin user exists
SELECT 
  p.full_name,
  p.email,
  p.mobile,
  p.status,
  ur.role,
  s.name as school_name
FROM profiles p
JOIN user_roles ur ON ur.user_id = p.user_id
JOIN schools s ON s.id = ur.school_id
WHERE ur.role = 'admin';
```

## Need Help?
- All users: https://supabase.com/dashboard/project/zbsxipmvxtkxwavbhqsr/auth/users
- Run SQL: https://supabase.com/dashboard/project/zbsxipmvxtkxwavbhqsr/sql/new
- View data: https://supabase.com/dashboard/project/zbsxipmvxtkxwavbhqsr/editor
