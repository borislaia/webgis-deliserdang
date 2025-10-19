// JWT Decoder and Analyzer
// This script decodes and analyzes JWT tokens

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './backend/.env' });

const jwtToken = 'yl4txuboW1CCG3SUUWUfuJ4b3tPTeiRqQvhjJUWTcRoJ1qrp1qhFSYgEGx1dJ3aQ/yYegrJTdcTXLy4G7YVftQ==';

console.log('🔍 JWT Token Analysis');
console.log('====================');
console.log('Token:', jwtToken);
console.log('Length:', jwtToken.length, 'characters');

// Check if this looks like a JWT (should have 3 parts separated by dots)
const parts = jwtToken.split('.');
console.log('Parts:', parts.length);

if (parts.length === 3) {
  console.log('\n✅ This appears to be a valid JWT format');
  
  try {
    // Decode header
    const header = JSON.parse(atob(parts[0]));
    console.log('\n📋 Header:');
    console.log(JSON.stringify(header, null, 2));
    
    // Decode payload
    const payload = JSON.parse(atob(parts[1]));
    console.log('\n📦 Payload:');
    console.log(JSON.stringify(payload, null, 2));
    
    // Check if it's a Supabase JWT
    if (payload.iss && payload.iss.includes('supabase')) {
      console.log('\n🎯 This appears to be a Supabase JWT!');
      console.log('Issuer:', payload.iss);
      console.log('Subject (User ID):', payload.sub);
      console.log('Email:', payload.email);
      console.log('Role:', payload.role);
      console.log('Expires:', new Date(payload.exp * 1000).toISOString());
    }
    
  } catch (error) {
    console.error('❌ Error decoding JWT:', error.message);
  }
} else {
  console.log('\n❌ This does not appear to be a standard JWT format');
  console.log('Expected 3 parts separated by dots, got', parts.length);
}

// Test if this could be a Supabase token
console.log('\n🔧 Testing with Supabase client...');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (supabaseUrl && supabaseKey && !supabaseUrl.includes('your_supabase_project_url_here')) {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Try to use this as an access token
  try {
    const { data, error } = await supabase.auth.getUser(jwtToken);
    
    if (error) {
      console.log('❌ Token validation failed:', error.message);
    } else {
      console.log('✅ Token is valid!');
      console.log('User data:', data.user);
    }
  } catch (error) {
    console.log('❌ Error validating token:', error.message);
  }
} else {
  console.log('ℹ️  Cannot test token validation - Supabase credentials not configured');
  console.log('Please set up your Supabase credentials in the .env file first');
}