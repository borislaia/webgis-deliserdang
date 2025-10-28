import { clearAuth } from './utils.js';

// Check authentication status from localStorage and validate with backend
async function checkAuthStatus() {
  try {
    const userInfo = getCurrentUser();
    const authToken = localStorage.getItem('auth_token');
    
    if (!userInfo || !authToken) {
      clearAuth();
      location.href = 'login.html';
      return;
    }

    // Optional: Validate token with backend
    // For now, we'll just check if user exists in localStorage
    console.log('User authenticated:', userInfo.email);
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
  logoutBtn.addEventListener('click', () => {
    try {
      // Show loading state
      logoutBtn.disabled = true;
      logoutBtn.textContent = 'Logging out...';
      
      console.log('Logout successful');
      clearAuth();
      localStorage.removeItem('user_info');
      localStorage.removeItem('auth_token');
      location.href = 'index.html';
    } catch (error) {
      console.error('Logout error:', error);
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
    if (!userInfo) return null;
    
    const parsed = JSON.parse(userInfo);
    // Validate user object structure
    if (!parsed || typeof parsed !== 'object' || !parsed.id || !parsed.email) {
      console.warn('Invalid user info structure, clearing localStorage');
      localStorage.removeItem('user_info');
      return null;
    }
    
    return parsed;
  } catch (error) {
    console.error('Error parsing user info:', error);
    // Clear corrupted data
    localStorage.removeItem('user_info');
    return null;
  }
}

// Helper function to check if user is admin
export function isAdmin() {
  try {
    const user = getCurrentUser();
    return user && user.role === 'admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}
