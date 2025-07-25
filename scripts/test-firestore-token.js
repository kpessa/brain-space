// Test script to verify Firestore token storage
// Run with: node scripts/test-firestore-token.js

import { initializeApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

// Initialize Firebase
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

async function testTokenStorage() {
  try {
    // Sign in with test user (replace with your test credentials)
    const email = 'test@example.com'
    const password = 'test123456'
    
    console.log('Signing in...')
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    const user = userCredential.user
    console.log('Signed in as:', user.email)

    // Test writing token
    const testToken = 'test_google_calendar_token_' + Date.now()
    const userRef = doc(db, 'users', user.uid, 'settings', 'googleCalendar')
    
    console.log('Writing test token to Firestore...')
    await setDoc(userRef, {
      google_access_token: testToken,
      updatedAt: new Date(),
    }, { merge: true })
    
    console.log('Token written successfully')

    // Test reading token
    console.log('Reading token from Firestore...')
    const docSnap = await getDoc(userRef)
    
    if (docSnap.exists()) {
      const data = docSnap.data()
      console.log('Token read successfully:', data.google_access_token)
      console.log('Updated at:', data.updatedAt.toDate())
    } else {
      console.log('No token document found')
    }

    // Clean up
    console.log('Cleaning up test token...')
    await setDoc(userRef, {
      google_access_token: null,
      updatedAt: new Date(),
    }, { merge: true })
    
    console.log('Test completed successfully!')
    process.exit(0)
  } catch (error) {
    console.error('Test failed:', error)
    process.exit(1)
  }
}

testTokenStorage()