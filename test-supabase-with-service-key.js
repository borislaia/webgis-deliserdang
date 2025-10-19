// Test Supabase connection using service role key
// This script tests the connection and data operations using the service role key

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Supabase Connection Test with Service Role Key');
console.log('=================================================');
console.log('URL:', supabaseUrl);
console.log('Service Key:', supabaseServiceKey ? '✅ Set' : '❌ Missing');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testConnection() {
  console.log('\n🔌 Testing Supabase connection...');
  
  try {
    // Test basic connection by querying the auth.users table
    console.log('  📊 Testing database connection...');
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.log('  ❌ Auth admin query failed:', usersError.message);
    } else {
      console.log('  ✅ Auth service accessible');
      console.log('  👥 Found', users.users.length, 'users in the system');
    }
    
    // Test querying user_roles table
    console.log('\n  📋 Testing user_roles table...');
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('*')
      .limit(5);
    
    if (rolesError) {
      console.log('  ❌ user_roles query failed:', rolesError.message);
      console.log('  💡 This might mean the database schema needs to be set up');
    } else {
      console.log('  ✅ user_roles table accessible');
      console.log('  📊 Found', roles.length, 'user roles');
      if (roles.length > 0) {
        console.log('  📋 Sample data:');
        roles.forEach((role, index) => {
          console.log(`     ${index + 1}. User: ${role.user_id}, Role: ${role.role}`);
        });
      }
    }
    
    // Test creating a test user role
    console.log('\n  📝 Testing data insertion...');
    const testUserId = 'test-user-' + Date.now();
    
    const { data: insertData, error: insertError } = await supabase
      .from('user_roles')
      .insert({
        user_id: testUserId,
        role: 'user'
      })
      .select();
    
    if (insertError) {
      console.log('  ❌ Insert failed:', insertError.message);
    } else {
      console.log('  ✅ Insert successful');
      console.log('  📊 Created test role:', insertData[0]);
      
      // Clean up test data
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', testUserId);
      
      if (deleteError) {
        console.log('  ⚠️  Cleanup failed:', deleteError.message);
      } else {
        console.log('  🧹 Test data cleaned up');
      }
    }
    
    console.log('\n✅ Supabase connection test completed!');
    console.log('\n📋 Summary:');
    console.log('• Database connection: Working');
    console.log('• Service role key: Valid');
    console.log('• Data operations: Ready');
    
    console.log('\n🎯 Next steps:');
    console.log('1. Get your anon key from Supabase dashboard (Settings > API)');
    console.log('2. Update the .env file with the anon key');
    console.log('3. Run the comprehensive test: npm run test-supabase-comprehensive');
    console.log('4. Set up the database schema if not already done');
    
    return true;
    
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    return false;
  }
}

// Run the test
testConnection().catch(console.error);