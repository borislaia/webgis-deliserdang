-- Force enable full access to storage (DEBUG ONLY)
-- Only run this if the previous policy didn't work.

BEGIN;

-- 1. Ensure RLS is enabled on storage.objects (Supabase requires this for policies to work)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 2. Drop any existing restrictive policies for these buckets
DROP POLICY IF EXISTS "Public read irrigation storage" ON storage.objects;
DROP POLICY IF EXISTS "Give me full access" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete irrigation storage" ON storage.objects; 
DROP POLICY IF EXISTS "Allow authenticated insert irrigation storage" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated update irrigation storage" ON storage.objects;

-- 3. Create a "Super Policy" for authenticated users
-- Allow ALL operations (SELECT, INSERT, UPDATE, DELETE) for authenticated users on the relevant buckets
CREATE POLICY "Super Access Irrigation Storage"
ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id IN ('geojson', 'csv', 'images', 'pdf'))
WITH CHECK (bucket_id IN ('geojson', 'csv', 'images', 'pdf'));

-- 4. Also grant SELECT to public so images can be viewed
CREATE POLICY "Public Select Irrigation Storage"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id IN ('geojson', 'csv', 'images', 'pdf'));

COMMIT;
