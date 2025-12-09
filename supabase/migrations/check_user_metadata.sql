-- Query untuk cek user metadata dan role
-- Jalankan ini untuk melihat struktur role di database

SELECT 
    id,
    email,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at
FROM auth.users
WHERE email = 'YOUR_EMAIL_HERE'  -- Ganti dengan email Anda
LIMIT 1;

-- Atau untuk melihat semua users:
-- SELECT 
--     id,
--     email,
--     raw_app_meta_data->>'role' as app_role,
--     raw_user_meta_data->>'role' as user_role,
--     created_at
-- FROM auth.users
-- ORDER BY created_at DESC;
