-- Ensure setiap record daerah_irigasi memiliki kolom id (UUID) untuk relasi modern.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'daerah_irigasi'
  ) THEN
    RAISE NOTICE 'Table public.daerah_irigasi tidak ditemukan, lewati migrasi.';
    RETURN;
  END IF;

  -- Tambahkan kolom id bila belum tersedia.
  EXECUTE '
    ALTER TABLE public.daerah_irigasi
    ADD COLUMN IF NOT EXISTS id uuid
  ';

  -- Pastikan seluruh baris memiliki nilai id.
  EXECUTE '
    UPDATE public.daerah_irigasi
    SET id = gen_random_uuid()
    WHERE id IS NULL
  ';

  -- Terapkan default dan NOT NULL sehingga insert berikutnya otomatis memiliki UUID.
  EXECUTE '
    ALTER TABLE public.daerah_irigasi
      ALTER COLUMN id SET DEFAULT gen_random_uuid()
  ';

  EXECUTE '
    ALTER TABLE public.daerah_irigasi
      ALTER COLUMN id SET NOT NULL
  ';

  -- Yakinkan terdapat constraint unik/primary pada kolom id.
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint con
    JOIN unnest(con.conkey) WITH ORDINALITY AS cols(attnum, ord) ON TRUE
    JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = cols.attnum
    WHERE con.conrelid = 'public.daerah_irigasi'::regclass
      AND con.contype IN ('p', 'u')
      AND att.attname = 'id'
  ) THEN
    EXECUTE '
      ALTER TABLE public.daerah_irigasi
        ADD CONSTRAINT daerah_irigasi_id_key UNIQUE (id)
    ';
  END IF;
END $$;
