# How to Get Your Supabase API Keys

## Current Issue
Your Supabase project is using the **new API key format**, but the JWT token you provided appears to be a legacy format. You need to get the current API keys from your Supabase dashboard.

## Step-by-Step Guide

### 1. Access Your Supabase Dashboard
1. Go to [https://supabase.com](https://supabase.com)
2. Sign in to your account
3. Select your project: `yyagythhwzdncantoszf`

### 2. Get Your API Keys
1. In your project dashboard, go to **Settings** (gear icon in the sidebar)
2. Click on **API** in the left menu
3. You'll see a section called **Project API keys**

### 3. Copy the Required Keys

You need these three keys:

#### **Project URL**
- Already identified: `https://yyagythhwzdncantoszf.supabase.co`
- This is your Supabase URL

#### **anon public key**
- Look for "anon public" key
- It should start with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- This is used for client-side operations

#### **service_role key**
- Look for "service_role" key  
- It should start with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- This is used for server-side admin operations

### 4. Update Your .env File

Once you have the keys, update `/workspace/backend/.env`:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Supabase Configuration
SUPABASE_URL=https://yyagythhwzdncantoszf.supabase.co
SUPABASE_ANON_KEY=your_new_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_new_service_role_key_here
```

### 5. Test the Connection

After updating the .env file, run:

```bash
npm run test-supabase-comprehensive
```

## Key Differences

### Legacy vs New API Keys

**Legacy Keys (what you had):**
- JWT format with project reference
- Longer expiration times
- Different authentication method

**New API Keys (what you need):**
- Standard JWT format
- Shorter expiration times
- Modern authentication method

## Troubleshooting

### If you can't find the API keys:
1. Make sure you're in the correct project
2. Check if you have the right permissions
3. Try refreshing the page
4. Look for "Project API keys" section specifically

### If the keys don't work:
1. Make sure you copied the entire key
2. Check for any extra spaces or characters
3. Verify the project URL is correct
4. Ensure your Supabase project is active

## Security Notes

- **anon key**: Safe to use in client-side code
- **service_role key**: Keep this secret, only use server-side
- Never commit these keys to version control
- Rotate keys regularly for security

## Next Steps

Once you have the correct keys:
1. Update the .env file
2. Run the connection tests
3. Set up the database schema
4. Test data operations