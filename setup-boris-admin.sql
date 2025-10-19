-- Setup script to create 'boris' as admin user
-- Run this in your Supabase SQL Editor after creating the user

-- First, create the user in auth.users (this is usually done through the Supabase Auth UI)
-- Go to Authentication > Users > Add User in your Supabase dashboard
-- Email: boris@admin.com
-- Password: [your chosen password]
-- Auto Confirm User: Yes (for testing)

-- After creating the user, get their UUID from the Users table
-- Then run this query to set their role to admin:

-- Replace 'USER_UUID_HERE' with the actual UUID from the auth.users table
-- You can find this by running: SELECT id, email FROM auth.users WHERE email = 'boris@admin.com';

-- Example (replace with actual UUID):
-- INSERT INTO user_roles (user_id, role) 
-- VALUES ('USER_UUID_HERE', 'admin')
-- ON CONFLICT (user_id) 
-- DO UPDATE SET role = 'admin';

-- Alternative: If you want to create a test admin user directly via SQL:
-- (Note: This bypasses normal auth flow and should only be used for testing)

-- First, let's see what users exist:
SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC;

-- If you see the boris user, copy their ID and use it in the query below:
-- INSERT INTO user_roles (user_id, role) VALUES ('[USER_ID_FROM_ABOVE]', 'admin');

-- To verify the admin user was created correctly:
SELECT 
  u.email,
  ur.role,
  u.created_at
FROM auth.users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
WHERE u.email = 'boris@admin.com';