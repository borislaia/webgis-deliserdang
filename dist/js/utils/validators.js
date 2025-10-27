import { EMAIL_REGEX, PASSWORD_MIN_LENGTH, ERROR_MESSAGES } from './constants.js';

// Email validation
export function validateEmail(email) {
  try {
    if (!email || email.trim() === '') {
      return { isValid: false, message: ERROR_MESSAGES.EMAIL_REQUIRED };
    }
    
    if (!EMAIL_REGEX.test(email.trim())) {
      return { isValid: false, message: ERROR_MESSAGES.INVALID_EMAIL };
    }
    
    return { isValid: true, message: '' };
  } catch (error) {
    console.error('Error validating email:', error);
    return { isValid: false, message: ERROR_MESSAGES.VALIDATION_ERROR };
  }
}

// Password validation
export function validatePassword(password, isRegistration = false) {
  try {
    if (!password || password.trim() === '') {
      return { isValid: false, message: ERROR_MESSAGES.PASSWORD_REQUIRED };
    }
    
    if (isRegistration && password.length < PASSWORD_MIN_LENGTH) {
      return { isValid: false, message: ERROR_MESSAGES.PASSWORD_TOO_SHORT };
    }
    
    return { isValid: true, message: '' };
  } catch (error) {
    console.error('Error validating password:', error);
    return { isValid: false, message: ERROR_MESSAGES.VALIDATION_ERROR };
  }
}

// Form validation
export function validateLoginForm(email, password) {
  try {
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return emailValidation;
    }
    
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return passwordValidation;
    }
    
    return { isValid: true, message: '' };
  } catch (error) {
    console.error('Error validating login form:', error);
    return { isValid: false, message: ERROR_MESSAGES.VALIDATION_ERROR };
  }
}

export function validateRegistrationForm(email, password, role) {
  try {
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return emailValidation;
    }
    
    const passwordValidation = validatePassword(password, true);
    if (!passwordValidation.isValid) {
      return passwordValidation;
    }
    
    if (!role || (role !== 'user' && role !== 'admin')) {
      return { isValid: false, message: 'Role harus dipilih' };
    }
    
    return { isValid: true, message: '' };
  } catch (error) {
    console.error('Error validating registration form:', error);
    return { isValid: false, message: ERROR_MESSAGES.VALIDATION_ERROR };
  }
}

// Sanitize input
export function sanitizeInput(input) {
  try {
    if (typeof input !== 'string') return input;
    return input.trim();
  } catch (error) {
    console.error('Error sanitizing input:', error);
    return input;
  }
}