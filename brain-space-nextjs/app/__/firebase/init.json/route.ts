import { NextResponse } from 'next/server'

/**
 * Firebase Auth Redirect Configuration Endpoint
 * 
 * When using Firebase Auth with redirect-based authentication and a Firebase authDomain,
 * the Firebase SDK automatically requests /__/firebase/init.json to get configuration.
 * 
 * Since we're hosting on Vercel (not Firebase Hosting), we need to provide this
 * endpoint ourselves to prevent 404 errors during the auth redirect flow.
 * 
 * This endpoint returns the Firebase configuration that the client SDK needs
 * to complete the redirect authentication flow.
 */
export async function GET() {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  }

  // Return the configuration in the format Firebase expects
  return NextResponse.json(config, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'private, max-age=3600', // Cache for 1 hour
    },
  })
}