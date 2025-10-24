// Re-export from Firebase config for compatibility
export { auth as firebaseAuth, db as firebaseDb } from './config/firebase.js';
export { firebaseAuth as auth } from './config/firebase-auth.js';
export { default } from './config/firebase.js';

// Import Firebase auth for compatibility
import { firebaseAuth } from './config/firebase-auth.js';

// Export Firebase auth as 'auth' for compatibility
export const auth = firebaseAuth;

// Export default for compatibility
export default firebaseAuth;