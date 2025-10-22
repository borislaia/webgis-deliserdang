// Supabase client configuration for frontend
import { createClient } from '@supabase/supabase-js';

// Supabase configuration - using environment variables for consistency
const supabaseUrl = 'https://yyagythhwzdncantoszf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5YWd5dGhod3pkbmNhbnRvc3pmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1NzkzMzcsImV4cCI6MjA3NjE1NTMzN30.R1fbe6pwq6d7ZJ5posqv2m4lhWhdnN9GxeJx-NDv0Yo';

// Create Supabase client with proper configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Authentication functions
export const auth = {
  // Sign up with email and password
  async signUp(email, password, role = 'user') {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      // Set user role in our custom table
      if (data.user) {
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({ user_id: data.user.id, role: role });
        
        if (roleError) {
          console.error('Error setting user role:', roleError);
        }
      }

      return { data, error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      return { data: null, error };
    }
  },

  // Sign in with email and password
  async signIn(email, password) {
    try {
      console.log('Attempting login for email:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Supabase login error:', error);
        return { data: null, error };
      }

      console.log('Login successful, user data:', data.user);

      // Get user role with better error handling
      let userRole = 'user'; // default role
      try {
        userRole = await this.getUserRole(data.user.id);
        console.log('User role retrieved:', userRole);
      } catch (roleError) {
        console.warn('Could not get user role, using default:', roleError);
        // Don't fail login if role retrieval fails
      }

      return { 
        data: {
          ...data,
          user: {
            ...data.user,
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
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Sign out error:', error);
      return { error };
    }
  },

  // Get current user
  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;

      if (user) {
        const userRole = await this.getUserRole(user.id);
        return {
          ...user,
          role: userRole
        };
      }

      return null;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  },

  // Get user role from custom table
  async getUserRole(userId) {
    try {
      console.log('Fetching role for user ID:', userId);
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching user role:', error);
        
        // If table doesn't exist or user doesn't have a role, create one
        if (error.code === 'PGRST116' || error.message.includes('No rows found')) {
          console.log('Creating default role for user');
          const { error: insertError } = await supabase
            .from('user_roles')
            .insert({ user_id: userId, role: 'user' });
          
          if (insertError) {
            console.error('Error creating user role:', insertError);
          }
        }
        
        return 'user'; // default role
      }

      console.log('User role found:', data?.role);
      return data?.role || 'user';
    } catch (error) {
      console.error('Error in getUserRole:', error);
      return 'user';
    }
  },

  // Listen to auth state changes
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback);
  },

  // Get current session
  async getSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      return session;
    } catch (error) {
      console.error('Get session error:', error);
      return null;
    }
  }
};

// Export supabase client for other uses
export default supabase;