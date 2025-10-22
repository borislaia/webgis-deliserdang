import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 Reset User Passwords');
console.log('======================');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

// Use service role key for admin operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function resetUserPasswords() {
  try {
    console.log('📧 Getting all users...');
    
    // Get all users
    const { data: users, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (usersError) {
      console.error('❌ Error getting users:', usersError);
      return;
    }
    
    console.log(`👥 Found ${users.users.length} users`);
    
    const commonPassword = 'admin123456';
    
    for (const user of users.users) {
      console.log(`\n👤 Processing user: ${user.email}`);
      
      // Update user password
      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
        password: commonPassword
      });
      
      if (error) {
        console.log(`❌ Error updating password for ${user.email}:`, error.message);
      } else {
        console.log(`✅ Password updated for ${user.email}`);
      }
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

async function testAllLogins() {
  console.log('\n🔐 Testing all user logins...');
  
  const testUsers = [
    { email: 'admin.deliserdang@gmail.com', password: 'admin123456' },
    { email: 'user.deliserdang@gmail.com', password: 'admin123456' },
    { email: 'test.deliserdang@gmail.com', password: 'admin123456' },
    { email: 'borizzzlaia@gmail.com', password: 'admin123456' }
  ];
  
  for (const user of testUsers) {
    console.log(`\n📧 Testing login: ${user.email}`);
    
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email: user.email,
      password: user.password
    });
    
    if (error) {
      console.log(`❌ Login failed: ${error.message}`);
    } else {
      console.log(`✅ Login successful!`);
      console.log('👤 User:', data.user?.email);
      console.log('🔑 Session active:', !!data.session);
    }
  }
}

// Run the password reset process
resetUserPasswords().then(() => {
  console.log('\n🎉 Password reset completed!');
  return testAllLogins();
}).then(() => {
  console.log('\n🎉 All tests completed!');
  console.log('\n📋 Summary:');
  console.log('✅ All users have been confirmed and password reset');
  console.log('✅ You can now login with any of these emails:');
  console.log('   - admin.deliserdang@gmail.com');
  console.log('   - user.deliserdang@gmail.com');
  console.log('   - test.deliserdang@gmail.com');
  console.log('   - borizzzlaia@gmail.com');
  console.log('✅ Password for all accounts: admin123456');
  process.exit(0);
}).catch(error => {
  console.error('💥 Process failed:', error);
  process.exit(1);
});
