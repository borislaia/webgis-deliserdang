# Supabase Setup Guide for WebGIS Deli Serdang

This guide will help you set up Supabase authentication and database for the WebGIS application.

## Prerequisites

1. A Supabase account (sign up at https://supabase.com)
2. A new Supabase project created

## Step 1: Get Supabase Credentials

1. Go to your Supabase project dashboard
2. Navigate to **Settings** > **API**
3. Copy the following values:
   - **Project URL** (SUPABASE_URL)
   - **anon public** key (SUPABASE_ANON_KEY)
   - **service_role** key (SUPABASE_SERVICE_ROLE_KEY)

## Step 2: Configure Environment Variables

1. Open `/workspace/backend/.env`
2. Replace the placeholder values with your actual Supabase credentials:

```env
SUPABASE_URL=your_actual_supabase_project_url
SUPABASE_ANON_KEY=your_actual_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_actual_supabase_service_role_key

PORT=3000
NODE_ENV=development
```

## Step 3: Set Up Database Schema

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `/workspace/backend/supabase-setup.sql`
4. Click **Run** to execute the SQL script

This will create:
- `user_roles` table for managing admin/user roles
- `user_sessions` table for session management
- Required indexes and security policies
- Functions for user role management

## Step 4: Configure Authentication Settings

1. In your Supabase dashboard, go to **Authentication** > **Settings**
2. Configure the following settings:

### Site URL
- Set to: `http://localhost:3000` (for development)
- For production: your actual domain

### Redirect URLs
Add these URLs:
- `http://localhost:3000/login.html`
- `http://localhost:3000/dashboard.html`
- `http://localhost:3000/`

### Email Settings
- Configure your email provider (optional, for email verification)
- Or disable email confirmation for testing

## Step 5: Test the Setup

1. Start the backend server:
   ```bash
   cd backend
   npm install
   npm run dev
   ```

2. Open your browser and go to `http://localhost:3000`

3. Try registering a new user:
   - Click "Register" on the login page
   - Enter email and password
   - Select role (admin or user)

4. Try logging in with the created account

## Features Included

### Authentication
- User registration with email/password
- User login/logout
- Session management with automatic token refresh
- Role-based access (admin/user)

### Database Tables
- `user_roles`: Stores user roles and permissions
- `user_sessions`: Optional session tracking
- Automatic user role assignment on signup

### Security
- Row Level Security (RLS) enabled
- Secure token-based authentication
- Automatic token expiration handling

## Admin Features

- Admin users can access user management panel
- Role-based UI (admin features hidden for regular users)
- Session management and user role checking

## Troubleshooting

### Common Issues

1. **"Missing Supabase environment variables"**
   - Check that your `.env` file has the correct values
   - Restart the backend server after updating `.env`

2. **"Invalid or expired token"**
   - Check that your Supabase URL and keys are correct
   - Verify that the user exists in Supabase Auth

3. **"Registration failed"**
   - Check Supabase Auth settings
   - Verify email confirmation settings
   - Check Supabase logs for detailed error messages

4. **Database connection issues**
   - Verify your Supabase project is active
   - Check that the SQL setup script ran successfully
   - Verify RLS policies are correctly configured

### Checking Logs

- Backend logs: Check terminal where you ran `npm run dev`
- Supabase logs: Go to **Logs** in your Supabase dashboard

## Next Steps

1. Customize the user roles and permissions as needed
2. Add additional user profile fields if required
3. Implement additional admin features
4. Set up production environment variables
5. Configure proper email templates for user verification

## Security Notes

- Never commit your `.env` file to version control
- Use environment variables in production
- Regularly rotate your Supabase keys
- Monitor user activity and authentication logs
- Consider implementing additional security measures like rate limiting