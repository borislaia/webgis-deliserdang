-- FIX: Add 'pdf' bucket validation to RLS policies
-- Run this in Supabase Dashboard > SQL Editor

-- 1. Ensure 'pdf' bucket exists in the database record
INSERT INTO storage.buckets (id, name, public) 
VALUES ('pdf', 'pdf', true) 
ON CONFLICT (id) DO NOTHING;

-- 2. Drop existing restrictive policies (so we can replace them)
DROP POLICY IF EXISTS "Public read irrigation storage" ON storage.objects;
DROP POLICY IF EXISTS "Admins manage irrigation storage" ON storage.objects;
DROP POLICY IF EXISTS "Admins update irrigation storage" ON storage.objects;
DROP POLICY IF EXISTS "Admins delete irrigation storage" ON storage.objects;

-- 3. Re-create policies including 'pdf'

-- ALLOW Public Read Access for images, geojson, csv, AND pdf
CREATE POLICY "Public read irrigation storage" 
ON storage.objects FOR SELECT 
TO anon, authenticated 
USING (bucket_id in ('geojson', 'csv', 'images', 'pdf'));

-- ALLOW Admin Write/Delete for images, geojson, csv, AND pdf
CREATE POLICY "Admins manage irrigation storage" 
ON storage.objects FOR INSERT 
TO authenticated
WITH CHECK (
    bucket_id in ('geojson', 'csv', 'images', 'pdf') 
    AND (
        -- Check for admin role in app_metadata
        coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
        -- OR check for specific email (optional, for safety during dev if role is missing)
        -- OR auth.jwt() ->> 'email' = 'borizzzlaia@gmail.com' 
    )
);

CREATE POLICY "Admins update irrigation storage" 
ON storage.objects FOR UPDATE 
TO authenticated
USING (
    bucket_id in ('geojson', 'csv', 'images', 'pdf') 
    AND coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
);

CREATE POLICY "Admins delete irrigation storage" 
ON storage.objects FOR DELETE 
TO authenticated
USING (
    bucket_id in ('geojson', 'csv', 'images', 'pdf') 
    AND coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
);

-- 4. (Optional) Backup Policy if admin role is not set correctly:
-- Uncomment below if you are still stuck and just want it to work for any logged-in user temporarily
/*
CREATE POLICY "Authenticated users can upload pdf" 
ON storage.objects FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'pdf');
*/
