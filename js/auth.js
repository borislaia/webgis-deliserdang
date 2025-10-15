import { setAuth } from './utils.js';

const form = document.getElementById('loginForm');
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const email = /** @type {HTMLInputElement} */(document.getElementById('email')).value.trim();
  const password = /** @type {HTMLInputElement} */(document.getElementById('password')).value.trim();

  // Basic client-only auth: accept any non-empty credentials
  if(email && password){
    setAuth('demo-token');
    location.href = 'dashboard.html';
  } else {
    alert('Please enter email and password');
  }
});
