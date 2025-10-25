// Firebase Authentication functions
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut
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
      console.log('Firebase Auth signIn called with email:', email);
      console.log('Auth object available:', !!auth);
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      console.log('Firebase signInWithEmailAndPassword successful');
      console.log('User credential:', userCredential);
      console.log('User object:', user);
      
      // Get user role
      let userRole = 'user';
      try {
        userRole = await this.getUserRole(user.uid);
        console.log('User role retrieved:', userRole);
      } catch (roleError) {
        console.warn('Could not get user role, using default:', roleError);
      }
      
      const result = { 
        data: {
          user: {
            id: user.uid,
            email: user.email,
            role: userRole
          }
        }, 
        error: null 
      };
      
      console.log('Returning signIn result:', result);
      return result;
    } catch (error) {
      console.error('Firebase signInWithEmailAndPassword error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
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

};