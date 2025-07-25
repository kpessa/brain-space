# Firebase Setup and Testing Guide

## Quick Start

1. **Copy environment variables**:
   ```bash
   cp .env.example .env.local
   ```

2. **Update `.env.local`** with your Firebase configuration from the Firebase Console.

3. **Start the development server**:
   ```bash
   pnpm dev
   ```

4. **Visit the test page**: http://localhost:3000/test

## Firebase Connection Troubleshooting

### If you see "Failed to load resource: Could not connect to the server"

This error usually means Firebase is trying to connect to emulators that aren't running.

**Solution**: Make sure `NEXT_PUBLIC_USE_FIREBASE_EMULATORS=false` in your `.env.local` file.

### Using Firebase Emulators (Optional)

If you want to use Firebase emulators for local development:

1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Set `NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true` in `.env.local`

3. Start emulators:
   ```bash
   firebase emulators:start
   ```

4. Access emulator UI at: http://localhost:4000

## Testing Authentication

1. **Visit the home page**: http://localhost:3000
   - You should see debug info showing auth status
   - Click "Test Firebase" to go to the test page

2. **On the test page** (http://localhost:3000/test):
   - Check Firebase Status section - all should show as initialized
   - Try different auth methods:
     - Email/Password sign up
     - Email/Password sign in
     - Google sign in
   - After signing in, test Firestore write/read

3. **Test protected routes**:
   - Sign in first
   - Visit http://localhost:3000/journal
   - You should be able to access the journal page

## Common Issues

### Google Sign-In Not Working
- Make sure your Firebase project has Google auth provider enabled
- Check that your domain is authorized in Firebase Console > Authentication > Settings

### Firestore Permission Denied
- Check firestore.rules file
- Make sure user is authenticated before trying to write

### Environment Variables Not Loading
- Restart the development server after changing .env.local
- Make sure variable names start with `NEXT_PUBLIC_` for client-side access

## Debug Information

The app includes debug logging in the browser console:
- Firebase configuration status
- Auth state changes
- Emulator connection status

Check the browser console for detailed error messages.