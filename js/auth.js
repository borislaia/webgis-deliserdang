import { firebaseAuth as auth } from './config/firebase-auth.js';
import { ERROR_MESSAGES, SUCCESS_MESSAGES, LOADING_MESSAGES } from './utils/constants.js';
import { validateLoginForm, validateRegistrationForm, sanitizeInput } from './utils/validators.js';

console.log('Auth module loaded successfully');
console.log('firebaseAuth object:', auth);
console.log('ERROR_MESSAGES:', ERROR_MESSAGES);

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing auth...');
  initializeAuth();
});

function initializeAuth() {
  const form = document.getElementById('loginForm');
  const toggleModeBtn = document.getElementById('toggleMode');
  const roleRow = document.getElementById('roleRow');
  
  if (!form) {
    console.error('Login form not found!');
    return;
  }
  
  const submitBtn = form.querySelector('button[type="submit"]');
  const errorDiv = document.getElementById('error-message') || createErrorDiv(form);
  console.log('errorDiv initialized:', errorDiv);

  let isLoginMode = true;
  let isLoading = false;

  function createErrorDiv(formElement) {
    try {
      const div = document.createElement('div');
      div.id = 'error-message';
      div.className = 'error-message';
      div.style.cssText = 'color: #dc2626; margin-top: 10px; padding: 12px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; display: none; font-size: 14px;';
      formElement.appendChild(div);
      return div;
    } catch (error) {
      console.error('Error creating error div:', error);
      return null;
    }
  }

  function showError(message) {
    try {
      console.log('showError called with message:', message);
      console.log('errorDiv element:', errorDiv);
      
      if (!errorDiv) {
        console.error('errorDiv is null or undefined');
        return;
      }
      
      errorDiv.textContent = message;
      errorDiv.style.display = 'block';
      errorDiv.style.background = '#fef2f2';
      errorDiv.style.borderColor = '#fecaca';
      errorDiv.style.color = '#dc2626';
      
      console.log('Error message displayed successfully');
    } catch (error) {
      console.error('Error showing error message:', error);
    }
  }

  function showSuccess(message) {
    try {
      errorDiv.textContent = message;
      errorDiv.style.display = 'block';
      errorDiv.style.background = '#f0fdf4';
      errorDiv.style.borderColor = '#bbf7d0';
      errorDiv.style.color = '#166534';
    } catch (error) {
      console.error('Error showing success message:', error);
    }
  }

  function hideError() {
    try {
      errorDiv.style.display = 'none';
    } catch (error) {
      console.error('Error hiding error message:', error);
    }
  }

  function setLoading(loading) {
    try {
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
    } catch (error) {
      console.error('Error setting loading state:', error);
    }
  }

  function toggleMode() {
    try {
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
    } catch (error) {
      console.error('Error toggling mode:', error);
    }
  }

  toggleModeBtn.addEventListener('click', (e) => {
    try {
      toggleMode();
    } catch (error) {
      console.error('Error in toggle mode click:', error);
    }
  });

  form.addEventListener('submit', async (e) => {
    try {
      console.log('Form submit event triggered');
      e.preventDefault();
      hideError();
      
      if (isLoading) {
        console.log('Already loading, preventing multiple submissions');
        return; // Prevent multiple submissions
      }
    
    const email = sanitizeInput(/** @type {HTMLInputElement} */(document.getElementById('email')).value);
    const password = sanitizeInput(/** @type {HTMLInputElement} */(document.getElementById('password')).value);
    const roleElement = /** @type {HTMLSelectElement} */(document.getElementById('role'));
    const role = roleElement ? roleElement.value : 'user';

    console.log('Form data extracted:', { email, password, role, isLoginMode });

    // Validate form
    let validation;
    try {
      validation = isLoginMode 
        ? validateLoginForm(email, password)
        : validateRegistrationForm(email, password, role);
      console.log('Validation result:', validation);
    } catch (error) {
      console.error('Validation error:', error);
      showError('Error validating form data');
      return;
    }
    
    if (!validation.isValid) {
      console.log('Validation failed:', validation.message);
      showError(validation.message);
      return;
    }

    setLoading(true);

    try {
      if(isLoginMode) {
        // Login with Firebase
        console.log('Attempting login with email:', email);
        console.log('Auth object:', auth);
        
        const { data, error } = await auth.signIn(email, password);
        console.log('Login response - data:', data, 'error:', error);
        
        if(error) {
          console.error('Login error details:', error);
          console.error('Error code:', error.code);
          console.error('Error message:', error.message);
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
          console.error('No user data returned from auth.signIn');
          console.error('Data object:', data);
          showError(ERROR_MESSAGES.LOGIN_FAILED);
        }
      } else {
        // Register with Firebase
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
    } catch (error) {
      console.error('Error in form submission:', error);
      showError('Terjadi kesalahan saat memproses form');
      setLoading(false);
    }
  });
}