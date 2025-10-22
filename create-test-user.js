import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

console.log('👤 Creating Test User for Login');
console.log('================================');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createTestUser() {
  try {
    // Gunakan email yang lebih valid
    const testEmail = 'admin@deliserdang.id';
    const testPassword = 'admin123456';
    
    console.log(`📧 Creating user with email: ${testEmail}`);
    
    // Daftar user baru
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    });
    
    if (error) {
      console.log('❌ Registration failed:', error.message);
      console.log('🔍 Error details:', error);
      return false;
    } else {
      console.log('✅ Registration successful!');
      console.log('👤 User data:', data.user);
      console.log('📧 Email confirmation required:', data.user?.email_confirmed_at ? 'No' : 'Yes');
      
      // Coba login langsung
      console.log('\n🔐 Testing immediate login...');
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      });
      
      if (loginError) {
        console.log('❌ Login failed:', loginError.message);
        console.log('💡 This might be because email confirmation is required');
      } else {
        console.log('✅ Login successful!');
        console.log('👤 User:', loginData.user);
        console.log('🔑 Session:', loginData.session);
      }
      
      return true;
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
    return false;
  }
}

// Test dengan beberapa email yang berbeda
async function testMultipleRegistrations() {
  const testUsers = [
    { email: 'admin@deliserdang.id', password: 'admin123456' },
    { email: 'user@deliserdang.id', password: 'user123456' },
    { email: 'test@deliserdang.id', password: 'test123456' }
  ];
  
  console.log('\n🔄 Testing multiple user registrations...');
  
  for (const user of testUsers) {
    console.log(`\n📧 Testing: ${user.email}`);
    
    const { data, error } = await supabase.auth.signUp({
      email: user.email,
      password: user.password,
    });
    
    if (error) {
      console.log(`❌ ${user.email}: ${error.message}`);
    } else {
      console.log(`✅ ${user.email}: Registration successful!`);
      console.log('👤 User ID:', data.user?.id);
      console.log('📧 Email confirmed:', data.user?.email_confirmed_at ? 'Yes' : 'No');
    }
  }
}

// Run tests
createTestUser().then(() => {
  return testMultipleRegistrations();
}).then(() => {
  console.log('\n🎉 User creation testing completed!');
  console.log('\n💡 Next steps:');
  console.log('1. Check your email for confirmation links');
  console.log('2. Click the confirmation link to activate accounts');
  console.log('3. Try logging in with the created accounts');
  process.exit(0);
}).catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});
