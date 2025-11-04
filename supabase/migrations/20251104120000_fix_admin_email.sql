-- Perbaiki penetapan role admin untuk email yang benar
set search_path = public;

-- Pastikan email yang dimaksud mendapatkan role admin
update auth.users
set raw_app_meta_data = jsonb_set(coalesce(raw_app_meta_data, '{}'::jsonb), '{role}', to_jsonb('admin'::text), true),
    raw_user_meta_data = jsonb_set(coalesce(raw_user_meta_data, '{}'::jsonb), '{role}', to_jsonb('admin'::text), true)
where email = 'borizzzlaia@gmail.com';

-- Kembalikan role default untuk email yang salah ketik pada migrasi sebelumnya (jika ada)
update auth.users
set raw_app_meta_data = jsonb_set(coalesce(raw_app_meta_data, '{}'::jsonb), '{role}', to_jsonb('user'::text), true),
    raw_user_meta_data = jsonb_set(coalesce(raw_user_meta_data, '{}'::jsonb), '{role}', to_jsonb('user'::text), true)
where email = 'barizzzlaia@gmail.com';
