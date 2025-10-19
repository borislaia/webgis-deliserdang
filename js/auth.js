import { auth } from './supabase.js';

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
    if(isLoginMode) {
      // Login with Supabase
      const { data, error } = await auth.signIn(email, password);
      
      if(error) {
        showError(error.message || 'Login failed');
        return;
      }

      if(data.user) {
        // Store user info for use in the app
        localStorage.setItem('user_info', JSON.stringify({
          id: data.user.id,
          email: data.user.email,
          role: data.user.role
        }));
        
        location.href = 'dashboard.html';
      }
    } else {
      // Register with Supabase
      const { data, error } = await auth.signUp(email, password, role);
      
      if(error) {
        showError(error.message || 'Registration failed');
        return;
      }

      if(data.user) {
        showError('Registration successful! Please check your email to verify your account, then you can login.');
        setTimeout(() => toggleMode(), 2000);
      }
    }
  } catch (error) {
    console.error('Auth error:', error);
    showError('An error occurred. Please try again.');
  }
});
