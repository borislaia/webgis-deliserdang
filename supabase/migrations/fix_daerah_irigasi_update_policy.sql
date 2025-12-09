-- Fix RLS Policy untuk daerah_irigasi
-- Policy ini mengizinkan UPDATE hanya untuk user dengan role 'admin'

-- 1. Drop existing policies jika ada
DROP POLICY IF EXISTS "Allow UPDATE for admin users" ON daerah_irigasi;
DROP POLICY IF EXISTS "Enable update for admin users" ON daerah_irigasi;

-- 2. Buat policy baru untuk UPDATE (admin only)
CREATE POLICY "Enable update for admin users"
ON daerah_irigasi
FOR UPDATE
TO authenticated
USING (
  -- Check if user has admin role in app_metadata or user_metadata
  (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
  OR
  (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
)
WITH CHECK (
  (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
  OR
  (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
);

-- 3. Pastikan RLS enabled
ALTER TABLE daerah_irigasi ENABLE ROW LEVEL SECURITY;

-- 4. Cek existing policies (optional, untuk verifikasi)
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'daerah_irigasi';
