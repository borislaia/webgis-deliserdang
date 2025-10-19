// Simple connection test for Supabase
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Environment variables:');
console.log('SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
console.log('SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Set' : '❌ Missing');
console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅ Set' : '❌ Missing');
console.log('');

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

// Test anon key connection
console.log('🔌 Testing anon key connection...');
const supabase = createClient(supabaseUrl, supabaseAnonKey);

supabase.auth.getSession()
  .then(({ data, error }) => {
    if (error) {
      console.error('❌ Anon key auth test failed:', error.message);
    } else {
      console.log('✅ Anon key auth test passed');
    }
  })
  .catch(err => {
    console.error('❌ Anon key connection error:', err.message);
  });

// Test service key connection
console.log('🔌 Testing service key connection...');
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

supabaseAdmin.auth.getSession()
  .then(({ data, error }) => {
    if (error) {
      console.error('❌ Service key auth test failed:', error.message);
    } else {
      console.log('✅ Service key auth test passed');
    }
  })
  .catch(err => {
    console.error('❌ Service key connection error:', err.message);
  });

// Test database access
console.log('🔌 Testing database access...');
supabaseAdmin
  .from('user_roles')
  .select('count')
  .limit(1)
  .then(({ data, error }) => {
    if (error) {
      console.error('❌ Database access failed:', error.message);
      console.log('💡 This might mean the user_roles table doesn\'t exist yet');
    } else {
      console.log('✅ Database access successful');
    }
  })
  .catch(err => {
    console.error('❌ Database connection error:', err.message);
  });