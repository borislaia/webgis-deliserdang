// Comprehensive Supabase test script
// This script tests connection, authentication, and data operations
// Run with: node test-supabase-comprehensive.js

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Comprehensive Supabase Test');
console.log('================================');
console.log('URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
console.log('Anon Key:', supabaseKey ? '✅ Set' : '❌ Missing');
console.log('Service Key:', supabaseServiceKey ? '✅ Set' : '❌ Missing');

if (!supabaseUrl || !supabaseKey) {
  console.error('\n❌ Missing Supabase credentials. Please check your .env file.');
  console.log('\nTo set up Supabase:');
  console.log('1. Go to https://supabase.com and create a new project');
  console.log('2. Get your project URL and anon key from Settings > API');
  console.log('3. Update the .env file with your credentials');
  process.exit(1);
}

// Validate URL format
if (!supabaseUrl.startsWith('https://') && !supabaseUrl.startsWith('http://')) {
  console.error('\n❌ Invalid Supabase URL format. Must start with http:// or https://');
  console.log('Current URL:', supabaseUrl);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function testConnection() {
  console.log('\n🔌 Testing basic connection...');
  try {
    // Test basic connection by querying a simple table
    const { data, error } = await supabase.from('user_roles').select('count').limit(1);
    
    if (error) {
      console.error('❌ Connection failed:', error.message);
      console.log('Error details:', error);
      return false;
    }
    
    console.log('✅ Basic connection successful');
    return true;
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    return false;
  }
}

async function testAuth() {
  console.log('\n🔐 Testing authentication service...');
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.log('ℹ️  Auth service error (may be expected):', error.message);
    } else {
      console.log('✅ Auth service accessible');
      if (data.session) {
        console.log('ℹ️  Active session found for user:', data.session.user?.email);
      } else {
        console.log('ℹ️  No active session (expected for new setup)');
      }
    }
    return true;
  } catch (error) {
    console.error('❌ Auth test failed:', error.message);
    return false;
  }
}

async function testDataOperations() {
  console.log('\n📊 Testing data operations...');
  
  try {
    // Test reading data
    console.log('  📖 Testing data read...');
    const { data: readData, error: readError } = await supabase
      .from('user_roles')
      .select('*')
      .limit(5);
    
    if (readError) {
      console.error('  ❌ Read operation failed:', readError.message);
      return false;
    }
    
    console.log('  ✅ Read operation successful');
    console.log('  📋 Found', readData.length, 'records in user_roles table');
    
    // Test inserting data (if we have service key)
    if (supabaseServiceKey) {
      console.log('  📝 Testing data insert...');
      
      // Create a test user role (this will fail if user doesn't exist, but that's expected)
      const testUserId = '00000000-0000-0000-0000-000000000000'; // Dummy UUID
      const { data: insertData, error: insertError } = await supabaseAdmin
        .from('user_roles')
        .insert({ user_id: testUserId, role: 'user' })
        .select();
      
      if (insertError) {
        console.log('  ℹ️  Insert test failed (expected if user doesn\'t exist):', insertError.message);
      } else {
        console.log('  ✅ Insert operation successful');
        
        // Clean up test data
        await supabaseAdmin
          .from('user_roles')
          .delete()
          .eq('user_id', testUserId);
        console.log('  🧹 Test data cleaned up');
      }
    } else {
      console.log('  ℹ️  Skipping insert test (no service key provided)');
    }
    
    return true;
  } catch (error) {
    console.error('  ❌ Data operations test failed:', error.message);
    return false;
  }
}

async function testDatabaseSchema() {
  console.log('\n🗄️  Testing database schema...');
  
  try {
    // Check if required tables exist
    const tables = ['user_roles', 'user_sessions'];
    
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`  ❌ Table '${table}' not accessible:`, error.message);
        return false;
      } else {
        console.log(`  ✅ Table '${table}' accessible`);
      }
    }
    
    return true;
  } catch (error) {
    console.error('  ❌ Schema test failed:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('\n🚀 Starting comprehensive tests...\n');
  
  const results = {
    connection: await testConnection(),
    auth: await testAuth(),
    schema: await testDatabaseSchema(),
    dataOps: await testDataOperations()
  };
  
  console.log('\n📊 Test Results Summary');
  console.log('========================');
  console.log('Connection:', results.connection ? '✅ PASS' : '❌ FAIL');
  console.log('Authentication:', results.auth ? '✅ PASS' : '❌ FAIL');
  console.log('Database Schema:', results.schema ? '✅ PASS' : '❌ FAIL');
  console.log('Data Operations:', results.dataOps ? '✅ PASS' : '❌ FAIL');
  
  const allPassed = Object.values(results).every(result => result);
  
  if (allPassed) {
    console.log('\n🎉 All tests passed! Supabase is properly configured and working.');
    console.log('\nNext steps:');
    console.log('1. Set up your database schema by running the SQL script in Supabase dashboard');
    console.log('2. Start the backend server: cd backend && npm run dev');
    console.log('3. Test the web application at http://localhost:3000');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the configuration and try again.');
    console.log('\nTroubleshooting:');
    console.log('1. Verify your Supabase URL and keys are correct');
    console.log('2. Make sure your Supabase project is active');
    console.log('3. Run the SQL setup script in your Supabase dashboard');
    console.log('4. Check Supabase logs for detailed error messages');
  }
  
  return allPassed;
}

// Run the tests
runAllTests().catch(console.error);