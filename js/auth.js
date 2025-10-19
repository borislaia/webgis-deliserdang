import { setAuth, apiRequest } from './utils.js';

const form = document.getElementById('loginForm');
const toggleModeBtn = document.getElementById('toggleMode');
const roleRow = document.getElementById('roleRow');
const submitBtn = form.querySelector('button[type="submit"]');
const errorDiv = document.getElementById('error-message') || createErrorDiv();

let isLoginMode = true;

function createErrorDiv() {
  const div = document.createElement('div');
  div.id = 'error-message';
  div.className = 'error-message';
  div.style.cssText = 'color: red; margin-top: 10px; padding: 10px; background: #ffe6e6; border: 1px solid #ffcccc; border-radius: 4px; display: none;';
  form.appendChild(div);
  return div;
}

function showError(message) {
  errorDiv.textContent = message;
  errorDiv.style.display = 'block';
}

function hideError() {
  errorDiv.style.display = 'none';
}

function toggleMode() {
  isLoginMode = !isLoginMode;
  
  if (isLoginMode) {
    toggleModeBtn.textContent = 'Register';
    submitBtn.textContent = 'Login';
    roleRow.style.display = 'none';
    document.querySelector('h2').textContent = 'Login';
  } else {
    toggleModeBtn.textContent = 'Login';
    submitBtn.textContent = 'Register';
    roleRow.style.display = 'block';
    document.querySelector('h2').textContent = 'Register';
  }
  
  hideError();
  form.reset();
}

toggleModeBtn.addEventListener('click', toggleMode);

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideError();
  
  const email = /** @type {HTMLInputElement} */(document.getElementById('email')).value.trim();
  const password = /** @type {HTMLInputElement} */(document.getElementById('password')).value.trim();
  const role = /** @type {HTMLSelectElement} */(document.getElementById('role')).value;

  if(!email || !password){
    showError('Please enter both email and password');
    return;
  }

  if(!isLoginMode && password.length < 6){
    showError('Password must be at least 6 characters long');
    return;
  }

  try {
    const endpoint = isLoginMode ? '/api/auth/login' : '/api/auth/register';
    const body = isLoginMode 
      ? { email, password }
      : { email, password, role };

    const response = await apiRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if(data.success){
      if(isLoginMode) {
        setAuth(data.session);
        location.href = 'dashboard.html';
      } else {
        showError('Registration successful! Please check your email to verify your account, then you can login.');
        setTimeout(() => toggleMode(), 2000);
      }
    } else {
      showError(data.message || (isLoginMode ? 'Login failed' : 'Registration failed'));
    }
  } catch (error) {
    console.error('Auth error:', error);
    showError('Network error. Please try again.');
  }
});
