// Authentication utilities for Firebase
import { firebaseAuth as auth } from './config/firebase-auth.js';

export function ensureAuthRedirect(to = '/login.html'){
  try {
    // Check if user is authenticated using Firebase
    auth.getCurrentUser().then((user) => {
      if (!user) {
        location.href = to;
      }
    }).catch((error) => {
      console.error('Error checking auth status:', error);
      location.href = to;
    });
  } catch (error) {
    console.error('Error in ensureAuthRedirect:', error);
    location.href = to;
  }
}

export function setAuth(sessionData){
  try {
    // This function is now handled by Firebase automatically
    // Keeping for compatibility but not needed
    console.log('setAuth called - Firebase handles session management automatically');
  } catch (error) {
    console.error('Error in setAuth:', error);
  }
}

export function clearAuth(){
  try {
    // Clear any legacy auth data
    localStorage.removeItem('auth_session');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_info');
  } catch (error) {
    console.error('Error clearing auth data:', error);
  }
}

export function getAuthSession(){
  try {
    // This function is now handled by Firebase
    // Return null to maintain compatibility
    return null;
  } catch (error) {
    console.error('Error in getAuthSession:', error);
    return null;
  }
}

export function isTokenExpired(expiresAt){
  try {
    // Firebase handles token expiration automatically
    return false;
  } catch (error) {
    console.error('Error in isTokenExpired:', error);
    return true; // Assume expired if error
  }
}

export async function getAuthHeaders(){
  try {
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
  } catch (error) {
    console.error('Error getting auth headers:', error);
    return {
      'Content-Type': 'application/json'
    };
  }
}

// API helper with authentication
export async function apiRequest(url, options = {}){
  try {
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
      location.href = 'login.html';
      return response;
    }
    
    return response;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}

// Refresh authentication token - handled by Firebase automatically
export async function refreshAuthToken(){
  try {
    // Firebase handles token refresh automatically
    return true;
  } catch (error) {
    console.error('Error refreshing auth token:', error);
    return false;
  }
}

export async function fetchJSON(path){ 
  try {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${path}:`, error);
    throw error;
  }
}

export function el(tag, attrs={}, children=[]){
  try {
    const node = document.createElement(tag);
    Object.entries(attrs).forEach(([k,v]) => {
      if(k === 'class') node.className = v;
      else if(k.startsWith('on') && typeof v === 'function') node.addEventListener(k.substring(2).toLowerCase(), v);
      else if(k === 'html') node.innerHTML = v;
      else node.setAttribute(k, v);
    });
    (Array.isArray(children) ? children : [children]).forEach(c => { if(c) node.append(c); });
    return node;
  } catch (error) {
    console.error('Error creating element:', error);
    return document.createElement('div');
  }
}

export function formatAttrs(attrs){
  try {
    return Object.entries(attrs).map(([k,v]) => `<div><strong>${k}</strong>: ${v}</div>`).join('');
  } catch (error) {
    console.error('Error formatting attributes:', error);
    return '';
  }
}
