// Migration script from Supabase to Firebase
// Run this script once to migrate existing data

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyC2r1nUf2eT9GMa2Mb5XOy2MOVFs39Gttk",
  authDomain: "webgis-deliserdang.firebaseapp.com",
  projectId: "webgis-deliserdang",
  storageBucket: "webgis-deliserdang.firebasestorage.app",
  messagingSenderId: "178538591157",
  appId: "1:178538591157:web:08c55fa9443970ed1b5ffc"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Sample migration function
async function migrateUserRoles() {
  console.log('Starting migration of user roles...');
  
  // If you have existing user roles from Supabase, add them here
  // Example:
  // const userRoles = [
  //   { userId: 'user1', role: 'admin' },
  //   { userId: 'user2', role: 'user' }
  // ];
  
  // for (const userRole of userRoles) {
  //   await setDoc(doc(db, 'user_roles', userRole.userId), {
  //     role: userRole.role,
  //     migratedAt: new Date()
  //   });
  //   console.log(`Migrated user role for ${userRole.userId}`);
  // }
  
  console.log('Migration completed!');
}

// Run migration
migrateUserRoles().catch(console.error);