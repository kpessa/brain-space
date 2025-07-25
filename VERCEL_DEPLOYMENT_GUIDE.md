# Vercel Deployment Guide for Brain Space Next.js

## Current Status

The app has been successfully restructured to work with Vercel:
- Removed route groups `(dashboard)` to avoid client-reference-manifest.js generation issues
- All dashboard pages now live under `/dashboard/*` paths
- Successfully builds locally with `pnpm run build`

## Deployment Steps

### 1. Local Build Verification
```bash
cd brain-space-nextjs
pnpm install
pnpm run build
```

### 2. Vercel CLI Deployment
From the root directory:
```bash
vercel --prod
```

### 3. Vercel Dashboard Configuration

If deploying through the Vercel dashboard:

1. **Import Git Repository**
   - Connect to GitHub and select `kpessa/brain-space`

2. **Configure Build Settings**
   - **Framework Preset**: Next.js
   - **Root Directory**: `brain-space-nextjs`
   - **Build Command**: `pnpm run build`
   - **Output Directory**: `.next` (Next.js default)
   - **Install Command**: `pnpm install`

3. **Environment Variables**
   Add the following environment variables in Vercel:
   ```
   # Firebase Configuration (Public)
   NEXT_PUBLIC_FIREBASE_API_KEY=
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
   NEXT_PUBLIC_FIREBASE_APP_ID=
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=

   # AI Provider API Keys (Server-side only)
   OPENAI_API_KEY=
   GOOGLE_AI_API_KEY=

   # Optional: Firebase Admin SDK (for future use)
   FIREBASE_ADMIN_PROJECT_ID=
   FIREBASE_ADMIN_CLIENT_EMAIL=
   FIREBASE_ADMIN_PRIVATE_KEY=
   ```

## Route Structure

After restructuring to fix Vercel deployment:
- `/` - Home page (redirects to `/dashboard` or `/login`)
- `/login` - Login page
- `/dashboard` - Main dashboard
- `/dashboard/journal` - Journal entries
- `/dashboard/braindump` - Brain dump feature
- `/dashboard/nodes` - Node management
- `/dashboard/progress` - Progress tracking
- `/dashboard/timebox` - Time management
- `/dashboard/routines` - Daily routines
- `/dashboard/calendar` - Calendar integration

## Troubleshooting

### Missing client-reference-manifest.js
This was fixed by removing route groups. If this error reappears:
1. Ensure all pages have `'use client'` directive
2. Check that dynamic imports are properly configured
3. Verify build output includes manifest files

### Environment Variables
- All `NEXT_PUBLIC_*` variables are available on client and server
- Non-prefixed variables (API keys) are server-side only
- Verify variables are added in Vercel dashboard

### Build Errors
1. Check build logs in Vercel dashboard
2. Ensure all dependencies are in `package.json`
3. Verify Node.js version compatibility (18.x or later)

## Post-Deployment

1. **Custom Domain** (Optional)
   - Add custom domain in Vercel project settings
   - Update DNS records as instructed

2. **Production Testing**
   - Test authentication flow
   - Verify AI categorization works
   - Check all dashboard routes load correctly

3. **Monitoring**
   - Enable Vercel Analytics
   - Set up error tracking (e.g., Sentry)
   - Monitor function execution times

## Notes

- The app uses Next.js 14.2.18 (stable) for Vercel compatibility
- Firebase Authentication works with popup/redirect flow
- AI services are configured through server-side API routes
- All sensitive keys must be added as environment variables in Vercel