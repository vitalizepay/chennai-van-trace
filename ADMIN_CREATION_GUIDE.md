# Admin User Creation Guide

Admin users can only be created by super administrators (you). Regular admins can only create Parent and Driver users.

## How to Create Admin Users

### Step 1: Create User in Supabase Auth
1. Go to: https://supabase.com/dashboard/project/zbsxipmvxtkxwavbhqsr/auth/users
2. Click "Add User" → "Create new user"
3. Enter:
   - Email address
   - Password (temporary password for first login)
4. Click "Create user"

### Step 2: Assign Admin Role via SQL

1. Go to SQL Editor: https://supabase.com/dashboard/project/zbsxipmvxtkxwavbhqsr/sql/new
2. Run this SQL query:

```sql
-- Get the list of schools first to find the school_id
SELECT id, name FROM schools;

-- Then create the admin user with the correct school_id
SELECT create_admin_user(
  'admin@school.com',     -- Replace with the email you created in Step 1
  '9876543210',           -- Replace with admin's mobile number
  'Admin Full Name',      -- Replace with admin's full name
  'school-id-uuid-here'   -- Replace with the school ID from above query
);
```

### Example:

```sql
-- 1. Find school ID
SELECT id, name FROM schools;
-- Result: id = '123e4567-e89b-12d3-a456-426614174000', name = 'ABC School'

-- 2. Create admin
SELECT create_admin_user(
  'john.admin@abcschool.com',
  '9876543210',
  'John Smith',
  '123e4567-e89b-12d3-a456-426614174000'
);
```

### Step 3: Verify Admin Creation

1. Check the user was created: https://supabase.com/dashboard/project/zbsxipmvxtkxwavbhqsr/auth/users
2. The admin can now log in with their email and the password you set in Step 1
3. They should change their password on first login

## What Admins Can Do

✅ School admins can:
- Create Parent accounts
- Create Driver accounts
- Reset passwords for parents and drivers
- Manage vans for their school
- View analytics for their school

❌ School admins cannot:
- Create other admin accounts
- Access other schools' data
- Modify school settings

## Database Structure

The `create_admin_user` function:
1. Checks if the user exists in auth.users (must be created first in Supabase Auth)
2. Creates/updates profile with mobile number
3. Assigns 'admin' role in user_roles table
4. Links the admin to their assigned school
5. Logs the action in user_activity_logs

## Troubleshooting

**Error: "User with email % not found"**
- You forgot to create the user in Supabase Auth first (Step 1)
- Go to Auth Users and create the user before running the SQL

**Error: "School ID not found"**
- The school_id you provided doesn't exist
- Run `SELECT id, name FROM schools;` to get valid school IDs

**Admin can't see any data**
- Check they're assigned to the correct school
- Run: `SELECT * FROM user_roles WHERE user_id = 'user-id-here';`
- Verify school_id matches their school
