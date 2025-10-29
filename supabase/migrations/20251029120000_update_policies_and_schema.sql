-- Update policies to enforce admin-only writes and public reads

-- 1) Add foto_urls to ruas
ALTER TABLE IF EXISTS ruas
  ADD COLUMN IF NOT EXISTS foto_urls text[] DEFAULT ARRAY[]::text[];

-- 2) Audit log table
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

-- 3) Audit trigger function
CREATE OR REPLACE FUNCTION audit_changes()
RETURNS trigger AS $$
DECLARE
  uid uuid;
BEGIN
  BEGIN
    uid := NULLIF((auth.uid())::text, '')::uuid; -- auth.uid() may be null for service role
  EXCEPTION WHEN others THEN
    uid := NULL; -- fallback
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

-- 4) Attach triggers (idempotent creation pattern)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'audit_daerah_irigasi_changes'
  ) THEN
    CREATE TRIGGER audit_daerah_irigasi_changes
    AFTER INSERT OR UPDATE OR DELETE ON daerah_irigasi
    FOR EACH ROW EXECUTE FUNCTION audit_changes();
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'audit_saluran_changes'
  ) THEN
    CREATE TRIGGER audit_saluran_changes
    AFTER INSERT OR UPDATE OR DELETE ON saluran
    FOR EACH ROW EXECUTE FUNCTION audit_changes();
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'audit_ruas_changes'
  ) THEN
    CREATE TRIGGER audit_ruas_changes
    AFTER INSERT OR UPDATE OR DELETE ON ruas
    FOR EACH ROW EXECUTE FUNCTION audit_changes();
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'audit_bangunan_changes'
  ) THEN
    CREATE TRIGGER audit_bangunan_changes
    AFTER INSERT OR UPDATE OR DELETE ON bangunan
    FOR EACH ROW EXECUTE FUNCTION audit_changes();
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'audit_fungsional_changes'
  ) THEN
    CREATE TRIGGER audit_fungsional_changes
    AFTER INSERT OR UPDATE OR DELETE ON fungsional
    FOR EACH ROW EXECUTE FUNCTION audit_changes();
  END IF;
END $$;

-- 5) Replace permissive write policies with admin-only writes
-- Drop existing write policies if present
DO $$ BEGIN
  -- daerah_irigasi
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = current_schema() AND tablename = 'daerah_irigasi' AND policyname = 'Authenticated users can insert daerah_irigasi') THEN
    DROP POLICY "Authenticated users can insert daerah_irigasi" ON daerah_irigasi;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = current_schema() AND tablename = 'daerah_irigasi' AND policyname = 'Authenticated users can update daerah_irigasi') THEN
    DROP POLICY "Authenticated users can update daerah_irigasi" ON daerah_irigasi;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = current_schema() AND tablename = 'daerah_irigasi' AND policyname = 'Authenticated users can delete daerah_irigasi') THEN
    DROP POLICY "Authenticated users can delete daerah_irigasi" ON daerah_irigasi;
  END IF;

  -- saluran
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = current_schema() AND tablename = 'saluran' AND policyname = 'Authenticated users can insert saluran') THEN
    DROP POLICY "Authenticated users can insert saluran" ON saluran;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = current_schema() AND tablename = 'saluran' AND policyname = 'Authenticated users can update saluran') THEN
    DROP POLICY "Authenticated users can update saluran" ON saluran;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = current_schema() AND tablename = 'saluran' AND policyname = 'Authenticated users can delete saluran') THEN
    DROP POLICY "Authenticated users can delete saluran" ON saluran;
  END IF;

  -- ruas
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = current_schema() AND tablename = 'ruas' AND policyname = 'Authenticated users can insert ruas') THEN
    DROP POLICY "Authenticated users can insert ruas" ON ruas;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = current_schema() AND tablename = 'ruas' AND policyname = 'Authenticated users can update ruas') THEN
    DROP POLICY "Authenticated users can update ruas" ON ruas;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = current_schema() AND tablename = 'ruas' AND policyname = 'Authenticated users can delete ruas') THEN
    DROP POLICY "Authenticated users can delete ruas" ON ruas;
  END IF;

  -- bangunan
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = current_schema() AND tablename = 'bangunan' AND policyname = 'Authenticated users can insert bangunan') THEN
    DROP POLICY "Authenticated users can insert bangunan" ON bangunan;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = current_schema() AND tablename = 'bangunan' AND policyname = 'Authenticated users can update bangunan') THEN
    DROP POLICY "Authenticated users can update bangunan" ON bangunan;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = current_schema() AND tablename = 'bangunan' AND policyname = 'Authenticated users can delete bangunan') THEN
    DROP POLICY "Authenticated users can delete bangunan" ON bangunan;
  END IF;

  -- fungsional
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = current_schema() AND tablename = 'fungsional' AND policyname = 'Authenticated users can insert fungsional') THEN
    DROP POLICY "Authenticated users can insert fungsional" ON fungsional;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = current_schema() AND tablename = 'fungsional' AND policyname = 'Authenticated users can update fungsional') THEN
    DROP POLICY "Authenticated users can update fungsional" ON fungsional;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = current_schema() AND tablename = 'fungsional' AND policyname = 'Authenticated users can delete fungsional') THEN
    DROP POLICY "Authenticated users can delete fungsional" ON fungsional;
  END IF;
