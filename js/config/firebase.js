// Firebase configuration
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyC2r1nUf2eT9GMa2Mb5XOy2MOVFs39Gttk",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "webgis-deliserdang.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "webgis-deliserdang",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "webgis-deliserdang.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "178538591157",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:178538591157:web:08c55fa9443970ed1b5ffc",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-VG6MF0WV9V"
};

// Validate configuration
if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
  console.error('❌ Missing Firebase configuration. Please check your environment variables.');
  throw new Error('Firebase configuration is missing');
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;