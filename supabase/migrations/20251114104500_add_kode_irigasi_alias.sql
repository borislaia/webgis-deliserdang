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
