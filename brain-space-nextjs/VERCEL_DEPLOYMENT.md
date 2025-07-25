# Vercel Deployment Guide

## Status: Ready to Deploy ✅

The Next.js app now builds successfully with stable versions and is ready for deployment to Vercel.

**Key fixes made:**
- ✅ Fixed autoprefixer dependency issue
- ✅ Downgraded to Next.js 14.2.15 + React 18 (stable versions compatible with Vercel)
- ✅ Converted next.config.ts to next.config.js for Next.js 14 compatibility
- ✅ Removed root vercel.json conflicts

## Deployment Steps

### 1. Connect to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New Project"
3. Import your GitHub repository
4. **IMPORTANT**: Set the **Root Directory** to `brain-space-nextjs` in the configuration
   - This is crucial because there's a `vercel.json` in the repository root for the old Vite app

### 2. Configure Build Settings

- **Framework Preset**: Next.js (auto-detected)
- **Root Directory**: `brain-space-nextjs`
- **Build Command**: `pnpm run build`
- **Output Directory**: `.next` (default)
- **Install Command**: `pnpm install`

### 3. Environment Variables

Add these environment variables in the Vercel dashboard:

#### Required Variables

```bash
# Firebase Configuration (Public - safe for client)
NEXT_PUBLIC_FIREBASE_API_KEY=your_value
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_value
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_value
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_value
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_value
NEXT_PUBLIC_FIREBASE_APP_ID=your_value
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_value

# AI Provider Keys (Server-only - REQUIRED for AI features)
OPENAI_API_KEY=your_openai_key
GOOGLE_AI_API_KEY=your_google_ai_key
ANTHROPIC_API_KEY=your_anthropic_key

# Default AI Provider
NEXT_PUBLIC_AI_PROVIDER=google
```

#### Optional Variables (for full functionality)

```bash
# Firebase Admin SDK (for server-side Firebase operations)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Google Calendar Integration
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
NEXT_PUBLIC_GOOGLE_API_KEY=your_google_api_key
NEXT_PUBLIC_GOOGLE_CALENDAR_DISCOVERY_DOC=https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest
NEXT_PUBLIC_GOOGLE_CALENDAR_SCOPES=https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events
```

### 4. Deploy

1. Click "Deploy" in Vercel
2. Wait for the build to complete
3. Your app will be available at `https://your-project.vercel.app`

## Post-Deployment

### Custom Domain (Optional)
1. Go to your project settings in Vercel
2. Navigate to "Domains"
3. Add your custom domain

### Environment Variables Updates
- Changes to environment variables require a redeployment
- Use Vercel's dashboard to manage environment variables securely

## Known Issues & Solutions

### ESLint Warnings
The app has multiple ESLint warnings (console.log statements, unused variables). These don't prevent deployment but should be cleaned up for production quality.

### Missing Components
Some components from the React app haven't been migrated yet. The core functionality works, but you may want to complete the migration for full feature parity.

## Security Notes

1. **Never commit `.env.local` to version control**
2. **AI API keys must be server-side only** (no NEXT_PUBLIC_ prefix)
3. **Firebase Admin credentials are sensitive** - handle with care
4. **Enable Vercel's environment variable encryption**

## Testing Production Build Locally

```bash
cd brain-space-nextjs
pnpm run build
pnpm run start
```

Visit http://localhost:3000 to test the production build.