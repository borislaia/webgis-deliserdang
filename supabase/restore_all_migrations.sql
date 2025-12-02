-- ============================================
-- RESTORE ALL MIGRATIONS - RUN THIS IN ORDER
-- ============================================
-- File ini menggabungkan semua migrasi untuk memudahkan restore
-- Jalankan di Supabase SQL Editor setelah project di-resume
-- ============================================

-- ============================================
-- MIGRATION 1: Create Irrigation Management System
-- ============================================
-- File: 20251027130307_create_irrigation_management_system.sql

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create daerah_irigasi table
CREATE TABLE IF NOT EXISTS daerah_irigasi (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  k_di text UNIQUE NOT NULL,
  n_di text NOT NULL,
  luas_ha numeric DEFAULT 0,
  kecamatan text DEFAULT '',
  desa_kel text DEFAULT '',
  sumber_air text DEFAULT '',
  tahun_data text DEFAULT '',
  kondisi text DEFAULT '',
  panjang_sp numeric DEFAULT 0,
  panjang_ss numeric DEFAULT 0,
  jumlah_saluran integer DEFAULT 0,
  jumlah_bangunan integer DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create saluran table
CREATE TABLE IF NOT EXISTS saluran (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  daerah_irigasi_id uuid NOT NULL REFERENCES daerah_irigasi(id) ON DELETE CASCADE,
  no_saluran text NOT NULL,
  nama text NOT NULL,
  nomenklatur text DEFAULT '',
  jenis text DEFAULT '',
  panjang_total numeric DEFAULT 0,
  luas_layanan numeric DEFAULT 0,
  urutan integer DEFAULT 0,
  geojson jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(daerah_irigasi_id, no_saluran)
);

-- Create ruas table
CREATE TABLE IF NOT EXISTS ruas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  saluran_id uuid NOT NULL REFERENCES saluran(id) ON DELETE CASCADE,
  no_ruas text NOT NULL,
  urutan integer NOT NULL,
  panjang numeric DEFAULT 0,
  bangunan_awal_id uuid,
  bangunan_akhir_id uuid,
  geojson jsonb,
  foto_urls text[] DEFAULT ARRAY[]::text[],
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(saluran_id, no_ruas)
);

