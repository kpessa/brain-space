# Firebase Admin Setup for Production

This guide explains how to set up Firebase Admin SDK credentials in Vercel for production authentication.

## Prerequisites

1. Access to Firebase Console
2. Access to Vercel Dashboard
3. Project deployed to Vercel

## Steps to Configure Firebase Admin in Vercel

### 1. Generate Firebase Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to **Project Settings** (gear icon)
4. Go to **Service Accounts** tab
5. Click **Generate New Private Key**
6. Save the downloaded JSON file securely

### 2. Extract Required Values

From the downloaded service account JSON, you need three values:

```json
{
  "project_id": "your-project-id",
  "client_email": "firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
}
```

### 3. Add Environment Variables to Vercel

#### Option A: Using Vercel CLI

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Add environment variables
vercel env add FIREBASE_PROJECT_ID production
# Enter the project_id value when prompted

vercel env add FIREBASE_CLIENT_EMAIL production
# Enter the client_email value when prompted

vercel env add FIREBASE_PRIVATE_KEY production
# Enter the private_key value when prompted (include the entire key with BEGIN/END lines)
```

#### Option B: Using Vercel Dashboard

1. Go to your project in [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables for **Production** environment:

| Name | Value | Environment |
|------|-------|-------------|
| `FIREBASE_PROJECT_ID` | Your project ID from JSON | Production |
| `FIREBASE_CLIENT_EMAIL` | Service account email from JSON | Production |
| `FIREBASE_PRIVATE_KEY` | Private key from JSON (entire string) | Production |

**Important Notes for Private Key:**
- Include the entire private key string including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`
- The key should include the `\n` characters as they appear in the JSON
- Vercel will handle the newline characters correctly

### 4. Redeploy Your Application

After adding the environment variables:

1. Trigger a new deployment:
   ```bash
   vercel --prod
   ```
   
   Or push a commit to trigger automatic deployment:
   ```bash
   git commit --allow-empty -m "chore: Trigger deployment with Firebase Admin credentials"
   git push
   ```

2. Monitor the deployment logs for any errors

### 5. Verify Configuration

1. Visit `/auth-debug` on your production site
2. Check the "Server-Side Debug Data" section
3. Verify that:
   - `firebaseAdmin.initialized` is `true`
   - `firebaseAdmin.projectId` matches your project
   - `firebaseAdmin.hasClientEmail` is `true`
   - `firebaseAdmin.hasPrivateKey` is `true`

## Troubleshooting

### Common Issues

1. **"Firebase Admin SDK not initialized" error**
   - Verify all three environment variables are set correctly
   - Check for typos in variable names
   - Ensure variables are set for the correct environment (Production)

2. **"Invalid private key" error**
   - Make sure to include the full private key with header/footer
   - Check that newline characters (`\n`) are preserved
   - Try copying the private key directly from the JSON file

3. **Authentication still failing after setup**
   - Clear browser cookies and try again
   - Check Vercel function logs for detailed error messages
   - Verify Firebase project configuration allows your domain

### Security Best Practices

1. **Never commit service account credentials to Git**
2. **Limit service account permissions** - Create a custom role with only necessary permissions
3. **Rotate keys periodically** - Generate new keys every few months
4. **Monitor usage** - Check Firebase Admin SDK usage in Google Cloud Console

## Testing Authentication Flow

After setup is complete:

1. Visit your production site
2. Click "Continue with Google"
3. Complete the Google sign-in flow
4. You should be redirected to the protected route

If issues persist, check:
- Browser console for client-side errors
- `/auth-debug` page for detailed diagnostics
- Vercel function logs for server-side errors