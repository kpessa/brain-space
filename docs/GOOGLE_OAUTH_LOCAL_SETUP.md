# Setting up Google OAuth for Local Supabase

## Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **+ CREATE CREDENTIALS** > **OAuth client ID**
5. If prompted, configure the OAuth consent screen first:
   - Choose "External" user type for testing
   - Fill in the required fields (app name, support email)
   - Add your email to test users

## Step 2: Configure OAuth Client

1. For **Application type**, select **Web application**
2. Name your OAuth client (e.g., "Brain Space Local Dev")
3. Add these to **Authorized JavaScript origins**:
   ```
   http://localhost:54321
   http://localhost:5173
   http://127.0.0.1:54321
   http://127.0.0.1:5173
   ```
4. Add these to **Authorized redirect URIs**:
   ```
   http://localhost:54321/auth/v1/callback
   http://127.0.0.1:54321/auth/v1/callback
   ```
5. Click **CREATE**

## Step 3: Save Your Credentials

After creating, you'll get:
- **Client ID**: Something like `123456789012-abcdefghijklmnop.apps.googleusercontent.com`
- **Client Secret**: A long string of characters

## Step 4: Configure Local Supabase

### Option A: Using Supabase Studio (Easier)

1. Access Supabase Studio: http://127.0.0.1:54323
2. Navigate to **Authentication** > **Providers**
3. Find **Google** and click to enable it
4. Enter your Client ID and Client Secret
5. Save the configuration

### Option B: Using Environment Variables

1. Create a `.env` file in your supabase directory:
   ```bash
   cd /home/pessk/code/brain-space/supabase
   touch .env
   ```

2. Add your credentials:
   ```env
   GOOGLE_CLIENT_ID=your-client-id-here
   GOOGLE_CLIENT_SECRET=your-client-secret-here
   ```

3. The config.toml is already set up to read these environment variables

## Step 5: Restart Supabase

```bash
# Stop Supabase
supabase stop

# Start with new configuration
supabase start
```

## Step 6: Test the Integration

1. Run your app: `pnpm run dev`
2. Navigate to http://localhost:5173
3. Click "Continue with Google"
4. You should be redirected to Google's OAuth consent screen
5. After authorization, you'll be redirected back to your app

## Troubleshooting

### Common Issues:

1. **"Redirect URI mismatch"**
   - Make sure the redirect URI in Google Console exactly matches what Supabase is using
   - Check both http and https versions
   - Include the port number

2. **"Invalid client"**
   - Double-check your Client ID and Secret
   - Ensure there are no extra spaces or line breaks

3. **"This app is blocked"**
   - Make sure you've added your email to the test users in OAuth consent screen
   - Or publish your app (for production use)

### Checking Logs

View Supabase logs for auth issues:
```bash
supabase logs --auth
```

## Alternative: Quick Test Setup

If you just want to test quickly without Google OAuth:

1. Use Supabase's built-in email/password auth
2. Or use the magic link feature
3. These work out of the box without additional configuration