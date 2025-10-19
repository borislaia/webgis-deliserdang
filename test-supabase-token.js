// Test Supabase Token Usage
// This script tests how to use the provided token with Supabase

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './backend/.env' });

const providedToken = 'yl4txuboW1CCG3SUUWUfuJ4b3tPTeiRqQvhjJUWTcRoJ1qrp1qhFSYgEGx1dJ3aQ/yYegrJTdcTXLy4G7YVftQ==';

console.log('🔑 Supabase Token Test');
console.log('======================');
console.log('Testing token:', providedToken.substring(0, 20) + '...');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

console.log('\n📋 Current Configuration:');
console.log('Supabase URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
console.log('Supabase Key:', supabaseKey ? '✅ Set' : '❌ Missing');

if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your_supabase_project_url_here')) {
  console.log('\n❌ Supabase credentials not properly configured');
  console.log('\nTo use this token, you need to:');
  console.log('1. Get your Supabase project URL and anon key');
  console.log('2. Update the .env file with real credentials');
  console.log('3. Then this token can be used for authentication');
  
  console.log('\n🔧 Token Usage Examples:');
  console.log('Once configured, you can use this token like this:');
  console.log(`
// Method 1: Set session with the token
const { data, error } = await supabase.auth.setSession({
  access_token: '${providedToken}',
  refresh_token: 'your_refresh_token_here'
});

// Method 2: Use as Authorization header
const { data, error } = await supabase
  .from('your_table')
  .select('*')
  .eq('id', 'some_id')
  .headers({
    'Authorization': 'Bearer ${providedToken}'
  });

// Method 3: Set as access token directly
supabase.auth.setAuth('${providedToken}');
  `);
  
  process.exit(1);
}

// If we have proper credentials, test the token
const supabase = createClient(supabaseUrl, supabaseKey);

async function testTokenUsage() {
  console.log('\n🧪 Testing Token Usage...');
  
  try {
    // Method 1: Try to set session with the token
    console.log('\n1️⃣  Testing setSession method...');
    const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
      access_token: providedToken,
      refresh_token: 'dummy_refresh_token' // This might not work without a real refresh token
    });
    
    if (sessionError) {
      console.log('❌ setSession failed:', sessionError.message);
    } else {
      console.log('✅ setSession successful');
      console.log('User:', sessionData.user?.email);
    }
    
    // Method 2: Try to get user with the token
    console.log('\n2️⃣  Testing getUser with token...');
    const { data: userData, error: userError } = await supabase.auth.getUser(providedToken);
    
    if (userError) {
      console.log('❌ getUser failed:', userError.message);
    } else {
      console.log('✅ getUser successful');
      console.log('User:', userData.user?.email);
    }
    
    // Method 3: Try to use the token for API calls
    console.log('\n3️⃣  Testing API call with token...');
    
    // First, try to set the auth
    await supabase.auth.setAuth(providedToken);
    
    // Then try a simple query
    const { data: queryData, error: queryError } = await supabase
      .from('user_roles')
      .select('*')
      .limit(1);
    
    if (queryError) {
      console.log('❌ API call failed:', queryError.message);
    } else {
      console.log('✅ API call successful');
      console.log('Data:', queryData);
    }
    
  } catch (error) {
    console.error('❌ Token test failed:', error.message);
  }
}

// Run the test
testTokenUsage().catch(console.error);