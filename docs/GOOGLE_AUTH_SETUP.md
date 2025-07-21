# Google Authentication Setup with Supabase

## Local Development Setup

1. **Environment Variables**
   - Already configured in `.env.local`
   - Using local Supabase instance (http://127.0.0.1:54321)

2. **Enable Google Provider in Supabase**
   ```bash
   # Access Supabase Studio
   http://127.0.0.1:54323
   ```

3. **Configure Google OAuth**
   - Go to Authentication > Providers in Supabase Studio
   - Enable Google provider
   - You'll need to add Google OAuth credentials

## Google Cloud Console Setup

1. **Create OAuth 2.0 Credentials**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable Google+ API
   - Create OAuth 2.0 credentials

2. **Configure OAuth Consent Screen**
   - Add authorized domains
   - Set application name and logo

3. **Add Redirect URIs**
   - For local development: `http://localhost:54321/auth/v1/callback`
   - For production: `https://your-project.supabase.co/auth/v1/callback`

4. **Copy Credentials to Supabase**
   - Copy Client ID and Client Secret
   - Add them to Supabase Authentication > Providers > Google

## Production Setup

When you're ready to deploy:

1. **Update Environment Variables**
   ```env
   VITE_SUPABASE_URL=https://rtxfdwtsuhxggrdcuspe.supabase.co
   VITE_SUPABASE_ANON_KEY=your-production-anon-key
   ```

2. **Update Google OAuth Redirect URI**
   - Add your production Supabase URL to Google Console

## Testing Authentication

1. Run the development server:
   ```bash
   pnpm run dev
   ```

2. Navigate to the app and click "Continue with Google"

3. After successful authentication, you'll be redirected back to the app

## Troubleshooting

- If authentication fails, check Supabase logs in Studio
- Ensure redirect URIs match exactly in Google Console
- Check that Google provider is enabled in Supabase