-- TEMPORARY: Disable RLS untuk testing
-- HATI-HATI: Ini membuka akses ke semua user!

ALTER TABLE daerah_irigasi DISABLE ROW LEVEL SECURITY;

-- Setelah testing berhasil, enable kembali dengan:
-- ALTER TABLE daerah_irigasi ENABLE ROW LEVEL SECURITY;
