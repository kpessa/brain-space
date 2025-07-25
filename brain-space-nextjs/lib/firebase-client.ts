// Client-side Firebase initialization with better error handling
import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { getAuth, Auth } from 'firebase/auth'
import { getFirestore, Firestore, initializeFirestore, persistentLocalCache } from 'firebase/firestore'
import { getStorage, FirebaseStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

let app: FirebaseApp
let auth: Auth
let db: Firestore
let storage: FirebaseStorage

try {
  // Initialize Firebase only if it hasn't been initialized
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig)
    
    // Initialize Firestore with offline persistence to handle connection issues
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({}),
    })
  } else {
    app = getApps()[0]
    db = getFirestore(app)
  }

  auth = getAuth(app)
  storage = getStorage(app)

  if (typeof window !== 'undefined') {
    console.log('Firebase initialized successfully')
  }
} catch (error) {
  console.error('Firebase initialization error:', error)
  // Fallback to basic initialization
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
  auth = getAuth(app)
  db = getFirestore(app)
  storage = getStorage(app)
}

export { app, auth, db, storage }