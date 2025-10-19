// Complete Admin Setup Script for WebGIS Deli Serdang
// This script will create an admin user and set up everything needed for admin login

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import readline from 'readline';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials. Please check your .env file.');
  console.log('Required variables: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create clients
const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function testConnection() {
  try {
    console.log('🔌 Testing Supabase connection...');
    
    // Test with anon key
    const { data: anonTest, error: anonError } = await supabase
      .from('user_roles')
      .select('count')
      .limit(1);
    
    if (anonError) {
      console.error('❌ Anon key connection failed:', anonError.message);
      return false;
    }
    
    // Test with service key
    const { data: serviceTest, error: serviceError } = await supabaseAdmin
      .from('user_roles')
      .select('count')
      .limit(1);
    
    if (serviceError) {
      console.error('❌ Service key connection failed:', serviceError.message);
      return false;
    }
    
    console.log('✅ Both connections successful!\n');
    return true;
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    return false;
  }
}

async function createAdminUser() {
  console.log('🔧 Setting up admin user...\n');
  
  try {
    const email = 'admin@deliserdang.com';
    const password = await question('Enter password for admin user: ');
    
    if (!password || password.length < 6) {
      console.error('❌ Password must be at least 6 characters long');
      rl.close();
      return;
    }
    
    console.log('\n📝 Creating admin user...');
    
    // Create the user with Supabase Auth
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
      
      // Set user role to admin using service key
      console.log('\n🔑 Setting admin role...');
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .upsert({ 
          user_id: data.user.id, 
          role: 'admin' 
        });
      
      if (roleError) {
        console.error('❌ Error setting admin role:', roleError.message);
        console.log('\n💡 You may need to run the database setup SQL first.');
        rl.close();
        return;
      }
      
      console.log('✅ Admin role set successfully!');
      
      // Verify the setup
      console.log('\n🔍 Verifying admin setup...');
      const { data: roleData, error: roleCheckError } = await supabaseAdmin
        .from('user_roles')
        .select('role')
        .eq('user_id', data.user.id)
        .single();
      
      if (roleCheckError) {
        console.error('❌ Error verifying role:', roleCheckError.message);
      } else {
        console.log('✅ Admin setup verified! Role:', roleData.role);
      }
      
      console.log('\n🎉 Admin setup complete!');
      console.log('📋 Login credentials:');
      console.log('   Email:', email);
      console.log('   Password:', password);
      console.log('   Role: admin');
      console.log('\n🌐 You can now login at: http://localhost:3000/login.html');
      
    } else {
      console.log('ℹ️  User creation pending email verification');
      console.log('📧 Please check your email and verify the account, then run this script again.');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  } finally {
    rl.close();
  }
}

async function checkExistingUsers() {
  try {
    console.log('🔍 Checking existing users...');
    
    const { data: users, error } = await supabaseAdmin
      .from('auth.users')
      .select('id, email, created_at')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) {
      console.log('ℹ️  Could not fetch users (this is normal for some setups)');
      return;
    }
    
    if (users && users.length > 0) {
      console.log('📋 Existing users:');
      users.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email} (${user.id})`);
      });
      console.log('');
    } else {
      console.log('ℹ️  No existing users found\n');
    }
  } catch (error) {
    console.log('ℹ️  Could not check existing users');
  }
}

async function main() {
  console.log('🚀 WebGIS Deli Serdang - Admin Setup');
  console.log('=====================================\n');
  
  const connected = await testConnection();
  if (!connected) {
    console.log('\n💡 Make sure you have:');
    console.log('1. Run the SQL setup script in your Supabase dashboard');
    console.log('2. Your project is active and accessible');
    console.log('3. Correct credentials in .env file');
    return;
  }
  
  await checkExistingUsers();
  await createAdminUser();
}

main().catch(console.error);