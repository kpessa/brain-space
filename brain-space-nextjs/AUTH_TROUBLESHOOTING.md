# Authentication Troubleshooting Guide

## Current Issue
The authentication is not working in production on Vercel. Users cannot log in with Google Sign-In.

## Debug Steps

### 1. Check Firebase Configuration in Vercel

Go to your Vercel project settings and ensure all Firebase environment variables are set:

```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
```

These should match the values from your Firebase project console.

### 2. Firebase Authorized Domains

In the Firebase Console:
1. Go to Authentication → Settings → Authorized domains
2. Add your Vercel production domain:
   - `brain-space-nextjs-4uij4xj0i-kpessas-projects.vercel.app`
   - `brain-space-nextjs.vercel.app` (if you have a custom domain)
   - Any other domains you're using

### 3. Use the Debug Page

Visit `/auth-debug` on your production site to see:
- Firebase configuration status
- Auth state information
- Direct Firebase auth listener status
- Error messages

### 4. Check Browser Console

Open the browser console and look for:
- CORS errors
- Firebase configuration errors
- Authentication errors

### 5. Auth Flow in Production

The app uses different auth flows:
- **Development**: Popup flow (signInWithPopup)
- **Production on Vercel**: Redirect flow (signInWithRedirect) to avoid COOP issues

### 6. Common Issues and Solutions

#### Issue: "Firebase: Error (auth/unauthorized-domain)"
**Solution**: Add your domain to Firebase authorized domains (see step 2)

#### Issue: "Cross-Origin-Opener-Policy" errors
**Solution**: The app automatically uses redirect flow in production to avoid this

#### Issue: Configuration not loading
**Solution**: Check that environment variables are set in Vercel dashboard

#### Issue: Redirect not working
**Solution**: Ensure your Firebase auth domain is correctly configured and matches your Firebase project

### 7. Testing Authentication

1. Visit the production site
2. Click "Sign in with Google"
3. If using redirect flow, you'll be redirected to Google
4. After signing in, you should be redirected back to the app
5. Check `/auth-debug` for auth state

### 8. Environment Variables Check

In Vercel dashboard:
1. Go to Settings → Environment Variables
2. Ensure all `NEXT_PUBLIC_FIREBASE_*` variables are set
3. These should be visible in the build logs

### 9. Firebase Console Checks

1. **Authentication is enabled**: Firebase Console → Authentication → Sign-in method → Google should be enabled
2. **OAuth consent screen**: If using Google Sign-In, ensure OAuth consent screen is configured
3. **API Keys**: Check that API key restrictions allow your domain

### 10. Next Steps if Still Not Working

1. Check the Vercel function logs for any server-side errors
2. Try clearing browser cache and cookies
3. Test in an incognito/private browser window
4. Check if the issue is specific to certain browsers

## Quick Fix Checklist

- [ ] Firebase environment variables set in Vercel
- [ ] Production domain added to Firebase authorized domains
- [ ] Google Sign-In enabled in Firebase
- [ ] No API key restrictions blocking the domain
- [ ] OAuth consent screen configured (if needed)
- [ ] Browser console checked for errors
- [ ] `/auth-debug` page checked for configuration issues

## Support

If you're still having issues:
1. Check the browser console for specific error messages
2. Visit `/auth-debug` for detailed auth state information
3. Check Vercel function logs for server-side errors
4. Ensure Firebase project is not in a restricted state