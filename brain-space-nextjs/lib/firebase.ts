import { initializeApp, getApps } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getStorage, connectStorageEmulator } from 'firebase/storage'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

// Log config for debugging (without sensitive data)
if (typeof window !== 'undefined') {
  console.log('Firebase Config:', {
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId,
    hasApiKey: !!firebaseConfig.apiKey,
    hasAppId: !!firebaseConfig.appId,
  })

  // Suppress expected errors that don't affect functionality
  const originalError = console.error
  console.error = (...args) => {
    const errorString = args[0]?.toString?.() || ''
    if (
      errorString.includes('Failed to load resource') ||
      errorString.includes('Fetch API cannot load') ||
      errorString.includes('firestore.googleapis.com') ||
      errorString.includes('__/firebase/init.json') // Firebase looking for hosted config
    ) {
      // Suppress these errors - they're expected when not using Firebase Hosting
      return
    }
    originalError.apply(console, args)
  }
}

let app
let auth
let db
let storage

try {
  // Initialize Firebase only if it hasn't been initialized
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

  // Initialize services
  auth = getAuth(app)
  db = getFirestore(app)
  storage = getStorage(app)

  // Connect to emulators if enabled
  const useEmulators = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true'
  
  if (useEmulators && typeof window !== 'undefined') {
    console.log('Attempting to connect to Firebase emulators...')
    
    try {
      // @ts-ignore - emulator connection state
      if (!auth._canInitEmulator) {
        connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true })
        console.log('Connected to Auth emulator')
      }
    } catch (error) {
      console.warn('Failed to connect to Auth emulator:', error)
    }

    try {
      // @ts-ignore
      if (!db._settings?.host?.includes('localhost')) {
        connectFirestoreEmulator(db, 'localhost', 8080)
        console.log('Connected to Firestore emulator')
      }
    } catch (error) {
      console.warn('Failed to connect to Firestore emulator:', error)
    }

    try {
      // @ts-ignore
      if (!storage._protocol?.includes('localhost')) {
        connectStorageEmulator(storage, 'localhost', 9199)
        console.log('Connected to Storage emulator')
      }
    } catch (error) {
      console.warn('Failed to connect to Storage emulator:', error)
    }
  } else if (typeof window !== 'undefined') {
    console.log('Using production Firebase services')
  }
} catch (error) {
  console.error('Failed to initialize Firebase:', error)
  throw error
}

export { auth, db, storage }
export default app