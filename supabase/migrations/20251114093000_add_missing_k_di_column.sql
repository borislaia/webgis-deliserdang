-- Ensure kolom k_di tersedia untuk tabel daerah_irigasi dan berisi nilai unik.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
DECLARE
  table_exists boolean;
  has_kdi boolean;
  source_col text;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'daerah_irigasi'
  ) INTO table_exists;

  IF NOT table_exists THEN
    RAISE NOTICE 'Table public.daerah_irigasi tidak ditemukan, lewati migrasi.';
    RETURN;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'daerah_irigasi'
      AND column_name = 'k_di'
  ) INTO has_kdi;

  IF NOT has_kdi THEN
    EXECUTE '
      ALTER TABLE public.daerah_irigasi
      ADD COLUMN k_di text
    ';

    WITH sources AS (
      SELECT column_name, priority
      FROM (VALUES
        ('kode_di', 1),
        ('kode_daerah_irigasi', 2),
        ('kode_irigasi', 3),
        ('kode', 4)
      ) AS v(column_name, priority)
    )
    SELECT s.column_name
    INTO source_col
    FROM information_schema.columns c
    JOIN sources s ON s.column_name = c.column_name
    WHERE c.table_schema = 'public'
      AND c.table_name = 'daerah_irigasi'
    ORDER BY s.priority
    LIMIT 1;

    IF source_col IS NOT NULL THEN
      EXECUTE format(
        'UPDATE public.daerah_irigasi SET k_di = NULLIF(BTRIM(%I::text), '''') WHERE k_di IS NULL',
        source_col
      );
    END IF;

    EXECUTE '
      WITH missing AS (
        SELECT id, ROW_NUMBER() OVER (ORDER BY COALESCE(n_di, id::text)) AS rn
        FROM public.daerah_irigasi
        WHERE k_di IS NULL OR k_di = ''''
      )
      UPDATE public.daerah_irigasi di
      SET k_di = CONCAT(''AUTO-'', LPAD(m.rn::text, 4, ''0''))
      FROM missing m
      WHERE di.id = m.id
    ';
  ELSE
    EXECUTE '
      UPDATE public.daerah_irigasi
      SET k_di = NULLIF(BTRIM(k_di), '''')
      WHERE k_di IS DISTINCT FROM NULLIF(BTRIM(k_di), '''')
    ';
  END IF;

  EXECUTE '
    WITH duplicates AS (
      SELECT id, k_di, ROW_NUMBER() OVER (PARTITION BY k_di ORDER BY id) AS rn
      FROM public.daerah_irigasi
      WHERE k_di IS NOT NULL AND k_di <> ''''
    )
    UPDATE public.daerah_irigasi di
    SET k_di = CONCAT(k_di, ''-'', rn)
    FROM duplicates d
    WHERE di.id = d.id AND d.rn > 1
  ';

  EXECUTE '
    ALTER TABLE public.daerah_irigasi
      ALTER COLUMN k_di SET NOT NULL
  ';

  EXECUTE '
    ALTER TABLE public.daerah_irigasi
      ADD CONSTRAINT IF NOT EXISTS daerah_irigasi_k_di_key UNIQUE (k_di)
  ';
END $$;
