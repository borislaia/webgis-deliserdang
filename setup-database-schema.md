# Database Schema Setup Guide

## Current Status
✅ **Supabase connection is working!**  
✅ **API keys are enabled and functional**  
❌ **Database schema needs to be set up**

## What We Need to Do

The `user_roles` table doesn't exist yet. We need to run the SQL setup script in your Supabase dashboard.

## Step-by-Step Instructions

### 1. Go to Supabase SQL Editor
1. Open your Supabase dashboard: https://supabase.com/dashboard/project/yyagythhwzdncantoszf
2. Click on **SQL Editor** in the left sidebar
3. Click **New query**

### 2. Copy and Paste the SQL Script
Copy the entire contents of `/workspace/backend/supabase-setup.sql` and paste it into the SQL editor.

### 3. Run the Script
1. Click **Run** (or press Ctrl+Enter)
2. Wait for the script to complete
3. You should see "Success. No rows returned" or similar success message

### 4. Verify the Setup
After running the script, you should have:
- ✅ `user_roles` table
- ✅ `user_sessions` table  
- ✅ Security policies (RLS)
- ✅ Functions for user management
- ✅ Triggers for automatic user role assignment

## What the Script Creates

### Tables
- **user_roles**: Stores user roles (admin/user)
- **user_sessions**: Optional session tracking

### Security Features
- Row Level Security (RLS) enabled
- Users can only see their own data
- Admins can manage all users

### Functions
- `handle_new_user()`: Automatically assigns 'user' role to new signups
- `get_user_role()`: Gets user role by ID
- `cleanup_expired_sessions()`: Cleans up old sessions

## After Setup

Once you've run the SQL script, test the connection:

```bash
npm run test-supabase-comprehensive
```

This should now show:
- ✅ Connection: PASS
- ✅ Authentication: PASS  
- ✅ Database Schema: PASS
- ✅ Data Operations: PASS

## Troubleshooting

### If the script fails:
1. Check for syntax errors
2. Make sure you have the right permissions
3. Try running it in smaller chunks

### If tables still don't exist:
1. Refresh the Supabase dashboard
2. Check the Table Editor to see if tables were created
3. Verify the script ran without errors

## Next Steps

After the schema is set up:
1. Test the connection
2. Test data operations (add/read data)
3. Test user authentication
4. Start the backend server