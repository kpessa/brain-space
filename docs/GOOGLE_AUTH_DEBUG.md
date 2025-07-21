# Google Auth Debug Steps

## Issue
Google OAuth isn't working because credentials aren't configured in your local Supabase instance.

## Solution Steps

### 1. Get Google OAuth Credentials
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Navigate to "APIs & Services" → "Credentials"
4. Click "Create Credentials" → "OAuth client ID"
5. Select "Web application"
6. Add these redirect URIs:
   - `http://127.0.0.1:54321/auth/v1/callback`
   - `http://localhost:54321/auth/v1/callback`
7. Copy the Client ID and Client Secret

### 2. Configure Local Environment
1. Edit `.env` file and replace placeholders:
   ```
   GOOGLE_CLIENT_ID=your-actual-client-id
   GOOGLE_CLIENT_SECRET=your-actual-client-secret
   ```

### 3. Restart Supabase
```bash
pnpm supabase stop
pnpm supabase start
```

### 4. Test Authentication
1. Run your dev server: `pnpm run dev`
2. Navigate to http://localhost:5173
3. Use the AuthDebug component to test Google sign-in

## Common Issues

### "Redirect URI mismatch" error
- Make sure the redirect URIs in Google Console match exactly:
  - `http://127.0.0.1:54321/auth/v1/callback`
  - `http://localhost:54321/auth/v1/callback`

### "Invalid client" error
- Check that your Google credentials are correctly set in `.env`
- Ensure Supabase was restarted after adding credentials

### Auth redirects to wrong port
- The AuthContext handles this by detecting Storybook (port 6006) and redirecting to the main app

## Debugging Tips
1. Check Supabase logs: `pnpm supabase db logs`
2. Use the AuthDebug component at `/auth-debug` route
3. Check browser console for OAuth errors
4. Verify credentials are loaded: `env | grep GOOGLE`