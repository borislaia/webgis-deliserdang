import { auth, supabase } from './supabase.js';
import { clearAuth } from './utils.js';

// Check authentication status
async function checkAuthStatus() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      clearAuth();
      location.href = 'login.html';
      return;
    }

    // Get user role and store user info
    const userRole = await auth.getUserRole(user.id);
    const userInfo = {
      id: user.id,
      email: user.email,
      role: userRole
    };
    
    localStorage.setItem('user_info', JSON.stringify(userInfo));
  } catch (error) {
    console.error('Auth check failed:', error);
    clearAuth();
    location.href = 'login.html';
  }
}

// Initialize auth check
checkAuthStatus();

// Logout functionality
const logoutBtn = document.getElementById('logoutBtn');
if(logoutBtn){
  logoutBtn.addEventListener('click', async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuth();
      localStorage.removeItem('user_info');
      location.href = 'index.html';
    }
  });
}

// Helper function to get current user info
export function getCurrentUser() {
  try {
    const userInfo = localStorage.getItem('user_info');
    return userInfo ? JSON.parse(userInfo) : null;
  } catch (error) {
    console.error('Error parsing user info:', error);
    return null;
  }
}

// Helper function to check if user is admin
export function isAdmin() {
  const user = getCurrentUser();
  return user && user.role === 'admin';
}
