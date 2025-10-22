import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

console.log('🔐 Testing Login with Existing Email');
console.log('=====================================');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLogin() {
  try {
    // Test email yang mungkin sudah terdaftar
    const testEmail = 'test@example.com';
    const testPassword = 'password123';
    
    console.log(`📧 Testing login with email: ${testEmail}`);
    
    // Coba login
    const { data, error } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });
    
    if (error) {
      console.log('❌ Login failed:', error.message);
      console.log('🔍 Error details:', error);
      
      // Coba daftar user baru jika login gagal
      console.log('\n📝 Trying to register new user...');
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
      });
      
      if (signUpError) {
        console.log('❌ Registration failed:', signUpError.message);
        console.log('🔍 Registration error details:', signUpError);
      } else {
        console.log('✅ Registration successful!');
        console.log('📧 Please check your email to verify the account');
        console.log('👤 User data:', signUpData.user);
      }
    } else {
      console.log('✅ Login successful!');
      console.log('👤 User data:', data.user);
      console.log('🔑 Session:', data.session);
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

// Test dengan berbagai email yang mungkin sudah terdaftar
async function testMultipleEmails() {
  const testEmails = [
    'admin@deliserdang.com',
    'user@deliserdang.com', 
    'test@deliserdang.com',
    'admin@example.com',
    'user@example.com'
  ];
  
  console.log('\n🔄 Testing multiple emails...');
  
  for (const email of testEmails) {
    console.log(`\n📧 Testing: ${email}`);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: 'password123',
    });
    
    if (error) {
      console.log(`❌ ${email}: ${error.message}`);
    } else {
      console.log(`✅ ${email}: Login successful!`);
      console.log('👤 User:', data.user);
      break; // Stop testing if we find a working login
    }
  }
}

// Run tests
testLogin().then(() => {
  return testMultipleEmails();
}).then(() => {
  console.log('\n🎉 Login testing completed!');
  process.exit(0);
}).catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});
