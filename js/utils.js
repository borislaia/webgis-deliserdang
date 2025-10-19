// Authentication utilities for Supabase
export function ensureAuthRedirect(to = '/login.html'){
  const session = getAuthSession();
  if(!session || isTokenExpired(session.expires_at)){ 
    clearAuth();
    location.href = to; 
  }
}

export function setAuth(sessionData){
  if(sessionData && sessionData.access_token){
    localStorage.setItem('auth_session', JSON.stringify(sessionData));
  }
}

export function clearAuth(){
  localStorage.removeItem('auth_session');
  localStorage.removeItem('auth_token'); // Legacy support
}

export function getAuthSession(){
  try {
    const sessionData = localStorage.getItem('auth_session');
    return sessionData ? JSON.parse(sessionData) : null;
  } catch (error) {
    console.error('Error parsing auth session:', error);
    return null;
  }
}

export function isTokenExpired(expiresAt){
  if(!expiresAt) return true;
  const now = Math.floor(Date.now() / 1000);
  return now >= expiresAt;
}

export function getAuthHeaders(){
  const session = getAuthSession();
  if(session && !isTokenExpired(session.expires_at)){
    return {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    };
  }
  return {
    'Content-Type': 'application/json'
  };
}

// API helper with authentication
export async function apiRequest(url, options = {}){
  const headers = {
    ...getAuthHeaders(),
    ...options.headers
  };
  
  const response = await fetch(url, {
    ...options,
    headers
  });
  
  // If token expired, try to refresh
  if(response.status === 401 && getAuthSession()){
    const refreshed = await refreshAuthToken();
    if(refreshed){
      // Retry with new token
      const newHeaders = {
        ...getAuthHeaders(),
        ...options.headers
      };
      return fetch(url, {
        ...options,
        headers: newHeaders
      });
    } else {
      // Refresh failed, redirect to login
      clearAuth();
      location.href = '/login.html';
      return response;
    }
  }
  
  return response;
}

// Refresh authentication token
export async function refreshAuthToken(){
  try {
    const session = getAuthSession();
    if(!session || !session.refresh_token) return false;
    
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: session.refresh_token })
    });
    
    if(response.ok){
      const data = await response.json();
      setAuth(data.session);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return false;
  }
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
