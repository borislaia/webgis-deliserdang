-- Fix RLS Policy untuk daerah_irigasi (Version 2)
-- Coba beberapa variasi policy

-- 1. Drop all existing UPDATE policies
DROP POLICY IF EXISTS "Allow UPDATE for admin users" ON daerah_irigasi;
DROP POLICY IF EXISTS "Enable update for admin users" ON daerah_irigasi;
DROP POLICY IF EXISTS "Allow authenticated users to update" ON daerah_irigasi;

-- 2. TEMPORARY: Allow all authenticated users to update (untuk testing)
-- Setelah confirm berfungsi, kita akan restrict ke admin only
CREATE POLICY "Allow authenticated users to update"
ON daerah_irigasi
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- 3. Enable RLS kembali
ALTER TABLE daerah_irigasi ENABLE ROW LEVEL SECURITY;

-- 4. Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'daerah_irigasi'
ORDER BY cmd;
