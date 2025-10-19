// Comprehensive Token Analysis Tool
// Analyzes various types of tokens and encoded data

const token = 'yl4txuboW1CCG3SUUWUfuJ4b3tPTeiRqQvhjJUWTcRoJ1qrp1qhFSYgEGx1dJ3aQ/yYegrJTdcTXLy4G7YVftQ==';

console.log('🔍 Token Analysis Tool');
console.log('=====================');
console.log('Token:', token);
console.log('Length:', token.length, 'characters');
console.log('Character set:', /^[A-Za-z0-9+/=]+$/.test(token) ? 'Base64-like' : 'Mixed characters');

// Check if it's a JWT
const jwtParts = token.split('.');
console.log('\n📋 JWT Analysis:');
console.log('Parts:', jwtParts.length);
if (jwtParts.length === 3) {
  console.log('✅ This is a JWT format');
  try {
    const header = JSON.parse(Buffer.from(jwtParts[0], 'base64').toString());
    const payload = JSON.parse(Buffer.from(jwtParts[1], 'base64').toString());
    console.log('Header:', header);
    console.log('Payload:', payload);
  } catch (e) {
    console.log('❌ JWT decode failed:', e.message);
  }
} else {
  console.log('❌ Not a JWT (needs 3 parts separated by dots)');
}

// Check if it's a Supabase access token or session token
console.log('\n🔑 Supabase Token Analysis:');
console.log('This could be:');
console.log('1. Supabase access token (for API calls)');
console.log('2. Supabase session token (for authentication)');
console.log('3. Encoded user data or session data');
console.log('4. Some other type of encoded token');

// Try to decode as base64
console.log('\n🔓 Base64 Decode Attempt:');
try {
  const decoded = Buffer.from(token, 'base64').toString('utf8');
  console.log('Decoded (UTF-8):', decoded);
  
  // Try to parse as JSON
  try {
    const jsonData = JSON.parse(decoded);
    console.log('Decoded JSON:', JSON.stringify(jsonData, null, 2));
  } catch (e) {
    console.log('Not valid JSON');
  }
} catch (e) {
  console.log('❌ Base64 decode failed:', e.message);
}

// Check for common patterns
console.log('\n🔍 Pattern Analysis:');
console.log('Contains slashes:', token.includes('/'));
console.log('Contains plus signs:', token.includes('+'));
console.log('Contains equals signs:', token.includes('='));
console.log('Ends with equals:', token.endsWith('='));
console.log('Ends with double equals:', token.endsWith('=='));

// Check if it could be a Supabase token format
console.log('\n🎯 Supabase Token Characteristics:');
console.log('Length is typical for Supabase tokens:', token.length > 50 && token.length < 200);
console.log('Contains base64 characters:', /^[A-Za-z0-9+/=]+$/.test(token));

// Try different decoding approaches
console.log('\n🛠️  Alternative Decoding Attempts:');

// Try URL-safe base64
try {
  const urlSafeDecoded = Buffer.from(token.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
  console.log('URL-safe base64 decode:', urlSafeDecoded);
} catch (e) {
  console.log('URL-safe base64 decode failed');
}

// Try hex decode
try {
  const hexDecoded = Buffer.from(token, 'hex').toString('utf8');
  console.log('Hex decode:', hexDecoded);
} catch (e) {
  console.log('Hex decode failed');
}

console.log('\n💡 Recommendations:');
console.log('1. If this is a Supabase access token, you can use it with the Supabase client');
console.log('2. If this is a session token, it might be used for authentication');
console.log('3. Check your Supabase dashboard for token types and usage');
console.log('4. Try using this token with the Supabase client to see what it returns');