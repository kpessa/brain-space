# Environment Variables Setup for Vercel

Your Brain Space Next.js app has been successfully deployed to Vercel! 🎉

## Production URL
Your app should be available at the production URL shown in the deployment.

## Required Environment Variables

To make the app fully functional, you need to add the following environment variables in the Vercel dashboard:

### 1. Go to Vercel Dashboard
1. Navigate to your project in Vercel
2. Go to Settings → Environment Variables

### 2. Add Firebase Configuration (Client-side)
These are public keys that can be exposed to the client:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### 3. Add AI Provider Keys (Server-side only)
These are secret keys that should never be exposed to the client:

```
OPENAI_API_KEY=sk-...your_openai_key
GOOGLE_AI_API_KEY=your_google_ai_key
```

### 4. Optional: Firebase Admin SDK (for future features)
If you plan to use Firebase Admin SDK:

```
FIREBASE_ADMIN_PROJECT_ID=your_project_id
FIREBASE_ADMIN_CLIENT_EMAIL=your_service_account_email
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...your_key...\n-----END PRIVATE KEY-----\n"
```

## Testing Your Deployment

After adding the environment variables:

1. **Redeploy** - Vercel will automatically redeploy when you add environment variables
2. **Test Authentication** - Try logging in with Google
3. **Test AI Features** - Try the brain dump feature to test AI categorization
4. **Check Console** - Open browser console for any errors

## Troubleshooting

### Authentication Issues
- Ensure your Firebase project has Google auth enabled
- Add your Vercel domain to Firebase authorized domains:
  - Go to Firebase Console → Authentication → Settings → Authorized domains
  - Add your Vercel URLs (both preview and production)

### AI Features Not Working
- Verify API keys are correctly set in environment variables
- Check the server-side logs in Vercel for API errors
- Ensure you're not exceeding API rate limits

### CORS Issues
- The app is configured to handle CORS for AI APIs
- If you still get CORS errors, check browser console for details

## Next Steps

1. **Custom Domain** - Add a custom domain in Vercel settings
2. **Analytics** - Enable Vercel Analytics for insights
3. **Monitoring** - Set up error tracking (e.g., Sentry)
4. **Performance** - Monitor Core Web Vitals in Vercel dashboard

## Support

If you encounter issues:
1. Check Vercel function logs for server-side errors
2. Use browser DevTools for client-side debugging
3. Review the deployment logs in Vercel dashboard