END $$;

-- 6) Read policies (public read)
DO $$ BEGIN
  -- daerah_irigasi select
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = current_schema() AND tablename = 'daerah_irigasi' AND policyname = 'Public can view daerah_irigasi') THEN
    CREATE POLICY "Public can view daerah_irigasi" ON daerah_irigasi FOR SELECT TO anon, authenticated USING (true);
  END IF;
  -- saluran select
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = current_schema() AND tablename = 'saluran' AND policyname = 'Public can view saluran') THEN
    CREATE POLICY "Public can view saluran" ON saluran FOR SELECT TO anon, authenticated USING (true);
  END IF;
  -- ruas select
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = current_schema() AND tablename = 'ruas' AND policyname = 'Public can view ruas') THEN
    CREATE POLICY "Public can view ruas" ON ruas FOR SELECT TO anon, authenticated USING (true);
  END IF;
  -- bangunan select
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = current_schema() AND tablename = 'bangunan' AND policyname = 'Public can view bangunan') THEN
    CREATE POLICY "Public can view bangunan" ON bangunan FOR SELECT TO anon, authenticated USING (true);
  END IF;
  -- fungsional select
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = current_schema() AND tablename = 'fungsional' AND policyname = 'Public can view fungsional') THEN
    CREATE POLICY "Public can view fungsional" ON fungsional FOR SELECT TO anon, authenticated USING (true);
  END IF;
END $$;

-- 7) Admin-only write policies
DO $$ BEGIN
  -- helper expression: role=admin
  -- We cannot create a DB-level constant, use inline in each policy

  -- daerah_irigasi write
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = current_schema() AND tablename = 'daerah_irigasi' AND policyname = 'Admins can modify daerah_irigasi') THEN
    CREATE POLICY "Admins can modify daerah_irigasi" ON daerah_irigasi
      FOR INSERT TO authenticated WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
    CREATE POLICY "Admins can update daerah_irigasi" ON daerah_irigasi
      FOR UPDATE TO authenticated USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin') WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
    CREATE POLICY "Admins can delete daerah_irigasi" ON daerah_irigasi
      FOR DELETE TO authenticated USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
  END IF;

  -- saluran write
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = current_schema() AND tablename = 'saluran' AND policyname = 'Admins can modify saluran') THEN
    CREATE POLICY "Admins can modify saluran" ON saluran
      FOR INSERT TO authenticated WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
    CREATE POLICY "Admins can update saluran" ON saluran
      FOR UPDATE TO authenticated USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin') WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
    CREATE POLICY "Admins can delete saluran" ON saluran
      FOR DELETE TO authenticated USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
  END IF;

  -- ruas write
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = current_schema() AND tablename = 'ruas' AND policyname = 'Admins can modify ruas') THEN
    CREATE POLICY "Admins can modify ruas" ON ruas
      FOR INSERT TO authenticated WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
    CREATE POLICY "Admins can update ruas" ON ruas
      FOR UPDATE TO authenticated USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin') WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
    CREATE POLICY "Admins can delete ruas" ON ruas
      FOR DELETE TO authenticated USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
  END IF;

  -- bangunan write
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = current_schema() AND tablename = 'bangunan' AND policyname = 'Admins can modify bangunan') THEN
    CREATE POLICY "Admins can modify bangunan" ON bangunan
      FOR INSERT TO authenticated WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
    CREATE POLICY "Admins can update bangunan" ON bangunan
      FOR UPDATE TO authenticated USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin') WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
    CREATE POLICY "Admins can delete bangunan" ON bangunan
      FOR DELETE TO authenticated USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
  END IF;

  -- fungsional write
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = current_schema() AND tablename = 'fungsional' AND policyname = 'Admins can modify fungsional') THEN
    CREATE POLICY "Admins can modify fungsional" ON fungsional
      FOR INSERT TO authenticated WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
    CREATE POLICY "Admins can update fungsional" ON fungsional
      FOR UPDATE TO authenticated USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin') WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
    CREATE POLICY "Admins can delete fungsional" ON fungsional
      FOR DELETE TO authenticated USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
  END IF;
END $$;
