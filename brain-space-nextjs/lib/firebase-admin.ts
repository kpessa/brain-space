import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

// Initialize Firebase Admin SDK only if credentials are available
let adminAuth: ReturnType<typeof getAuth> | null = null
let adminDb: ReturnType<typeof getFirestore> | null = null

try {
  if (!getApps().length) {
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

    if (projectId && clientEmail && privateKey) {
      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      })
      
      adminAuth = getAuth()
      adminDb = getFirestore()
    } else {
      console.warn('Firebase Admin SDK not initialized: Missing credentials')
    }
  } else {
    adminAuth = getAuth()
    adminDb = getFirestore()
  }
} catch (error) {
  console.error('Failed to initialize Firebase Admin:', error)
}

export { adminAuth, adminDb }