// Constants and error messages for the application
export const ERROR_MESSAGES = {
  // Authentication errors
  INVALID_CREDENTIALS: 'Email atau password salah',
  EMAIL_REQUIRED: 'Email harus diisi',
  PASSWORD_REQUIRED: 'Password harus diisi',
  PASSWORD_TOO_SHORT: 'Password minimal 6 karakter',
  INVALID_EMAIL: 'Format email tidak valid',
  LOGIN_FAILED: 'Login gagal, coba lagi',
  REGISTRATION_FAILED: 'Registrasi gagal, coba lagi',
  EMAIL_ALREADY_EXISTS: 'Email sudah terdaftar',
  USER_NOT_FOUND: 'User tidak ditemukan',
  
  // Network errors
  NETWORK_ERROR: 'Koneksi bermasalah, periksa internet Anda',
  SERVER_ERROR: 'Server bermasalah, coba lagi nanti',
  TIMEOUT_ERROR: 'Request timeout, coba lagi',
  
  // Validation errors
  VALIDATION_ERROR: 'Data tidak valid',
  REQUIRED_FIELD: 'Field ini wajib diisi',
  
  // General errors
  UNKNOWN_ERROR: 'Terjadi kesalahan, coba lagi',
  ACCESS_DENIED: 'Akses ditolak',
  SESSION_EXPIRED: 'Session expired, silakan login kembali'
};

export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login berhasil',
  REGISTRATION_SUCCESS: 'Registrasi berhasil! Silakan cek email untuk verifikasi',
  LOGOUT_SUCCESS: 'Logout berhasil',
  DATA_SAVED: 'Data berhasil disimpan',
  DATA_UPDATED: 'Data berhasil diupdate',
  DATA_DELETED: 'Data berhasil dihapus'
};

export const LOADING_MESSAGES = {
  LOGGING_IN: 'Sedang login...',
  REGISTERING: 'Sedang mendaftar...',
  LOADING: 'Memuat...',
  SAVING: 'Menyimpan...',
  PROCESSING: 'Memproses...'
};

// Email validation regex
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Password requirements
export const PASSWORD_MIN_LENGTH = 6;

// API endpoints
export const API_ENDPOINTS = {
  LOGIN: '/api/auth/login',
  REGISTER: '/api/auth/register',
  LOGOUT: '/api/auth/logout',
  STATUS: '/api/auth/status',
  REFRESH: '/api/auth/refresh',
  USERS: '/api/auth/users'
};