# Create Citra Folders Script

This script automatically creates a `citra` subfolder inside all existing DI (Daerah Irigasi) folders in the `images` bucket.

## Prerequisites

You need to add the **SUPABASE_SERVICE_ROLE_KEY** to your `.env.local` file to bypass Row Level Security (RLS) policies.

### Steps to get your Service Role Key:

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **API**
4. Copy the **service_role** key (NOT the anon key)
5. Add it to your `.env.local` file:

```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

⚠️ **IMPORTANT**: Never commit the service role key to Git! It has full access to your database.

## Usage

Once you've added the service role key to `.env.local`, run:

```bash
node scripts/create-citra-folders.js
```

## What it does

1. Fetches all irrigation area codes (k_di) from the `daerah_irigasi` table
2. For each DI, creates a `citra` subfolder in the images bucket: `images/{k_di}/citra/`
3. Uses a placeholder file (`.emptyFolderPlaceholder`) to establish the folder structure
4. Skips folders that already exist
5. Provides a summary of created, skipped, and failed folders

## Folder Structure

After running the script, your images bucket will have this structure:

```
images/
├── 12120005/
│   └── citra/
│       └── .emptyFolderPlaceholder
├── 12120008/
│   └── citra/
│       └── .emptyFolderPlaceholder
├── 12120009/
│   └── citra/
│       └── .emptyFolderPlaceholder
└── ...
```

## Troubleshooting

### Error: "new row violates row-level security policy"

This means you're using the anon key instead of the service role key. Make sure:
- You've added `SUPABASE_SERVICE_ROLE_KEY` to `.env.local`
- The key is correct (starts with `eyJ...`)
- You've restarted the script after adding the key

### Error: "Missing Supabase environment variables"

Make sure your `.env.local` file contains:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (or at minimum `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
