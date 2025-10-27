import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = import.meta.env?.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY || '';

let supabase;
if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// Tab switching
window.switchTab = function(tabName) {
  document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

  event.target.classList.add('active');
  document.getElementById(`${tabName}-tab`).classList.add('active');

  if (tabName === 'overview') {
    loadDaerahIrigasi();
  } else if (tabName === 'saluran') {
    loadSaluran();
  } else if (tabName === 'ruas') {
    loadRuas();
  } else if (tabName === 'bangunan') {
    loadBangunan();
  }
};

// Show message
function showMessage(message, type = 'success') {
  const messageDiv = document.getElementById('message');
  messageDiv.className = type;
  messageDiv.textContent = message;
  messageDiv.style.display = 'block';

  setTimeout(() => {
    messageDiv.style.display = 'none';
  }, 5000);
}

// Load statistics
async function loadStatistics() {
  if (!supabase) return;

  try {
    const { data: diData, error: diError } = await supabase
      .from('daerah_irigasi')
      .select('*');

    if (diError) throw diError;

    const totalDI = diData?.length || 0;
    const totalSaluran = diData?.reduce((sum, di) => sum + (di.jumlah_saluran || 0), 0) || 0;
    const totalBangunan = diData?.reduce((sum, di) => sum + (di.jumlah_bangunan || 0), 0) || 0;
    const totalLuas = diData?.reduce((sum, di) => sum + (parseFloat(di.luas_ha) || 0), 0) || 0;

    document.getElementById('totalDI').textContent = totalDI;
    document.getElementById('totalSaluran').textContent = totalSaluran;
    document.getElementById('totalBangunan').textContent = totalBangunan;
    document.getElementById('totalLuas').textContent = totalLuas.toFixed(2);
  } catch (error) {
    console.error('Error loading statistics:', error);
  }
}

// Load Daerah Irigasi
async function loadDaerahIrigasi() {
  if (!supabase) {
    document.getElementById('diList').innerHTML = '<p class="error">Supabase not configured</p>';
    return;
  }

  try {
    const { data, error } = await supabase
      .from('daerah_irigasi')
      .select('*')
      .order('k_di', { ascending: true });

    if (error) throw error;

    if (!data || data.length === 0) {
      document.getElementById('diList').innerHTML = '<p>Belum ada data daerah irigasi. Import data terlebih dahulu.</p>';
      return;
    }

    let html = '<table class="data-table"><thead><tr>';
    html += '<th>Kode DI</th><th>Nama</th><th>Luas (Ha)</th><th>Kecamatan</th>';
    html += '<th>Saluran</th><th>Bangunan</th><th>Aksi</th>';
    html += '</tr></thead><tbody>';

    data.forEach(di => {
      html += '<tr>';
      html += `<td>${di.k_di}</td>`;
      html += `<td>${di.n_di}</td>`;
      html += `<td>${parseFloat(di.luas_ha || 0).toFixed(2)}</td>`;
      html += `<td>${di.kecamatan}</td>`;
      html += `<td>${di.jumlah_saluran || 0}</td>`;
      html += `<td>${di.jumlah_bangunan || 0}</td>`;
      html += `<td>
        <button class="action-btn view" onclick="viewDI('${di.id}')">View</button>
        <button class="action-btn delete" onclick="deleteDI('${di.id}')">Delete</button>
      </td>`;
      html += '</tr>';
    });

    html += '</tbody></table>';
    document.getElementById('diList').innerHTML = html;

    // Populate filter dropdowns
    populateFilters(data);

  } catch (error) {
    console.error('Error loading daerah irigasi:', error);
    document.getElementById('diList').innerHTML = `<p class="error">Error: ${error.message}</p>`;
  }
}

// Populate filters
function populateFilters(diData) {
  const filterDI = document.getElementById('filterDI');
  const filterDIBangunan = document.getElementById('filterDIBangunan');

  let options = '<option value="">Semua Daerah Irigasi</option>';
  diData.forEach(di => {
    options += `<option value="${di.id}">${di.n_di} (${di.k_di})</option>`;
  });

  filterDI.innerHTML = options;
  filterDIBangunan.innerHTML = options;
}

