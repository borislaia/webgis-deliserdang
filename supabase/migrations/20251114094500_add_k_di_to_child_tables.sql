-- Tambah kolom k_di pada tabel turunan untuk memastikan relasi berbasis kode irigasi selalu tersedia.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
BEGIN
  -- SALURAN
  EXECUTE '
    ALTER TABLE public.saluran
    ADD COLUMN IF NOT EXISTS k_di text
  ';

  EXECUTE '
    UPDATE public.saluran s
    SET k_di = NULLIF(TRIM(di.k_di), '''')
    FROM public.daerah_irigasi di
    WHERE (s.k_di IS NULL OR s.k_di = '''')
      AND di.id = s.daerah_irigasi_id
  ';

  EXECUTE '
    UPDATE public.saluran
    SET k_di = COALESCE(
      NULLIF(TRIM(metadata ->> ''k_di''), ''''),
      NULLIF(TRIM(geojson #>> ''{features,0,properties,k_di}''), ''''),
      k_di
    )
    WHERE k_di IS NULL OR k_di = ''''
  ';

  EXECUTE '
    WITH missing AS (
      SELECT id, ROW_NUMBER() OVER (ORDER BY COALESCE(no_saluran, id::text)) AS rn
      FROM public.saluran
      WHERE k_di IS NULL OR k_di = ''''
    )
    UPDATE public.saluran s
    SET k_di = CONCAT(''AUTO-KDI-'', LPAD(m.rn::text, 6, ''0''))
    FROM missing m
    WHERE s.id = m.id
  ';

  EXECUTE '
    ALTER TABLE public.saluran
      ALTER COLUMN k_di SET NOT NULL
  ';

  EXECUTE '
    CREATE INDEX IF NOT EXISTS idx_saluran_k_di ON public.saluran(k_di)
  ';

  EXECUTE '
    DO $inner$
    BEGIN
      BEGIN
        ALTER TABLE public.saluran
          ADD CONSTRAINT saluran_k_di_fkey
          FOREIGN KEY (k_di) REFERENCES public.daerah_irigasi(k_di)
          ON DELETE CASCADE;
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END;
    END
    $inner$;
  ';

  EXECUTE '
    DO $inner$
    BEGIN
      BEGIN
        ALTER TABLE public.saluran
          ADD CONSTRAINT saluran_k_di_no_saluran_key UNIQUE (k_di, no_saluran);
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END;
    END
    $inner$;
  ';

  -- BANGUNAN
  EXECUTE '
    ALTER TABLE public.bangunan
    ADD COLUMN IF NOT EXISTS k_di text
  ';

  EXECUTE '
    UPDATE public.bangunan b
    SET k_di = NULLIF(TRIM(di.k_di), '''')
    FROM public.daerah_irigasi di
    WHERE (b.k_di IS NULL OR b.k_di = '''')
      AND di.id = b.daerah_irigasi_id
  ';

  EXECUTE '
    UPDATE public.bangunan
    SET k_di = COALESCE(
      NULLIF(TRIM(metadata ->> ''k_di''), ''''),
      NULLIF(TRIM(geojson -> ''properties'' ->> ''k_di''), ''''),
      k_di
    )
    WHERE k_di IS NULL OR k_di = ''''
  ';

  EXECUTE '
    WITH missing AS (
      SELECT id, ROW_NUMBER() OVER (ORDER BY COALESCE(nama, id::text)) AS rn
      FROM public.bangunan
      WHERE k_di IS NULL OR k_di = ''''
    )
    UPDATE public.bangunan b
    SET k_di = CONCAT(''AUTO-KDI-BNG-'', LPAD(m.rn::text, 6, ''0''))
    FROM missing m
    WHERE b.id = m.id
  ';

  EXECUTE '
    ALTER TABLE public.bangunan
      ALTER COLUMN k_di SET NOT NULL
  ';

  EXECUTE '
    CREATE INDEX IF NOT EXISTS idx_bangunan_k_di ON public.bangunan(k_di)
  ';

  EXECUTE '
    DO $inner$
    BEGIN
      BEGIN
        ALTER TABLE public.bangunan
          ADD CONSTRAINT bangunan_k_di_fkey
          FOREIGN KEY (k_di) REFERENCES public.daerah_irigasi(k_di)
          ON DELETE CASCADE;
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END;
    END
    $inner$;
  ';

  -- FUNGSIONAL
  EXECUTE '
    ALTER TABLE public.fungsional
    ADD COLUMN IF NOT EXISTS k_di text
  ';

  EXECUTE '
    UPDATE public.fungsional f
    SET k_di = NULLIF(TRIM(di.k_di), '''')
    FROM public.daerah_irigasi di
    WHERE (f.k_di IS NULL OR f.k_di = '''')
      AND di.id = f.daerah_irigasi_id
  ';

  EXECUTE '
    UPDATE public.fungsional
    SET k_di = COALESCE(
      NULLIF(TRIM(geojson -> ''properties'' ->> ''k_di''), ''''),
      NULLIF(TRIM(metadata ->> ''k_di''), ''''),
      k_di
    )
    WHERE k_di IS NULL OR k_di = ''''
  ';

  EXECUTE '
    WITH missing AS (
      SELECT id, ROW_NUMBER() OVER (ORDER BY COALESCE(nama_di, id::text)) AS rn
      FROM public.fungsional
      WHERE k_di IS NULL OR k_di = ''''
    )
    UPDATE public.fungsional f
    SET k_di = CONCAT(''AUTO-KDI-FNG-'', LPAD(m.rn::text, 6, ''0''))
    FROM missing m
    WHERE f.id = m.id
  ';

  EXECUTE '
    ALTER TABLE public.fungsional
      ALTER COLUMN k_di SET NOT NULL
  ';

  EXECUTE '
    CREATE INDEX IF NOT EXISTS idx_fungsional_k_di ON public.fungsional(k_di)
  ';

  EXECUTE '
    DO $inner$
    BEGIN
      BEGIN
        ALTER TABLE public.fungsional
          ADD CONSTRAINT fungsional_k_di_fkey
          FOREIGN KEY (k_di) REFERENCES public.daerah_irigasi(k_di)
          ON DELETE CASCADE;
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END;
    END
    $inner$;
  ';

  -- RUAS
  EXECUTE '
    ALTER TABLE public.ruas
    ADD COLUMN IF NOT EXISTS k_di text
  ';

  EXECUTE '
    UPDATE public.ruas r
    SET k_di = s.k_di
    FROM public.saluran s
    WHERE (r.k_di IS NULL OR r.k_di = '''')
      AND s.id = r.saluran_id
  ';

  EXECUTE '
    WITH missing AS (
      SELECT id, ROW_NUMBER() OVER (ORDER BY COALESCE(no_ruas, id::text)) AS rn
      FROM public.ruas
      WHERE k_di IS NULL OR k_di = ''''
    )
    UPDATE public.ruas r
    SET k_di = CONCAT(''AUTO-KDI-RS-'', LPAD(m.rn::text, 6, ''0''))
    FROM missing m
    WHERE r.id = m.id
  ';

  EXECUTE '
    ALTER TABLE public.ruas
      ALTER COLUMN k_di SET NOT NULL
  ';

  EXECUTE '
    CREATE INDEX IF NOT EXISTS idx_ruas_k_di ON public.ruas(k_di)
  ';

  EXECUTE '
    DO $inner$
    BEGIN
      BEGIN
        ALTER TABLE public.ruas
          ADD CONSTRAINT ruas_k_di_fkey
          FOREIGN KEY (k_di) REFERENCES public.daerah_irigasi(k_di)
          ON DELETE CASCADE;
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END;
    END
    $inner$;
  ';
END $$;
