// Firebase Authentication functions
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase.js';

export const firebaseAuth = {
  // Sign up with email and password
  async signUp(email, password, role = 'user') {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Set user role in Firestore
      await setDoc(doc(db, 'user_roles', user.uid), {
        role: role,
        createdAt: new Date()
      });
      
      return { data: { user }, error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      return { data: null, error };
    }
  },

  // Sign in with email and password
  async signIn(email, password) {
    try {
      console.log('Attempting login for email:', email);
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      console.log('Login successful, user data:', user);
      
      // Get user role
      let userRole = 'user';
      try {
        userRole = await this.getUserRole(user.uid);
        console.log('User role retrieved:', userRole);
      } catch (roleError) {
        console.warn('Could not get user role, using default:', roleError);
      }
      
      return { 
        data: {
          user: {
            id: user.uid,
            email: user.email,
            role: userRole
          }
        }, 
        error: null 
      };
    } catch (error) {
      console.error('Sign in error:', error);
      return { data: null, error };
    }
  },

  // Sign out
  async signOut() {
    try {
      await signOut(auth);
      return { error: null };
    } catch (error) {
      console.error('Sign out error:', error);
      return { error };
    }
  },

  // Get current user
  async getCurrentUser() {
    try {
      const user = auth.currentUser;
      if (user) {
        const userRole = await this.getUserRole(user.uid);
        return {
          id: user.uid,
          email: user.email,
          role: userRole
        };
      }
      return null;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  },

  // Get user role from Firestore
  async getUserRole(userId) {
    try {
      console.log('Fetching role for user ID:', userId);
      
      const userRoleDoc = await getDoc(doc(db, 'user_roles', userId));
      
      if (userRoleDoc.exists()) {
        const role = userRoleDoc.data().role;
        console.log('User role found:', role);
        return role || 'user';
      } else {
        // Create default role if doesn't exist
        console.log('Creating default role for user');
        await setDoc(doc(db, 'user_roles', userId), {
          role: 'user',
          createdAt: new Date()
        });
        return 'user';
      }
    } catch (error) {
      console.error('Error in getUserRole:', error);
      return 'user';
    }
  },

  // Listen to auth state changes
  onAuthStateChange(callback) {
    try {
      return onAuthStateChanged(auth, callback);
    } catch (error) {
      console.error('Error setting up auth state listener:', error);
      return null;
    }
  },

  // Get current session
  async getSession() {
    try {
      const user = auth.currentUser;
      return user ? { user } : null;
    } catch (error) {
      console.error('Get session error:', error);
      return null;
    }
  }
};