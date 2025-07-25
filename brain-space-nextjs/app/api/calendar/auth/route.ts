import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase-admin'

export async function GET(request: NextRequest) {
  try {
    // Get the current user from Firebase Auth
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    
    if (!adminAuth || !adminDb) {
      return NextResponse.json(
        { error: 'Firebase Admin not initialized' },
        { status: 500 }
      )
    }
    
    const decodedToken = await adminAuth.verifyIdToken(token)
    const userId = decodedToken.uid

    // Check if user has Google Calendar token stored
    const settingsDoc = await adminDb
      .collection('users')
      .doc(userId)
      .collection('settings')
      .doc('googleCalendar')
      .get()

    const data = settingsDoc.data()
    const hasToken = !!data?.google_access_token

    return NextResponse.json({
      isConnected: hasToken,
      lastUpdated: data?.updatedAt?.toDate() || null,
    })
  } catch (error) {
    console.error('Error checking calendar auth:', error)
    return NextResponse.json(
      { error: 'Failed to check calendar authorization' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Get the current user from Firebase Auth
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    
    if (!adminAuth || !adminDb) {
      return NextResponse.json(
        { error: 'Firebase Admin not initialized' },
        { status: 500 }
      )
    }
    
    const decodedToken = await adminAuth.verifyIdToken(token)
    const userId = decodedToken.uid

    // Clear Google Calendar token
    await adminDb
      .collection('users')
      .doc(userId)
      .collection('settings')
      .doc('googleCalendar')
      .update({
        google_access_token: null,
        updatedAt: new Date(),
      })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error disconnecting calendar:', error)
    return NextResponse.json(
      { error: 'Failed to disconnect calendar' },
      { status: 500 }
    )
  }
}