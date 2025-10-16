import express from 'express';

const router = express.Router();

// Login endpoint
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  // TODO: Implementasi autentikasi yang sebenarnya
  if (!username || !password) {
    return res.status(400).json({ 
      error: 'Bad Request',
      message: 'Username dan password harus diisi' 
    });
  }
  
  // Contoh response sukses (ganti dengan logic autentikasi sebenarnya)
  res.json({ 
    success: true,
    message: 'Login berhasil',
    token: 'dummy-token-123',
    user: {
      username: username,
      role: 'user'
    }
  });
});

// Logout endpoint
router.post('/logout', (req, res) => {
  // TODO: Implementasi logout (invalidate token, dll)
  res.json({ 
    success: true,
    message: 'Logout berhasil' 
  });
});

// Check auth status
router.get('/status', (req, res) => {
  // TODO: Implementasi check token/session
  res.json({ 
    authenticated: false,
    message: 'Not authenticated'
  });
});

export default router;
