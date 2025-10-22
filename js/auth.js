import { auth } from './config/supabase.js';
import { ERROR_MESSAGES, SUCCESS_MESSAGES, LOADING_MESSAGES } from './utils/constants.js';
import { validateLoginForm, validateRegistrationForm, sanitizeInput } from './utils/validators.js';

const form = document.getElementById('loginForm');
const toggleModeBtn = document.getElementById('toggleMode');
const roleRow = document.getElementById('roleRow');
const submitBtn = form.querySelector('button[type="submit"]');
const errorDiv = document.getElementById('error-message') || createErrorDiv();

let isLoginMode = true;
let isLoading = false;

function createErrorDiv() {
  const div = document.createElement('div');
  div.id = 'error-message';
  div.className = 'error-message';
  div.style.cssText = 'color: #dc2626; margin-top: 10px; padding: 12px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; display: none; font-size: 14px;';
  form.appendChild(div);
  return div;
}

function showError(message) {
  errorDiv.textContent = message;
  errorDiv.style.display = 'block';
  errorDiv.style.background = '#fef2f2';
  errorDiv.style.borderColor = '#fecaca';
  errorDiv.style.color = '#dc2626';
}

function showSuccess(message) {
  errorDiv.textContent = message;
  errorDiv.style.display = 'block';
  errorDiv.style.background = '#f0fdf4';
  errorDiv.style.borderColor = '#bbf7d0';
  errorDiv.style.color = '#166534';
}

function hideError() {
  errorDiv.style.display = 'none';
}

function setLoading(loading) {
  isLoading = loading;
  submitBtn.disabled = loading;
  submitBtn.textContent = loading 
    ? (isLoginMode ? LOADING_MESSAGES.LOGGING_IN : LOADING_MESSAGES.REGISTERING)
    : (isLoginMode ? 'Login' : 'Register');
  
  // Disable form inputs during loading
  const inputs = form.querySelectorAll('input, select, button');
  inputs.forEach(input => {
    if (input !== submitBtn) {
      input.disabled = loading;
    }
  });
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
  
  if (isLoading) return; // Prevent multiple submissions
  
  const email = sanitizeInput(/** @type {HTMLInputElement} */(document.getElementById('email')).value);
  const password = sanitizeInput(/** @type {HTMLInputElement} */(document.getElementById('password')).value);
  const role = /** @type {HTMLSelectElement} */(document.getElementById('role')).value;

  // Validate form
  const validation = isLoginMode 
    ? validateLoginForm(email, password)
    : validateRegistrationForm(email, password, role);
    
  if (!validation.isValid) {
    showError(validation.message);
    return;
  }

  setLoading(true);

  try {
    if(isLoginMode) {
      // Login with Supabase
      console.log('Attempting login...');
      const { data, error } = await auth.signIn(email, password);
      
      if(error) {
        console.error('Login error:', error);
        showError(error.message || ERROR_MESSAGES.LOGIN_FAILED);
        return;
      }

      if(data && data.user) {
        console.log('Login successful, user:', data.user);
        
        // Store user info for use in the app
        localStorage.setItem('user_info', JSON.stringify({
          id: data.user.id,
          email: data.user.email,
          role: data.user.role
        }));
        
        showSuccess(SUCCESS_MESSAGES.LOGIN_SUCCESS);
        console.log('Redirecting to dashboard...');
        setTimeout(() => {
          location.href = 'dashboard.html';
        }, 1000);
      } else {
        console.error('No user data returned');
        showError(ERROR_MESSAGES.LOGIN_FAILED);
      }
    } else {
      // Register with Supabase
      const { data, error } = await auth.signUp(email, password, role);
      
      if(error) {
        showError(error.message || ERROR_MESSAGES.REGISTRATION_FAILED);
        return;
      }

      if(data.user) {
        showSuccess(SUCCESS_MESSAGES.REGISTRATION_SUCCESS);
        setTimeout(() => toggleMode(), 3000);
      }
    }
  } catch (error) {
    console.error('Auth error:', error);
    showError(ERROR_MESSAGES.UNKNOWN_ERROR);
  } finally {
    setLoading(false);
  }
});
