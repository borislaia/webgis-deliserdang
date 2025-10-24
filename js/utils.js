// Authentication utilities for Firebase
import { firebaseAuth as auth } from './config/firebase-auth.js';

export function ensureAuthRedirect(to = '/login.html'){
  // Check if user is authenticated using Firebase
  auth.getCurrentUser().then((user) => {
    if (!user) {
      location.href = to;
    }
  });
}

export function setAuth(sessionData){
  // This function is now handled by Firebase automatically
  // Keeping for compatibility but not needed
  console.log('setAuth called - Firebase handles session management automatically');
}

export function clearAuth(){
  // Clear any legacy auth data
  localStorage.removeItem('auth_session');
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user_info');
}

export function getAuthSession(){
  // This function is now handled by Firebase
  // Return null to maintain compatibility
  return null;
}

export function isTokenExpired(expiresAt){
  // Firebase handles token expiration automatically
  return false;
}

export async function getAuthHeaders(){
  // Get auth headers from Firebase session
  const user = await auth.getCurrentUser();
  if (user) {
    // Firebase doesn't use Bearer tokens in the same way
    // You might need to get ID token instead
    return {
      'Content-Type': 'application/json'
    };
  }
  return {
    'Content-Type': 'application/json'
  };
}

// API helper with authentication
export async function apiRequest(url, options = {}){
  const user = await auth.getCurrentUser();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  // Firebase doesn't use Bearer tokens in the same way
  // You might need to get ID token instead
  
  const response = await fetch(url, {
    ...options,
    headers
  });
  
  // If token expired, Firebase will handle refresh automatically
  if(response.status === 401){
    // Clear auth and redirect to login
    await auth.signOut();
    location.href = '/login.html';
    return response;
  }
  
  return response;
}

// Refresh authentication token - handled by Firebase automatically
export async function refreshAuthToken(){
  // Firebase handles token refresh automatically
  return true;
}

export function fetchJSON(path){ return fetch(path).then(r => r.json()); }

export function el(tag, attrs={}, children=[]){
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([k,v]) => {
    if(k === 'class') node.className = v;
    else if(k.startsWith('on') && typeof v === 'function') node.addEventListener(k.substring(2).toLowerCase(), v);
    else if(k === 'html') node.innerHTML = v;
    else node.setAttribute(k, v);
  });
  (Array.isArray(children) ? children : [children]).forEach(c => { if(c) node.append(c); });
  return node;
}

export function formatAttrs(attrs){
  return Object.entries(attrs).map(([k,v]) => `<div><strong>${k}</strong>: ${v}</div>`).join('');
}
