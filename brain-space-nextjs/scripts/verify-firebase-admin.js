#!/usr/bin/env node

/**
 * Script to verify Firebase Admin SDK configuration
 * Run with: node scripts/verify-firebase-admin.js
 */

const { config } = require('dotenv');

// Load environment variables
config({ path: '.env.local' });

console.log('Firebase Admin Configuration Check\n' + '='.repeat(40));

// Check required environment variables
const requiredVars = [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL', 
  'FIREBASE_PRIVATE_KEY'
];

const publicVars = [
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'
];

let hasErrors = false;

console.log('\n1. Checking Firebase Admin SDK variables:');
requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    if (varName === 'FIREBASE_PRIVATE_KEY') {
      // Check if private key has correct format
      const hasBegin = value.includes('-----BEGIN PRIVATE KEY-----');
      const hasEnd = value.includes('-----END PRIVATE KEY-----');
      const hasNewlines = value.includes('\\n') || value.includes('\n');
      
      console.log(`   ✓ ${varName}: Set (length: ${value.length})`);
      if (!hasBegin || !hasEnd) {
        console.log(`     ⚠️  Warning: Private key might be malformed (missing BEGIN/END markers)`);
        hasErrors = true;
      }
      if (!hasNewlines) {
        console.log(`     ⚠️  Warning: Private key might be missing newline characters`);
        hasErrors = true;
      }
    } else {
      console.log(`   ✓ ${varName}: ${varName.includes('EMAIL') ? value : value.substring(0, 20) + '...'}`);
    }
  } else {
    console.log(`   ✗ ${varName}: NOT SET`);
    hasErrors = true;
  }
});

console.log('\n2. Checking public Firebase variables:');
publicVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`   ✓ ${varName}: ${value.substring(0, 20)}...`);
  } else {
    console.log(`   ⚠️  ${varName}: NOT SET (optional but recommended)`);
  }
});

console.log('\n3. Checking project ID consistency:');
const adminProjectId = process.env.FIREBASE_PROJECT_ID;
const publicProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

if (adminProjectId && publicProjectId) {
  if (adminProjectId === publicProjectId) {
    console.log(`   ✓ Project IDs match: ${adminProjectId}`);
  } else {
    console.log(`   ✗ Project ID mismatch!`);
    console.log(`     Admin: ${adminProjectId}`);
    console.log(`     Public: ${publicProjectId}`);
    hasErrors = true;
  }
} else if (adminProjectId && !publicProjectId) {
  // Try to infer from other sources
  console.log(`   ⚠️  Using FIREBASE_PROJECT_ID: ${adminProjectId}`);
  console.log(`      Consider setting NEXT_PUBLIC_FIREBASE_PROJECT_ID for consistency`);
}

// Try to initialize Firebase Admin
console.log('\n4. Testing Firebase Admin initialization:');
try {
  const { initializeApp, cert, getApps } = require('firebase-admin/app');
  const { getAuth } = require('firebase-admin/auth');
  
  if (getApps().length === 0) {
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    
    if (projectId && clientEmail && privateKey) {
      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      
      console.log('   ✓ Firebase Admin SDK initialized successfully');
      
      // Try to get auth instance
      const auth = getAuth();
      console.log('   ✓ Firebase Auth instance created');
    } else {
      console.log('   ✗ Missing required credentials for initialization');
      hasErrors = true;
    }
  } else {
    console.log('   ✓ Firebase Admin SDK already initialized');
  }
} catch (error) {
  console.log('   ✗ Failed to initialize Firebase Admin SDK');
  console.log(`     Error: ${error.message}`);
  hasErrors = true;
}

// Summary
console.log('\n' + '='.repeat(40));
if (hasErrors) {
  console.log('❌ Configuration has errors. Please check the warnings above.');
  console.log('\nNext steps:');
  console.log('1. Ensure all required environment variables are set in .env.local');
  console.log('2. For production, add these variables to Vercel dashboard');
  console.log('3. See docs/FIREBASE_ADMIN_SETUP.md for detailed instructions');
  process.exit(1);
} else {
  console.log('✅ Firebase Admin configuration looks good!');
  console.log('\nNext steps:');
  console.log('1. Run "vercel env pull" to sync with Vercel');
  console.log('2. Deploy to production with "vercel --prod"');
  process.exit(0);
}