-- Create bangunan table
CREATE TABLE IF NOT EXISTS bangunan (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  daerah_irigasi_id uuid NOT NULL REFERENCES daerah_irigasi(id) ON DELETE CASCADE,
  saluran_id uuid REFERENCES saluran(id) ON DELETE SET NULL,
  nama text NOT NULL,
  nomenklatur text DEFAULT '',
  k_aset text DEFAULT '',
  n_aset text DEFAULT '',
  tipe text DEFAULT '',
  latitude numeric,
  longitude numeric,
  elevation numeric,
  urutan_di_saluran integer DEFAULT 0,
  foto_path text DEFAULT '',
  geojson jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create fungsional table
CREATE TABLE IF NOT EXISTS fungsional (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  daerah_irigasi_id uuid NOT NULL REFERENCES daerah_irigasi(id) ON DELETE CASCADE,
  nama_di text NOT NULL,
  luas_ha numeric DEFAULT 0,
  kecamatan text DEFAULT '',
  desa_kel text DEFAULT '',
  sumber_air text DEFAULT '',
  tahun_data text DEFAULT '',
  kondisi text DEFAULT '',
  panjang_sp numeric DEFAULT 0,
  panjang_ss numeric DEFAULT 0,
  geojson jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add foreign key constraints for ruas bangunan references
ALTER TABLE ruas 
  ADD CONSTRAINT fk_ruas_bangunan_awal 
  FOREIGN KEY (bangunan_awal_id) 
  REFERENCES bangunan(id) 
  ON DELETE SET NULL;

ALTER TABLE ruas 
  ADD CONSTRAINT fk_ruas_bangunan_akhir 
  FOREIGN KEY (bangunan_akhir_id) 
  REFERENCES bangunan(id) 
  ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_saluran_daerah_irigasi 
  ON saluran(daerah_irigasi_id);

CREATE INDEX IF NOT EXISTS idx_saluran_urutan 
  ON saluran(daerah_irigasi_id, urutan);

CREATE INDEX IF NOT EXISTS idx_ruas_saluran 
  ON ruas(saluran_id);

CREATE INDEX IF NOT EXISTS idx_ruas_urutan 
  ON ruas(saluran_id, urutan);

CREATE INDEX IF NOT EXISTS idx_bangunan_daerah_irigasi 
  ON bangunan(daerah_irigasi_id);

CREATE INDEX IF NOT EXISTS idx_bangunan_saluran 
  ON bangunan(saluran_id);

CREATE INDEX IF NOT EXISTS idx_bangunan_urutan 
  ON bangunan(saluran_id, urutan_di_saluran);

CREATE INDEX IF NOT EXISTS idx_fungsional_daerah_irigasi 
  ON fungsional(daerah_irigasi_id);

-- Enable Row Level Security
ALTER TABLE daerah_irigasi ENABLE ROW LEVEL SECURITY;
ALTER TABLE saluran ENABLE ROW LEVEL SECURITY;
ALTER TABLE ruas ENABLE ROW LEVEL SECURITY;
ALTER TABLE bangunan ENABLE ROW LEVEL SECURITY;
ALTER TABLE fungsional ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies for public read
CREATE POLICY IF NOT EXISTS "Public can view daerah_irigasi" 
  ON daerah_irigasi FOR SELECT 
  TO anon, authenticated 
  USING (true);

CREATE POLICY IF NOT EXISTS "Public can view saluran" 
  ON saluran FOR SELECT 
  TO anon, authenticated 
  USING (true);

CREATE POLICY IF NOT EXISTS "Public can view ruas" 
  ON ruas FOR SELECT 
  TO anon, authenticated 
  USING (true);

CREATE POLICY IF NOT EXISTS "Public can view bangunan" 
  ON bangunan FOR SELECT 
  TO anon, authenticated 
  USING (true);

CREATE POLICY IF NOT EXISTS "Public can view fungsional" 
  ON fungsional FOR SELECT 
  TO anon, authenticated 
  USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_daerah_irigasi_updated_at ON daerah_irigasi;
CREATE TRIGGER update_daerah_irigasi_updated_at
  BEFORE UPDATE ON daerah_irigasi
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_saluran_updated_at ON saluran;
CREATE TRIGGER update_saluran_updated_at
  BEFORE UPDATE ON saluran
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ruas_updated_at ON ruas;
CREATE TRIGGER update_ruas_updated_at
  BEFORE UPDATE ON ruas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bangunan_updated_at ON bangunan;
CREATE TRIGGER update_bangunan_updated_at
  BEFORE UPDATE ON bangunan
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_fungsional_updated_at ON fungsional;
CREATE TRIGGER update_fungsional_updated_at
  BEFORE UPDATE ON fungsional
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- MIGRATION 2: Update Policies and Schema
-- ============================================
-- File: 20251029120000_update_policies_and_schema.sql

-- Audit log table
CREATE TABLE IF NOT EXISTS audit_log (
  id bigserial PRIMARY KEY,
  table_name text NOT NULL,
  record_id uuid,
  action text NOT NULL,
  changed_by uuid,
  changed_at timestamptz NOT NULL DEFAULT now(),
  old_data jsonb,
  new_data jsonb
);

-- Audit trigger function
CREATE OR REPLACE FUNCTION audit_changes()
RETURNS trigger AS $$
DECLARE
  uid uuid;
BEGIN
  BEGIN
    uid := NULLIF((auth.uid())::text, '')::uuid;
  EXCEPTION WHEN others THEN
    uid := NULL;
  END;

  IF (TG_OP = 'INSERT') THEN
    INSERT INTO audit_log(table_name, record_id, action, changed_by, old_data, new_data)
    VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', uid, NULL, to_jsonb(NEW));
    RETURN NEW;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO audit_log(table_name, record_id, action, changed_by, old_data, new_data)
    VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', uid, to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    INSERT INTO audit_log(table_name, record_id, action, changed_by, old_data, new_data)
    VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', uid, to_jsonb(OLD), NULL);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach audit triggers
DROP TRIGGER IF EXISTS audit_daerah_irigasi_changes ON daerah_irigasi;
CREATE TRIGGER audit_daerah_irigasi_changes
AFTER INSERT OR UPDATE OR DELETE ON daerah_irigasi
FOR EACH ROW EXECUTE FUNCTION audit_changes();

DROP TRIGGER IF EXISTS audit_saluran_changes ON saluran;
CREATE TRIGGER audit_saluran_changes
AFTER INSERT OR UPDATE OR DELETE ON saluran
FOR EACH ROW EXECUTE FUNCTION audit_changes();

DROP TRIGGER IF EXISTS audit_ruas_changes ON ruas;
CREATE TRIGGER audit_ruas_changes
AFTER INSERT OR UPDATE OR DELETE ON ruas
FOR EACH ROW EXECUTE FUNCTION audit_changes();

DROP TRIGGER IF EXISTS audit_bangunan_changes ON bangunan;
CREATE TRIGGER audit_bangunan_changes
AFTER INSERT OR UPDATE OR DELETE ON bangunan
FOR EACH ROW EXECUTE FUNCTION audit_changes();

DROP TRIGGER IF EXISTS audit_fungsional_changes ON fungsional;
CREATE TRIGGER audit_fungsional_changes
AFTER INSERT OR UPDATE OR DELETE ON fungsional
FOR EACH ROW EXECUTE FUNCTION audit_changes();

-- Admin-only write policies
CREATE POLICY IF NOT EXISTS "Admins can modify daerah_irigasi" 
  ON daerah_irigasi
  FOR INSERT TO authenticated 
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY IF NOT EXISTS "Admins can update daerah_irigasi" 
  ON daerah_irigasi
  FOR UPDATE TO authenticated 
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin') 
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY IF NOT EXISTS "Admins can delete daerah_irigasi" 
  ON daerah_irigasi
  FOR DELETE TO authenticated 
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY IF NOT EXISTS "Admins can modify saluran" 
  ON saluran
  FOR INSERT TO authenticated 
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY IF NOT EXISTS "Admins can update saluran" 
  ON saluran
  FOR UPDATE TO authenticated 
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin') 
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY IF NOT EXISTS "Admins can delete saluran" 
  ON saluran
  FOR DELETE TO authenticated 
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY IF NOT EXISTS "Admins can modify ruas" 
  ON ruas
  FOR INSERT TO authenticated 
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY IF NOT EXISTS "Admins can update ruas" 
  ON ruas
  FOR UPDATE TO authenticated 
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin') 
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY IF NOT EXISTS "Admins can delete ruas" 
  ON ruas
  FOR DELETE TO authenticated 
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY IF NOT EXISTS "Admins can modify bangunan" 
  ON bangunan
  FOR INSERT TO authenticated 
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY IF NOT EXISTS "Admins can update bangunan" 
  ON bangunan
  FOR UPDATE TO authenticated 
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin') 
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY IF NOT EXISTS "Admins can delete bangunan" 
  ON bangunan
  FOR DELETE TO authenticated 
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY IF NOT EXISTS "Admins can modify fungsional" 
  ON fungsional
  FOR INSERT TO authenticated 
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY IF NOT EXISTS "Admins can update fungsional" 
  ON fungsional
  FOR UPDATE TO authenticated 
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin') 
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY IF NOT EXISTS "Admins can delete fungsional" 
  ON fungsional
  FOR DELETE TO authenticated 
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- ============================================
-- MIGRATION 3: Enable Roles
-- ============================================
-- File: 20251103100000_enable_roles.sql

-- Ensure setiap user baru otomatis mendapatkan role "user"
CREATE OR REPLACE FUNCTION auth.set_default_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public, extensions
AS $$
BEGIN
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

DROP TRIGGER IF EXISTS set_default_user_role ON auth.users;
CREATE TRIGGER set_default_user_role
BEFORE INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION auth.set_default_user_role();

-- Pastikan seluruh user yang ada memiliki role, default user
UPDATE auth.users
SET raw_app_meta_data = jsonb_set(coalesce(raw_app_meta_data, '{}'::jsonb), '{role}', to_jsonb('user'::text), true),
    raw_user_meta_data = jsonb_set(coalesce(raw_user_meta_data, '{}'::jsonb), '{role}', to_jsonb('user'::text), true)
WHERE coalesce(raw_app_meta_data ->> 'role', '') = '';

-- Tetapkan admin awal
UPDATE auth.users
SET raw_app_meta_data = jsonb_set(coalesce(raw_app_meta_data, '{}'::jsonb), '{role}', to_jsonb('admin'::text), true),
    raw_user_meta_data = jsonb_set(coalesce(raw_user_meta_data, '{}'::jsonb), '{role}', to_jsonb('admin'::text), true)
WHERE email = 'borizzzlaia@gmail.com';

-- ============================================
-- MIGRATION 4: Storage Policies
-- ============================================
-- File: 20251104121500_storage_policies.sql

-- Allow public/ authenticated read akses untuk bucket tertentu
CREATE POLICY IF NOT EXISTS "Public read irrigation storage"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id in ('geojson', 'csv', 'images'));

-- Izinkan admin (role di JWT) melakukan upload/update/delete
CREATE POLICY IF NOT EXISTS "Admins manage irrigation storage"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id in ('geojson', 'csv', 'images')
    and coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
  );

