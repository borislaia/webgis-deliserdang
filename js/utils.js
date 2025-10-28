// Authentication utilities
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

// API helper (simplified without authentication)
export async function apiRequest(url, options = {}){
  try {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    
    const response = await fetch(url, {
      ...options,
      headers
    });
    
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

// Escape HTML to prevent XSS when rendering untrusted content
function escapeHTML(unsafe){
  if (unsafe == null) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function el(tag, attrs = {}, children = []){
  try {
    const node = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (k === 'class') {
        node.className = v;
      } else if (k.startsWith('on') && typeof v === 'function') {
        node.addEventListener(k.substring(2).toLowerCase(), v);
      } else if (k === 'html') {
        // Only allow explicit html usage; escape by default via 'text'
        node.innerHTML = String(v);
      } else if (k === 'text') {
        node.textContent = String(v);
      } else {
        node.setAttribute(k, v);
      }
    });
    (Array.isArray(children) ? children : [children]).forEach((c) => {
      if (c == null) return;
      if (typeof c === 'string' || typeof c === 'number') {
        node.append(document.createTextNode(String(c)));
      } else {
        node.append(c);
      }
    });
    return node;
  } catch (error) {
    console.error('Error creating element:', error);
    return document.createElement('div');
  }
}

export { escapeHTML };

