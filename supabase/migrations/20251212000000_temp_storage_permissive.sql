-- Allow authenticated users to DELETE/INSERT/UPDATE in storage for debugging
-- Relaxing the "admin only" requirement to "authenticated" for the specific buckets

DO $$
BEGIN
  -- 1. DELETE Policy
  DROP POLICY IF EXISTS "Admins delete irrigation storage" ON storage.objects;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Allow authenticated delete irrigation storage'
  ) THEN
    CREATE POLICY "Allow authenticated delete irrigation storage"
      ON storage.objects
      FOR DELETE
      TO authenticated
      USING (bucket_id IN ('geojson', 'csv', 'images', 'pdf'));
  END IF;

  -- 2. INSERT Policy
  DROP POLICY IF EXISTS "Admins manage irrigation storage" ON storage.objects;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Allow authenticated insert irrigation storage'
  ) THEN
    CREATE POLICY "Allow authenticated insert irrigation storage"
      ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id IN ('geojson', 'csv', 'images', 'pdf'));
  END IF;

  -- 3. UPDATE Policy
  DROP POLICY IF EXISTS "Admins update irrigation storage" ON storage.objects;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Allow authenticated update irrigation storage'
  ) THEN
    CREATE POLICY "Allow authenticated update irrigation storage"
      ON storage.objects
      FOR UPDATE
      TO authenticated
      USING (bucket_id IN ('geojson', 'csv', 'images', 'pdf'));
  END IF;

END $$;
