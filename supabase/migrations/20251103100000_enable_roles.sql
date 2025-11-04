-- Ensure setiap user baru otomatis mendapatkan role "user"
set search_path = public;

create or replace function auth.set_default_user_role()
returns trigger
language plpgsql
security definer
set search_path = auth, public, extensions
as $$
begin
  new.raw_app_meta_data := coalesce(new.raw_app_meta_data, '{}'::jsonb);
  if not (new.raw_app_meta_data ? 'role') then
    new.raw_app_meta_data := jsonb_set(new.raw_app_meta_data, '{role}', to_jsonb('user'::text));
  end if;

  new.raw_user_meta_data := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  if not (new.raw_user_meta_data ? 'role') then
    new.raw_user_meta_data := jsonb_set(new.raw_user_meta_data, '{role}', to_jsonb('user'::text));
  end if;

  return new;
end;
$$;

drop trigger if exists set_default_user_role on auth.users;

create trigger set_default_user_role
before insert on auth.users
for each row execute function auth.set_default_user_role();

-- Pastikan seluruh user yang ada memiliki role, default user
update auth.users
set raw_app_meta_data = jsonb_set(coalesce(raw_app_meta_data, '{}'::jsonb), '{role}', to_jsonb('user'::text), true),
    raw_user_meta_data = jsonb_set(coalesce(raw_user_meta_data, '{}'::jsonb), '{role}', to_jsonb('user'::text), true)
where coalesce(raw_app_meta_data ->> 'role', '') = '';

-- Tetapkan admin awal sesuai permintaan
update auth.users
set raw_app_meta_data = jsonb_set(coalesce(raw_app_meta_data, '{}'::jsonb), '{role}', to_jsonb('admin'::text), true),
    raw_user_meta_data = jsonb_set(coalesce(raw_user_meta_data, '{}'::jsonb), '{role}', to_jsonb('admin'::text), true)
where email = 'barizzzlaia@gmail.com';
