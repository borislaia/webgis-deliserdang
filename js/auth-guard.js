import { ensureAuthRedirect, clearAuth, getAuthSession, apiRequest } from './utils.js';

// Check authentication status
async function checkAuthStatus() {
  const session = getAuthSession();
  if (!session) {
    location.href = 'login.html';
    return;
  }

  try {
    const response = await apiRequest('/api/auth/status');
    const data = await response.json();
    
    if (!data.authenticated) {
      clearAuth();
      location.href = 'login.html';
      return;
    }

    // Store user info for use in the app
    if (data.user) {
      localStorage.setItem('user_info', JSON.stringify(data.user));
    }
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
      const session = getAuthSession();
      if (session && session.refresh_token) {
        await apiRequest('/api/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refresh_token: session.refresh_token })
        });
      }
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
