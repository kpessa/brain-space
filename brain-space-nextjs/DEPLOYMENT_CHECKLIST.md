# Brain Space Deployment Checklist

## Pre-Deployment
- [x] Run `pnpm run build` locally to ensure no build errors
- [x] Run `pnpm run lint` to check for linting issues
- [x] Test production build locally with `pnpm run start`
- [x] Commit all changes to Git
- [x] Push to GitHub repository

## Vercel Configuration
- [x] Deploy to Vercel using CLI or GitHub integration
- [ ] Set all required environment variables in Vercel dashboard:
  - [ ] Firebase public configuration (NEXT_PUBLIC_FIREBASE_*)
  - [ ] Firebase Admin SDK credentials
  - [ ] AI provider API keys (OpenAI and/or Google AI)
  - [ ] Google Calendar OAuth credentials
- [ ] Verify deployment URL is accessible

## Post-Deployment Testing
- [ ] Test authentication flow:
  - [ ] Sign up with email/password
  - [ ] Sign in with Google
  - [ ] Sign out functionality
- [ ] Test core features:
  - [ ] Journal entry creation and XP system
  - [ ] Brain dump with AI categorization
  - [ ] Visual brain dump with React Flow
  - [ ] Eisenhower Matrix drag-and-drop
  - [ ] Unified todos dashboard
  - [ ] Recurring tasks and habits
  - [ ] Google Calendar integration
- [ ] Test AI features:
  - [ ] Brain dump categorization
  - [ ] Node enhancement
- [ ] Test data persistence:
  - [ ] Create entries and verify they persist after reload
  - [ ] Check Firebase Firestore for data

## Production URLs
- Deployment URL: https://brain-space-nextjs.vercel.app (or custom domain)
- Vercel Dashboard: https://vercel.com/kpessas-projects/brain-space-nextjs

## Monitoring
- [ ] Check Vercel Functions logs for any errors
- [ ] Monitor Firebase usage and quotas
- [ ] Check AI API usage and costs
- [ ] Set up error alerting (optional)

## Domain Configuration (Optional)
- [ ] Add custom domain in Vercel settings
- [ ] Update DNS records
- [ ] Enable HTTPS (automatic with Vercel)
- [ ] Update Firebase authorized domains
- [ ] Update Google OAuth authorized redirect URIs

## Final Steps
- [ ] Update README with production URL
- [ ] Document any deployment-specific configurations
- [ ] Share access with team members if needed