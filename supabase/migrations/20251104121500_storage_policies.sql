-- Kebijakan Storage untuk akses file geojson/csv/images
set search_path = public;

-- Allow public/ authenticated read akses untuk bucket tertentu
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Public read irrigation storage'
  ) then
    create policy "Public read irrigation storage"
      on storage.objects
      for select
      to anon, authenticated
      using (bucket_id in ('geojson', 'csv', 'images', 'pdf'));
  end if;
end $$;

-- Izinkan admin (role di JWT) melakukan upload/update/delete pada bucket-bucket tersebut
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Admins manage irrigation storage'
  ) then
    create policy "Admins manage irrigation storage"
      on storage.objects
      for insert
      to authenticated
      with check (
        bucket_id in ('geojson', 'csv', 'images', 'pdf')
        and coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
      );

    create policy "Admins update irrigation storage"
      on storage.objects
      for update
      to authenticated
      using (
        bucket_id in ('geojson', 'csv', 'images', 'pdf')
        and coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
      )
      with check (
        bucket_id in ('geojson', 'csv', 'images', 'pdf')
        and coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
      );

    create policy "Admins delete irrigation storage"
      on storage.objects
      for delete
      to authenticated
      using (
        bucket_id in ('geojson', 'csv', 'images', 'pdf')
        and coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
      );
  end if;
end $$;
