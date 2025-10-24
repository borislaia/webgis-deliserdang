import { firebaseAuth as auth } from './config/firebase-auth.js';
import { clearAuth } from './utils.js';

// Sync user data between localStorage and Firebase
async function syncUserData() {
  try {
    const user = await auth.getCurrentUser();
    
    if (!user) {
      clearAuth();
      return null;
    }

    // Store user info
    const userInfo = {
      id: user.id,
      email: user.email,
      role: user.role
    };
    
    localStorage.setItem('user_info', JSON.stringify(userInfo));
    return userInfo;
  } catch (error) {
    console.error('Sync user data failed:', error);
    clearAuth();
    return null;
  }
}

// Check authentication status
async function checkAuthStatus() {
  try {
    const userInfo = await syncUserData();
    
    if (!userInfo) {
      location.href = 'login.html';
      return;
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
