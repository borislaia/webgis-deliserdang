// Decode Supabase JWT Token
// This script decodes the Supabase service role JWT to extract credentials

const jwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5YWd5dGhod3pkbmNhbnRvc3pmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU3OTMzNywiZXhwIjoyMDc2MTU1MzM3fQ.17f0ddCBhmJAWy174lruwvpS2_F2EpxJ5ClHasDdPI8';

console.log('🔍 Supabase JWT Token Decoder');
console.log('==============================');
console.log('Token:', jwtToken);

// Split JWT into parts
const parts = jwtToken.split('.');
console.log('\n📋 JWT Structure:');
console.log('Parts:', parts.length);

if (parts.length === 3) {
  try {
    // Decode header
    const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
    console.log('\n📋 Header:');
    console.log(JSON.stringify(header, null, 2));
    
    // Decode payload
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    console.log('\n📦 Payload:');
    console.log(JSON.stringify(payload, null, 2));
    
    // Extract Supabase credentials
    console.log('\n🎯 Supabase Credentials:');
    console.log('========================');
    
    const projectRef = payload.ref;
    const supabaseUrl = `https://${projectRef}.supabase.co`;
    
    console.log('Project Reference:', projectRef);
    console.log('Supabase URL:', supabaseUrl);
    console.log('Role:', payload.role);
    console.log('Issuer:', payload.iss);
    console.log('Issued At:', new Date(payload.iat * 1000).toISOString());
    console.log('Expires At:', new Date(payload.exp * 1000).toISOString());
    
    // Check if token is expired
    const now = Math.floor(Date.now() / 1000);
    const isExpired = payload.exp < now;
    console.log('Token Expired:', isExpired ? '❌ YES' : '✅ NO');
    
    if (isExpired) {
      console.log('⚠️  This token has expired and cannot be used');
    } else {
      console.log('✅ Token is valid and can be used');
    }
    
    // Generate .env configuration
    console.log('\n🔧 Environment Configuration:');
    console.log('=============================');
    console.log('Add this to your /workspace/backend/.env file:');
    console.log('');
    console.log(`SUPABASE_URL=${supabaseUrl}`);
    console.log('SUPABASE_ANON_KEY=your_anon_key_here');
    console.log(`SUPABASE_SERVICE_ROLE_KEY=${jwtToken}`);
    console.log('');
    console.log('Note: You still need to get the anon key from your Supabase dashboard');
    console.log('Go to Settings > API in your Supabase project to get the anon key');
    
  } catch (error) {
    console.error('❌ Error decoding JWT:', error.message);
  }
} else {
  console.log('❌ Invalid JWT format');
}