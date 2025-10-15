// Simple router helpers and utilities
export function ensureAuthRedirect(to = '/login.html'){
  const token = localStorage.getItem('auth_token');
  if(!token){ location.href = to; }
}
export function setAuth(token){ localStorage.setItem('auth_token', token); }
export function clearAuth(){ localStorage.removeItem('auth_token'); }

export function fetchJSON(path){ 
  return fetch(path).then(r => {
    if (!r.ok) {
      throw new Error(`HTTP error! status: ${r.status}`);
    }
    return r.json();
  }); 
}

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
