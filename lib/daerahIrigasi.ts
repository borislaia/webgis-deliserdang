import { PostgrestError, SupabaseClient } from '@supabase/supabase-js';

export type DaerahIrigasiRow = {
  id: string;
  k_di: string | null;
  n_di: string | null;
  luas_ha: number | null;
  kecamatan: string | null;
  desa_kel: string | null;
  sumber_air: string | null;
  tahun_data: string | null;
  kondisi?: string | null;
  metadata?: Record<string, any> | null;
};

const CODE_COLUMN_CANDIDATES = [
  { column: 'k_di', select: 'k_di' },
  { column: 'kode_irigasi', select: 'k_di:kode_irigasi' },
  { column: 'kode_di', select: 'k_di:kode_di' },
  { column: 'kode_di_irigasi', select: 'k_di:kode_di_irigasi' },
  { column: 'kode_daerah_irigasi', select: 'k_di:kode_daerah_irigasi' },
  { column: 'kdi', select: 'k_di:kdi' },
  { column: 'kode', select: 'k_di:kode' },
] as const;

type CodeColumnCandidate = (typeof CODE_COLUMN_CANDIDATES)[number];

const DEFAULT_LIST_FIELDS = ['n_di', 'luas_ha', 'kecamatan', 'desa_kel', 'sumber_air', 'tahun_data'];
const DETAIL_EXTRA_FIELDS = ['kondisi', 'metadata'];

type FetchListOptions = {
  limit?: number;
  orderByCode?: boolean;
  fields?: string[];
};

type FetchByCodeOptions = {
  fields?: string[];
};

export async function fetchDaerahIrigasiList(
  supabase: SupabaseClient,
  options?: FetchListOptions,
): Promise<DaerahIrigasiRow[]> {
  const { limit, orderByCode = true, fields = DEFAULT_LIST_FIELDS } = options || {};
  for (const candidate of CODE_COLUMN_CANDIDATES) {
    let query = supabase.from('daerah_irigasi').select(buildSelectClause(candidate, fields));
    if (typeof limit === 'number') {
      query = query.limit(limit);
    }
    if (orderByCode) {
      query = query.order(candidate.column, { ascending: true });
    }
    const { data, error } = await query;
    if (!error) {
      return (data ?? []) as DaerahIrigasiRow[];
    }
    if (!isUndefinedColumnError(error, candidate.column)) {
      throw error;
    }
  }
  throw new Error(missingColumnMessage());
}

export async function fetchDaerahIrigasiByCode(
  supabase: SupabaseClient,
  code: string,
  options?: FetchByCodeOptions,
): Promise<DaerahIrigasiRow | null> {
  const { fields = [...DEFAULT_LIST_FIELDS, ...DETAIL_EXTRA_FIELDS] } = options || {};
  for (const candidate of CODE_COLUMN_CANDIDATES) {
    const { data, error } = await supabase
      .from('daerah_irigasi')
      .select(buildSelectClause(candidate, fields))
      .eq(candidate.column, code)
      .maybeSingle();
    if (!error) {
      return (data as DaerahIrigasiRow) ?? null;
    }
    if (!isUndefinedColumnError(error, candidate.column)) {
      throw error;
    }
  }
  throw new Error(missingColumnMessage());
}

function buildSelectClause(candidate: CodeColumnCandidate, fields: string[]) {
  const dedupedFields = Array.from(new Set(fields.filter(Boolean)));
  return ['id', candidate.select, ...dedupedFields].join(',');
}

function isUndefinedColumnError(error: PostgrestError | null, column: string) {
  if (!error) return false;
  if (error.code === '42703') return true;
  const haystack = [error.message, error.details, error.hint].filter(Boolean).join(' ').toLowerCase();
  return haystack.includes(column.toLowerCase());
}

function missingColumnMessage() {
  const columns = CODE_COLUMN_CANDIDATES.map((c) => c.column).join(', ');
  return `Kolom kode daerah irigasi tidak ditemukan. Pastikan salah satu kolom berikut tersedia: ${columns}`;
}
