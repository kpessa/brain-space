import { initializeApp } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getStorage, connectStorageEmulator } from 'firebase/storage'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

// Suppress expected Firebase errors that don't affect functionality
if (typeof window !== 'undefined') {
  const originalError = console.error
  console.error = (...args) => {
    const errorString = args[0]?.toString?.() || ''
    
    // Suppress these expected errors
    if (
      errorString.includes('Failed to load resource') ||
      errorString.includes('Fetch API cannot load') ||
      errorString.includes('__/firebase/init.json') || // Firebase looking for hosted config
      errorString.includes('__/firebase/init.js') // Alternative Firebase config file
    ) {
      // These errors are expected when not using Firebase Hosting
      return
    }
    
    originalError.apply(console, args)
  }
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize services
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

// Connect to emulators in development
if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true') {
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true })
  connectFirestoreEmulator(db, 'localhost', 8080)
  connectStorageEmulator(storage, 'localhost', 9199)
}

// Enable offline persistence for Firestore
import { enableIndexedDbPersistence } from 'firebase/firestore'

enableIndexedDbPersistence(db).catch(err => {
  if (err.code === 'failed-precondition') {
    console.warn('Offline persistence failed: Multiple tabs open')
  } else if (err.code === 'unimplemented') {
    console.warn('Offline persistence not available in this browser')
  }
})

export default app
