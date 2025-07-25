# Firebase Authentication Setup

## Steps to Enable Firebase Authentication:

1. **Set Environment Variables**
   Create or update your `.env` file with your Firebase configuration:

   ```env
   # Firebase Configuration (get these from Firebase Console)
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   
   # Enable Firebase Auth (set to true)
   VITE_USE_FIREBASE_AUTH=true
   VITE_USE_FIREBASE_EMULATORS=false
   ```

2. **Get Firebase Configuration**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Select your project
   - Click the gear icon → Project settings
   - Scroll down to "Your apps" and find your web app
   - Copy the configuration values

3. **Verify Google Auth is Enabled**
   - In Firebase Console, go to Authentication → Sign-in method
   - Ensure Google is enabled as a sign-in provider
   - Add your domain to the authorized domains list

4. **Restart the Development Server**
   ```bash
   # Stop the current server (Ctrl+C)
   # Start it again
   pnpm run dev
   ```

## Testing the Setup

1. Open your app in the browser
2. You should see the Firebase login page instead of the Supabase one
3. Click "Continue with Google" to sign in
4. After successful authentication, you'll be redirected to the app

## Troubleshooting

- **"Invalid API key"**: Check that your Firebase API key is correct in the .env file
- **"This domain is not authorized"**: Add your domain to Firebase Console → Authentication → Settings → Authorized domains
- **Login redirect issues**: Ensure your Firebase Auth Domain matches exactly what's in the console

## Switching Back to Supabase

To switch back to Supabase authentication, simply set:
```env
VITE_USE_FIREBASE_AUTH=false
```