CREATE POLICY IF NOT EXISTS "Admins update irrigation storage"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id in ('geojson', 'csv', 'images')
    and coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
  )
  WITH CHECK (
    bucket_id in ('geojson', 'csv', 'images')
    and coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
  );

CREATE POLICY IF NOT EXISTS "Admins delete irrigation storage"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id in ('geojson', 'csv', 'images')
    and coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
  );

-- ============================================
-- MIGRATION 5: Add Missing daerah_irigasi_id
-- ============================================
-- File: 20251114103000_add_missing_daerah_irigasi_id.sql

-- Ensure pgcrypto is available for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Add the id column when it is missing
ALTER TABLE public.daerah_irigasi
  ADD COLUMN IF NOT EXISTS id uuid;

-- Guarantee every row gets a UUID by default
ALTER TABLE public.daerah_irigasi
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Backfill any existing NULL values (older rows)
UPDATE public.daerah_irigasi
SET id = gen_random_uuid()
WHERE id IS NULL;

-- Disallow NULL going forward
ALTER TABLE public.daerah_irigasi
  ALTER COLUMN id SET NOT NULL;

-- Ensure the id column can be safely referenced by foreign keys
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY (c.conkey)
    WHERE c.conrelid = 'public.daerah_irigasi'::regclass
      AND c.contype IN ('p', 'u')
      AND array_length(c.conkey, 1) = 1
      AND a.attname = 'id'
  ) THEN
    ALTER TABLE public.daerah_irigasi
      ADD CONSTRAINT daerah_irigasi_id_key UNIQUE (id);
  END IF;
END $$;

-- ============================================
-- MIGRATION 6: Add kode_irigasi Alias
-- ============================================
-- File: 20251114104500_add_kode_irigasi_alias.sql

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'daerah_irigasi'
      AND column_name = 'kode_irigasi'
  ) THEN
    ALTER TABLE public.daerah_irigasi
      ADD COLUMN kode_irigasi text GENERATED ALWAYS AS (k_di) STORED;
  END IF;
END $$;

-- Jaga supaya alias juga unik seperti k_di
CREATE UNIQUE INDEX IF NOT EXISTS daerah_irigasi_kode_irigasi_key
  ON public.daerah_irigasi(kode_irigasi);

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Cek tabel yang dibuat
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Cek policies
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
