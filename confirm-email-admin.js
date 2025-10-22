import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 Admin Email Confirmation');
console.log('===========================');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

// Use service role key for admin operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function confirmUserEmails() {
  try {
    console.log('📧 Getting all users...');
    
    // Get all users
    const { data: users, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (usersError) {
      console.error('❌ Error getting users:', usersError);
      return;
    }
    
    console.log(`👥 Found ${users.users.length} users`);
    
    for (const user of users.users) {
      console.log(`\n👤 Processing user: ${user.email}`);
      console.log(`📧 Email confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`);
      
      if (!user.email_confirmed_at) {
        console.log('🔧 Confirming email...');
        
        // Confirm user email
        const { data, error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
          email_confirm: true
        });
        
        if (error) {
          console.log(`❌ Error confirming ${user.email}:`, error.message);
        } else {
          console.log(`✅ Email confirmed for ${user.email}`);
        }
      } else {
        console.log('✅ Email already confirmed');
      }
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

async function testLoginAfterConfirmation() {
  console.log('\n🔐 Testing login after confirmation...');
  
  const testEmails = [
    'admin.deliserdang@gmail.com',
    'user.deliserdang@gmail.com',
    'test.deliserdang@gmail.com'
  ];
  
  for (const email of testEmails) {
    console.log(`\n📧 Testing login: ${email}`);
    
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email: email,
      password: 'admin123456' // Use the same password for all test accounts
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

// Run the confirmation process
confirmUserEmails().then(() => {
  console.log('\n🎉 Email confirmation completed!');
  return testLoginAfterConfirmation();
}).then(() => {
  console.log('\n🎉 All tests completed!');
  process.exit(0);
}).catch(error => {
  console.error('💥 Process failed:', error);
  process.exit(1);
});
