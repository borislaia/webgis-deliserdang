// Database configuration
// Uncomment dan sesuaikan jika menggunakan database

/*
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

export default pool;
*/

// Sementara gunakan data dummy
export const dummyData = {
  kecamatan: [],
  irigasi: [],
  sda: [],
  bencana: [],
  infrastruktur: []
};
