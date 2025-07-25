# Vercel Environment Variables Setup

This document lists all the environment variables that need to be configured in Vercel for the Brain Space Next.js application.

## Required Environment Variables

### Firebase Configuration (Public)
These are safe to expose in the browser:
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` (optional)

### Firebase Admin SDK (Server-only)
These must be kept secret:
- `FIREBASE_ADMIN_PROJECT_ID`
- `FIREBASE_ADMIN_CLIENT_EMAIL`
- `FIREBASE_ADMIN_PRIVATE_KEY` (Note: Must include the full key with `\n` characters preserved)

### AI Provider API Keys (Server-only)
Choose one or more AI providers:
- `OPENAI_API_KEY` - For OpenAI GPT models
- `GOOGLE_AI_API_KEY` - For Google AI (Gemini) models

### Google Calendar Integration (Public)
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` - Google OAuth 2.0 client ID
- `NEXT_PUBLIC_GOOGLE_API_KEY` - Google API key for Calendar API

## How to Set Environment Variables in Vercel

1. Go to your project settings in Vercel
2. Navigate to the "Environment Variables" section
3. Add each variable with its corresponding value
4. Select the appropriate environments (Production, Preview, Development)
5. For `FIREBASE_ADMIN_PRIVATE_KEY`, make sure to:
   - Include the entire private key including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`
   - Preserve the newline characters (`\n`)
   - You may need to wrap it in quotes

## Example Values

```env
# Firebase (Public)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyC...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-app
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-app.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Firebase Admin (Secret)
FIREBASE_ADMIN_PROJECT_ID=your-app
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-app.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQE...\n-----END PRIVATE KEY-----\n"

# AI Providers (Secret)
OPENAI_API_KEY=sk-...
GOOGLE_AI_API_KEY=AIzaSy...

# Google Calendar (Public)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=123456789-abcdefg.apps.googleusercontent.com
NEXT_PUBLIC_GOOGLE_API_KEY=AIzaSy...
```

## Verifying Configuration

After setting the environment variables:
1. Trigger a new deployment
2. Check the Functions tab in Vercel to ensure serverless functions are working
3. Test the AI categorization feature
4. Test Google Calendar integration
5. Test Firebase authentication

## Security Notes

- Never commit API keys to version control
- Use Vercel's environment variable encryption for sensitive values
- Regularly rotate API keys
- Monitor API usage to detect any unusual activity