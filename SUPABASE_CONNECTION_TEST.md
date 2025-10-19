# Supabase Connection Test Guide

This guide will help you test the Supabase connection and verify that data operations work correctly.

## Current Status

✅ **Supabase client is properly configured**  
✅ **Test scripts are ready**  
✅ **Database schema is defined**  
❌ **Supabase credentials need to be configured**

## Quick Setup

### 1. Get Supabase Credentials

1. Go to [https://supabase.com](https://supabase.com) and sign in
2. Create a new project or select an existing one
3. Go to **Settings** > **API**
4. Copy the following values:
   - **Project URL** (starts with `https://`)
   - **anon public** key
   - **service_role** key (for admin operations)

### 2. Configure Environment Variables

Edit `/workspace/backend/.env` and replace the placeholder values:

```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your_actual_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key_here
```

### 3. Set Up Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Copy and paste the contents of `/workspace/backend/supabase-setup.sql`
3. Click **Run** to execute the script

This creates:
- `user_roles` table for user management
- `user_sessions` table for session tracking
- Security policies and functions
- Automatic user role assignment

## Testing the Connection

### Basic Connection Test

```bash
npm run test-supabase
```

This will:
- ✅ Check if credentials are set
- ✅ Test basic database connection
- ✅ Verify authentication service

### Comprehensive Test

```bash
npm run test-supabase-comprehensive
```

This will:
- ✅ Test connection, auth, and schema
- ✅ Verify all database tables are accessible
- ✅ Test data read operations
- ✅ Provide detailed error reporting

### Data Operations Demo

```bash
npm run demo-data-operations
```

This will:
- ✅ Demonstrate reading data from Supabase
- ✅ Show how to add new data (with service key)
- ✅ Demonstrate update and delete operations
- ✅ Show authentication integration

## Expected Results

### ✅ Successful Connection
```
🔍 Comprehensive Supabase Test
================================
URL: ✅ Set
Anon Key: ✅ Set
Service Key: ✅ Set

🔌 Testing basic connection...
✅ Basic connection successful

🔐 Testing authentication service...
✅ Auth service accessible

🗄️  Testing database schema...
  ✅ Table 'user_roles' accessible
  ✅ Table 'user_sessions' accessible

📊 Testing data operations...
  📖 Testing data read...
  ✅ Read operation successful
  📋 Found X records in user_roles table

📊 Test Results Summary
========================
Connection: ✅ PASS
Authentication: ✅ PASS
Database Schema: ✅ PASS
Data Operations: ✅ PASS

🎉 All tests passed! Supabase is properly configured and working.
```

### ❌ Common Issues

**Missing Credentials:**
```
❌ Missing Supabase credentials. Please check your .env file.
```
**Solution:** Update the `.env` file with your actual Supabase credentials.

**Invalid URL:**
```
❌ Invalid Supabase URL format. Must start with http:// or https://
```
**Solution:** Make sure your URL starts with `https://` (not just the project reference).

**Connection Failed:**
```
❌ Connection failed: relation "user_roles" does not exist
```
**Solution:** Run the SQL setup script in your Supabase dashboard.

**Permission Denied:**
```
❌ Read operation failed: permission denied for table user_roles
```
**Solution:** Check that RLS policies are properly configured and your user has the right permissions.

## Next Steps

Once the connection is working:

1. **Start the backend server:**
   ```bash
   npm run backend
   ```

2. **Test the web application:**
   - Open `http://localhost:3000`
   - Try registering a new user
   - Test login/logout functionality

3. **Verify admin features:**
   - Login as an admin user
   - Check user management panel
   - Test role-based access control

## Troubleshooting

### Check Supabase Logs
- Go to your Supabase dashboard
- Navigate to **Logs** to see detailed error messages

### Verify Database Schema
- Check that all tables exist in **Table Editor**
- Verify RLS policies are enabled
- Ensure functions are created correctly

### Test Individual Components
- Use the comprehensive test script to isolate issues
- Check each test result to identify specific problems
- Verify credentials are correctly formatted

## Security Notes

- Never commit your `.env` file to version control
- Use environment variables in production
- Regularly rotate your Supabase keys
- Monitor authentication logs for suspicious activity