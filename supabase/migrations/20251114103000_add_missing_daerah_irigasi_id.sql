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
