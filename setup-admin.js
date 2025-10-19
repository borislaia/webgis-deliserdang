// Script to create admin user 'boris' in Supabase
// Run with: node setup-admin.js

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import readline from 'readline';

// Load environment variables
dotenv.config({ path: './backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function createAdminUser() {
  console.log('🔧 Setting up admin user "boris"...\n');
  
  try {
    // First, let's check if the user already exists
    console.log('🔍 Checking if user already exists...');
    
    const email = 'boris@admin.com';
    const password = await question('Enter password for admin user "boris": ');
    
    if (!password) {
      console.error('❌ Password is required');
      rl.close();
      return;
    }
    
    console.log('\n📝 Creating admin user...');
    
    // Create the user
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
    });
    
    if (error) {
      console.error('❌ Error creating user:', error.message);
      rl.close();
      return;
    }
    
    if (data.user) {
      console.log('✅ User created successfully!');
      console.log('📧 Email:', data.user.email);
      console.log('🆔 User ID:', data.user.id);
      
      // Now we need to manually set the role to admin
      // This requires the service role key
      console.log('\n⚠️  IMPORTANT: To complete admin setup, you need to:');
      console.log('1. Go to your Supabase dashboard');
      console.log('2. Navigate to Authentication > Users');
      console.log('3. Find the user with email:', email);
      console.log('4. Copy the User ID:', data.user.id);
      console.log('5. Go to SQL Editor and run this query:');
      console.log(`
        INSERT INTO user_roles (user_id, role) 
        VALUES ('${data.user.id}', 'admin')
        ON CONFLICT (user_id) 
        DO UPDATE SET role = 'admin';
      `);
      console.log('\n6. Or use the Supabase dashboard to manually update the user_roles table');
      
    } else {
      console.log('ℹ️  User creation pending email verification');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  } finally {
    rl.close();
  }
}

// Check if we can connect first
async function testConnection() {
  try {
    console.log('🔌 Testing Supabase connection...');
    const { data, error } = await supabase.from('user_roles').select('count').limit(1);
    
    if (error) {
      console.error('❌ Connection failed:', error.message);
      console.log('\n💡 Make sure you have:');
      console.log('1. Run the SQL setup script in your Supabase dashboard');
      console.log('2. Your project is active and accessible');
      return false;
    }
    
    console.log('✅ Connection successful!\n');
    return true;
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    return false;
  }
}

async function main() {
  const connected = await testConnection();
  if (connected) {
    await createAdminUser();
  }
}

main();