// Load Saluran
window.loadSaluran = async function() {
  if (!supabase) return;

  const filterValue = document.getElementById('filterDI')?.value || '';

  try {
    let query = supabase
      .from('saluran')
      .select('*, daerah_irigasi:daerah_irigasi_id(k_di, n_di)')
      .order('urutan', { ascending: true });

    if (filterValue) {
      query = query.eq('daerah_irigasi_id', filterValue);
    }

    const { data, error } = await query;

    if (error) throw error;

    if (!data || data.length === 0) {
      document.getElementById('saluranList').innerHTML = '<p>Belum ada data saluran.</p>';
      return;
    }

    let html = '<table class="data-table"><thead><tr>';
    html += '<th>No. Saluran</th><th>Nama</th><th>Jenis</th><th>Daerah Irigasi</th>';
    html += '<th>Panjang (m)</th><th>Luas Layanan</th><th>Aksi</th>';
    html += '</tr></thead><tbody>';

    data.forEach(sal => {
      html += '<tr>';
      html += `<td>${sal.no_saluran}</td>`;
      html += `<td>${sal.nama}</td>`;
      html += `<td>${sal.jenis}</td>`;
      html += `<td>${sal.daerah_irigasi?.n_di || '-'}</td>`;
      html += `<td>${parseFloat(sal.panjang_total || 0).toFixed(2)}</td>`;
      html += `<td>${parseFloat(sal.luas_layanan || 0).toFixed(2)}</td>`;
      html += `<td>
        <button class="action-btn view" onclick="viewSaluran('${sal.id}')">View</button>
      </td>`;
      html += '</tr>';
    });

    html += '</tbody></table>';
    document.getElementById('saluranList').innerHTML = html;

    // Populate saluran filter for ruas
    populateSaluranFilter(data);

  } catch (error) {
    console.error('Error loading saluran:', error);
    document.getElementById('saluranList').innerHTML = `<p class="error">Error: ${error.message}</p>`;
  }
};

// Populate saluran filter
function populateSaluranFilter(saluranData) {
  const filterSaluran = document.getElementById('filterSaluran');
  let options = '<option value="">Pilih Saluran</option>';
  saluranData.forEach(sal => {
    options += `<option value="${sal.id}">${sal.nama} (${sal.no_saluran})</option>`;
  });
  filterSaluran.innerHTML = options;
}

// Load Ruas
window.loadRuas = async function() {
  if (!supabase) return;

  const filterValue = document.getElementById('filterSaluran')?.value || '';

  if (!filterValue) {
    document.getElementById('ruasList').innerHTML = '<p>Pilih saluran terlebih dahulu.</p>';
    return;
  }

  try {
    const { data, error } = await supabase
      .from('ruas')
      .select('*, saluran:saluran_id(nama, no_saluran), bangunan_awal:bangunan_awal_id(nama), bangunan_akhir:bangunan_akhir_id(nama)')
      .eq('saluran_id', filterValue)
      .order('urutan', { ascending: true });

    if (error) throw error;

    if (!data || data.length === 0) {
      document.getElementById('ruasList').innerHTML = '<p>Belum ada data ruas untuk saluran ini.</p>';
      return;
    }

    let html = '<table class="data-table"><thead><tr>';
    html += '<th>No. Ruas</th><th>Urutan</th><th>Bangunan Awal</th><th>Bangunan Akhir</th><th>Panjang (m)</th><th>Aksi</th>';
    html += '</tr></thead><tbody>';

    data.forEach(ruas => {
      html += '<tr>';
      html += `<td>${ruas.no_ruas}</td>`;
      html += `<td>${ruas.urutan}</td>`;
      html += `<td>${ruas.bangunan_awal?.nama || '-'}</td>`;
      html += `<td>${ruas.bangunan_akhir?.nama || '-'}</td>`;
      html += `<td>${parseFloat(ruas.panjang || 0).toFixed(2)}</td>`;
      html += `<td>
        <button class="action-btn view" onclick="viewRuas('${ruas.id}')">View</button>
      </td>`;
      html += '</tr>';
    });

    html += '</tbody></table>';
    document.getElementById('ruasList').innerHTML = html;

  } catch (error) {
    console.error('Error loading ruas:', error);
    document.getElementById('ruasList').innerHTML = `<p class="error">Error: ${error.message}</p>`;
  }
};

