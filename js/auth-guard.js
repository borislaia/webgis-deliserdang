import { ensureAuthRedirect, clearAuth } from './utils.js';

ensureAuthRedirect('login.html');

const logoutBtn = document.getElementById('logoutBtn');
if(logoutBtn){
  logoutBtn.addEventListener('click', () => {
    clearAuth();
    location.href = 'index.html';
  });
}
