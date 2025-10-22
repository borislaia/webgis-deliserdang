import { EMAIL_REGEX, PASSWORD_MIN_LENGTH, ERROR_MESSAGES } from './constants.js';

// Email validation
export function validateEmail(email) {
  if (!email || email.trim() === '') {
    return { isValid: false, message: ERROR_MESSAGES.EMAIL_REQUIRED };
  }
  
  if (!EMAIL_REGEX.test(email.trim())) {
    return { isValid: false, message: ERROR_MESSAGES.INVALID_EMAIL };
  }
  
  return { isValid: true, message: '' };
}

// Password validation
export function validatePassword(password, isRegistration = false) {
  if (!password || password.trim() === '') {
    return { isValid: false, message: ERROR_MESSAGES.PASSWORD_REQUIRED };
  }
  
  if (isRegistration && password.length < PASSWORD_MIN_LENGTH) {
    return { isValid: false, message: ERROR_MESSAGES.PASSWORD_TOO_SHORT };
  }
  
  return { isValid: true, message: '' };
}

// Form validation
export function validateLoginForm(email, password) {
  const emailValidation = validateEmail(email);
  if (!emailValidation.isValid) {
    return emailValidation;
  }
  
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    return passwordValidation;
  }
  
  return { isValid: true, message: '' };
}

export function validateRegistrationForm(email, password, role) {
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
}

// Sanitize input
export function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  return input.trim();
}