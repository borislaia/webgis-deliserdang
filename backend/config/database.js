// Supabase Database configuration
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

// Client for user operations (uses anon key)
export const supabase = createClient(supabaseUrl, supabaseKey);

// Admin client for server-side operations (uses service role key)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Helper function to get user role
export const getUserRole = async (userId) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      console.error('Error fetching user role:', error);
      return 'user'; // default role
    }
    
    return data?.role || 'user';
  } catch (error) {
    console.error('Error in getUserRole:', error);
    return 'user';
  }
};

// Helper function to set user role
export const setUserRole = async (userId, role) => {
  try {
    const { error } = await supabaseAdmin
      .from('user_roles')
      .upsert({ user_id: userId, role: role });
    
    if (error) {
      console.error('Error setting user role:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in setUserRole:', error);
    return false;
  }
};

// Fallback dummy data (keep for compatibility)
export const dummyData = {
  kecamatan: [],
  irigasi: [],
  sda: [],
  bencana: [],
  infrastruktur: []
};
