/*
  # Sistem Manajemen Irigasi Deli Serdang
  
  ## Deskripsi
  Database schema untuk mengelola data irigasi termasuk daerah irigasi, saluran, ruas, 
  bangunan, dan data fungsional. Sistem ini mendukung:
  - Pemotongan saluran otomatis dari hulu ke hilir berdasarkan bangunan
  - Penomoran otomatis untuk saluran dan ruas per daerah irigasi
  - Import data umum dari Excel
  - Perhitungan statistik dari file geojson
  
  ## Tabel Baru
  
  1. **daerah_irigasi**
     - id (uuid, primary key)
     - k_di (kode daerah irigasi, unique)
     - n_di (nama daerah irigasi)
     - luas_ha (luas dalam hektar)
     - kecamatan
     - desa_kel
     - sumber_air
     - tahun_data
     - kondisi
     - panjang_sp (panjang saluran primer total)
     - panjang_ss (panjang saluran sekunder total)
     - jumlah_saluran (total saluran)
     - jumlah_bangunan (total bangunan)
     - created_at, updated_at
  
  2. **saluran**
     - id (uuid, primary key)
     - daerah_irigasi_id (foreign key ke daerah_irigasi)
     - no_saluran (nomor saluran, format: SAL001, reset per DI)
     - nama (nama saluran)
     - nomenklatur (nomenklatur saluran)
     - jenis (primer/sekunder/tersier)
     - panjang_total (panjang total saluran dalam meter)
     - luas_layanan (luas area yang dilayani)
     - urutan (urutan dari hulu ke hilir)
     - geojson (data geometri)
     - created_at, updated_at
  
  3. **ruas**
     - id (uuid, primary key)
     - saluran_id (foreign key ke saluran)
     - no_ruas (nomor ruas, format: Ruas - 1, reset per saluran)
     - urutan (urutan dari hulu ke hilir)
     - panjang (panjang ruas dalam meter)
     - bangunan_awal_id (bangunan di awal ruas)
     - bangunan_akhir_id (bangunan di akhir ruas)
     - geojson (data geometri)
     - created_at, updated_at
  
  4. **bangunan**
     - id (uuid, primary key)
     - daerah_irigasi_id (foreign key ke daerah_irigasi)
     - saluran_id (foreign key ke saluran, nullable)
     - nama (nama bangunan)
     - nomenklatur (nomenklatur bangunan)
     - k_aset (kode aset)
     - n_aset (nama aset)
     - tipe (bendung/bagi/sadap/gorong-gorong/dll)
     - latitude
     - longitude
     - elevation
     - urutan_di_saluran (urutan di saluran dari hulu ke hilir)
     - foto_path (path ke foto bangunan)
     - geojson (data geometri point)
     - created_at, updated_at
  
  5. **fungsional**
     - id (uuid, primary key)
     - daerah_irigasi_id (foreign key ke daerah_irigasi)
     - nama_di (nama daerah irigasi)
     - luas_ha (luas dalam hektar)
     - kecamatan
     - desa_kel
     - sumber_air
     - tahun_data
     - kondisi
     - panjang_sp (panjang saluran primer)
     - panjang_ss (panjang saluran sekunder)
     - geojson (data geometri polygon)
     - created_at, updated_at
  
  ## Security
  - RLS diaktifkan untuk semua tabel
  - Policy untuk authenticated users untuk read/write
  - Policy khusus untuk admin (future implementation)
  
  ## Indexes
  - Index pada foreign keys untuk performa
  - Index pada kode dan nomor untuk pencarian cepat
*/

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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

-- Create RLS Policies for authenticated users

-- daerah_irigasi policies
CREATE POLICY "Authenticated users can view daerah_irigasi"
  ON daerah_irigasi FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert daerah_irigasi"
  ON daerah_irigasi FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update daerah_irigasi"
  ON daerah_irigasi FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete daerah_irigasi"
  ON daerah_irigasi FOR DELETE
  TO authenticated
  USING (true);

-- saluran policies
CREATE POLICY "Authenticated users can view saluran"
  ON saluran FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert saluran"
  ON saluran FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update saluran"
  ON saluran FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete saluran"
  ON saluran FOR DELETE
  TO authenticated
  USING (true);

-- ruas policies
CREATE POLICY "Authenticated users can view ruas"
  ON ruas FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert ruas"
  ON ruas FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update ruas"
  ON ruas FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete ruas"
  ON ruas FOR DELETE
  TO authenticated
  USING (true);

-- bangunan policies
CREATE POLICY "Authenticated users can view bangunan"
  ON bangunan FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert bangunan"
  ON bangunan FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update bangunan"
  ON bangunan FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete bangunan"
  ON bangunan FOR DELETE
  TO authenticated
  USING (true);

-- fungsional policies
CREATE POLICY "Authenticated users can view fungsional"
  ON fungsional FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert fungsional"
  ON fungsional FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update fungsional"
  ON fungsional FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete fungsional"
  ON fungsional FOR DELETE
  TO authenticated
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
CREATE TRIGGER update_daerah_irigasi_updated_at
  BEFORE UPDATE ON daerah_irigasi
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_saluran_updated_at
  BEFORE UPDATE ON saluran
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ruas_updated_at
  BEFORE UPDATE ON ruas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bangunan_updated_at
  BEFORE UPDATE ON bangunan
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fungsional_updated_at
  BEFORE UPDATE ON fungsional
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();