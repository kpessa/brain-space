// Test script to check the OAuth URL
const SUPABASE_URL = 'http://127.0.0.1:54321';
const redirectTo = 'http://localhost:5174';

const authUrl = `${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectTo)}`;

console.log('OAuth URL that will be used:');
console.log(authUrl);
console.log('\nThe redirect_uri that Supabase will send to Google is:');
console.log(`${SUPABASE_URL}/auth/v1/callback`);
console.log('\nMake sure this ☝️ is added to your Google Console!');