// Load Bangunan
window.loadBangunan = async function() {
  if (!supabase) return;

  const filterValue = document.getElementById('filterDIBangunan')?.value || '';

  try {
    let query = supabase
      .from('bangunan')
      .select('*, daerah_irigasi:daerah_irigasi_id(k_di, n_di), saluran:saluran_id(nama)')
      .order('urutan_di_saluran', { ascending: true });

    if (filterValue) {
      query = query.eq('daerah_irigasi_id', filterValue);
    }

    const { data, error } = await query;

    if (error) throw error;

    if (!data || data.length === 0) {
      document.getElementById('bangunanList').innerHTML = '<p>Belum ada data bangunan.</p>';
      return;
    }

    let html = '<table class="data-table"><thead><tr>';
    html += '<th>Nama</th><th>Tipe</th><th>Nomenklatur</th><th>Saluran</th>';
    html += '<th>DI</th><th>Lat/Lng</th><th>Aksi</th>';
    html += '</tr></thead><tbody>';

    data.forEach(bg => {
      html += '<tr>';
      html += `<td>${bg.nama}</td>`;
      html += `<td>${bg.tipe}</td>`;
      html += `<td>${bg.nomenklatur}</td>`;
      html += `<td>${bg.saluran?.nama || '-'}</td>`;
      html += `<td>${bg.daerah_irigasi?.n_di || '-'}</td>`;
      html += `<td>${parseFloat(bg.latitude || 0).toFixed(6)}, ${parseFloat(bg.longitude || 0).toFixed(6)}</td>`;
      html += `<td>
        <button class="action-btn view" onclick="viewBangunan('${bg.id}')">View</button>
      </td>`;
      html += '</tr>';
    });

    html += '</tbody></table>';
    document.getElementById('bangunanList').innerHTML = html;

  } catch (error) {
    console.error('Error loading bangunan:', error);
    document.getElementById('bangunanList').innerHTML = `<p class="error">Error: ${error.message}</p>`;
  }
};

// Import data
window.importData = async function() {
  const kodeDI = document.getElementById('kodeDI').value.trim();
  const bangunanFile = document.getElementById('bangunanFile').files[0];
  const saluranFile = document.getElementById('saluranFile').files[0];
  const fungsionalFile = document.getElementById('fungsionalFile').files[0];

  if (!kodeDI) {
    showMessage('Kode Daerah Irigasi harus diisi', 'error');
    return;
  }

  if (!bangunanFile || !saluranFile || !fungsionalFile) {
    showMessage('Semua file harus dipilih', 'error');
    return;
  }

  const statusDiv = document.getElementById('importStatus');
  statusDiv.className = 'loading';
  statusDiv.textContent = 'Importing data...';

  try {
    // Read files
    const bangunanData = JSON.parse(await bangunanFile.text());
    const saluranData = JSON.parse(await saluranFile.text());
    const fungsionalData = JSON.parse(await fungsionalFile.text());

    // Get user token
    const userInfo = localStorage.getItem('user_info');
    if (!userInfo) {
      throw new Error('User not authenticated');
    }

    // Call edge function
    const response = await fetch(`${SUPABASE_URL}/functions/v1/import-irrigation-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        action: 'import',
        k_di: kodeDI,
        bangunanData,
        saluranData,
        fungsionalData,
      }),
    });

    const result = await response.json();

    if (response.ok) {
      statusDiv.className = 'success';
      statusDiv.textContent = `Data berhasil diimport! Daerah Irigasi ID: ${result.daerah_irigasi_id}`;
      showMessage('Import data berhasil!', 'success');

      // Reload data
      loadStatistics();
      loadDaerahIrigasi();

      // Clear form
      clearImportForm();
    } else {
      throw new Error(result.error || 'Import failed');
    }

  } catch (error) {
    console.error('Error importing data:', error);
    statusDiv.className = 'error';
    statusDiv.textContent = `Error: ${error.message}`;
    showMessage(`Import gagal: ${error.message}`, 'error');
  }
};

// Clear import form
window.clearImportForm = function() {
  document.getElementById('kodeDI').value = '';
  document.getElementById('bangunanFile').value = '';
  document.getElementById('saluranFile').value = '';
  document.getElementById('fungsionalFile').value = '';
  document.getElementById('importStatus').textContent = '';
};

// View functions (placeholders)
window.viewDI = function(id) {
  alert(`View Daerah Irigasi: ${id}\nFitur ini akan menampilkan detail daerah irigasi.`);
};

window.deleteDI = async function(id) {
  if (!confirm('Apakah Anda yakin ingin menghapus daerah irigasi ini? Semua data terkait (saluran, ruas, bangunan) akan ikut terhapus.')) {
    return;
  }

  try {
    const { error } = await supabase
      .from('daerah_irigasi')
      .delete()
      .eq('id', id);

    if (error) throw error;

    showMessage('Daerah irigasi berhasil dihapus', 'success');
    loadStatistics();
    loadDaerahIrigasi();
  } catch (error) {
    showMessage(`Error: ${error.message}`, 'error');
  }
};

window.viewSaluran = function(id) {
  alert(`View Saluran: ${id}\nFitur ini akan menampilkan detail saluran di peta.`);
};

window.viewRuas = function(id) {
  alert(`View Ruas: ${id}\nFitur ini akan menampilkan detail ruas di peta.`);
};

window.viewBangunan = function(id) {
  alert(`View Bangunan: ${id}\nFitur ini akan menampilkan detail bangunan di peta.`);
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadStatistics();
  loadDaerahIrigasi();
});
