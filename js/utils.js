// Authentication utilities for Firebase
import { firebaseAuth as auth } from './config/firebase-auth.js';


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

