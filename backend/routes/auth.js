import express from 'express';
import { supabase, supabaseAdmin, getUserRole } from '../config/database.js';

const router = express.Router();

// Register endpoint
router.post('/register', async (req, res) => {
  try {
    const { email, password, role = 'user' } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Bad Request',
        message: 'Email dan password harus diisi' 
      });
    }

    // Register user with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      return res.status(400).json({ 
        error: 'Registration Failed',
        message: error.message 
      });
    }

    // Set user role in our custom table
    if (data.user) {
      await supabaseAdmin
        .from('user_roles')
        .insert({ user_id: data.user.id, role: role });
    }

    res.json({ 
      success: true,
      message: 'Registrasi berhasil. Silakan cek email untuk verifikasi.',
      user: {
        id: data.user?.id,
        email: data.user?.email,
        role: role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Terjadi kesalahan saat registrasi' 
    });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Bad Request',
        message: 'Email dan password harus diisi' 
      });
    }

    // Authenticate with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(401).json({ 
        error: 'Authentication Failed',
        message: 'Email atau password salah' 
      });
    }

    // Get user role
    const userRole = await getUserRole(data.user.id);

    res.json({ 
      success: true,
      message: 'Login berhasil',
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at
      },
      user: {
        id: data.user.id,
        email: data.user.email,
        role: userRole
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Terjadi kesalahan saat login' 
    });
  }
});

// Logout endpoint
router.post('/logout', async (req, res) => {
  try {
    const { refresh_token } = req.body;
    
    if (refresh_token) {
      await supabase.auth.signOut({ refreshToken: refresh_token });
    }

    res.json({ 
      success: true,
      message: 'Logout berhasil' 
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Terjadi kesalahan saat logout' 
    });
  }
});

// Check auth status
router.get('/status', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.json({ 
        authenticated: false,
        message: 'No valid token provided'
      });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify token with Supabase
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return res.json({ 
        authenticated: false,
        message: 'Invalid or expired token'
      });
    }

    // Get user role
    const userRole = await getUserRole(data.user.id);

    res.json({ 
      authenticated: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        role: userRole
      }
    });
  } catch (error) {
    console.error('Auth status error:', error);
    res.json({ 
      authenticated: false,
      message: 'Error checking authentication status'
    });
  }
});

// Refresh token endpoint
router.post('/refresh', async (req, res) => {
  try {
    const { refresh_token } = req.body;
    
    if (!refresh_token) {
      return res.status(400).json({ 
        error: 'Bad Request',
        message: 'Refresh token diperlukan' 
      });
    }

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token
    });

    if (error) {
      return res.status(401).json({ 
        error: 'Refresh Failed',
        message: 'Token refresh gagal' 
      });
    }

    res.json({ 
      success: true,
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at
      }
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Terjadi kesalahan saat refresh token' 
    });
  }
});

export default router;
