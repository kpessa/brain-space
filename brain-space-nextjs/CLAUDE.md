# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## High-Level Architecture

Brain Space is a PWA-first personal knowledge management system with a Next.js frontend and Firebase backend. The application has been migrated from Vite to Next.js 15 with App Router, maintaining the brain dump flow for capturing thoughts, which are then processed by AI services to categorize and organize them into structured nodes.

### Key Architecture Components:

1. **Frontend (Next.js 15 + React 19 + TypeScript)**
   - `/app/`: Next.js App Router pages and layouts
   - `/app/api/`: API routes for AI services
   - `/components/`: Reusable UI components
   - `/contexts/`: React contexts (AuthContext)
   - `/hooks/`: Custom React hooks
   - `/store/`: Zustand stores for state management
   - `/lib/`: Utility functions and Firebase configuration
   - `/services/`: Business logic and AI service integration

2. **Backend**
   - Firebase Auth for authentication
   - Firestore for data persistence (planned)
   - Next.js API routes for serverless AI processing
   - Support for multiple AI providers (OpenAI, Google AI/Gemini)

3. **AI Service Architecture**
   - API routes handle AI provider selection
   - Support for OpenAI, Google AI (Gemini), and mock providers
   - Secure API key management via environment variables
   - Mock AI service for development without API keys

## Common Development Commands

```bash
# Package manager - ALWAYS use pnpm
pnpm install              # Install dependencies
pnpm run dev             # Start Next.js development server with Turbopack
pnpm run build           # Build for production
pnpm run start           # Start production server
pnpm run lint            # Run Next.js ESLint configuration
```

## AI Provider Configuration

The app supports multiple AI providers through environment variables:

```env
# Provider-specific API keys (stored securely on server)
OPENAI_API_KEY=your_key
GOOGLE_AI_API_KEY=your_key

# Firebase configuration (public keys)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=...
```

## Development Workflow

1. **Route Structure**: Pages use Next.js App Router in `/app/` directory
2. **API Routes**: Server-side AI processing in `/app/api/` 
3. **State Management**: Zustand stores in `/store/` for global state
4. **AI Integration**: Brain dump flow calls `/api/ai/categorize` endpoint
5. **TypeScript**: Configured for rapid prototyping with relaxed rules (strict mode disabled)

## Key Features & API Endpoints

### Brain Dump Flow
1. User enters thoughts in brain dump page (`/braindump`)
2. Frontend sends POST request to `/api/ai/categorize`
3. API route processes with selected AI provider
4. Results include categorized thoughts with node data
5. User can convert thoughts to structured nodes

### AI API Route (`/api/ai/categorize`)
- Accepts `text` and optional `provider` in request body
- Provider options: `openai`, `google`/`gemini`, `mock` (default)
- Returns categorized thoughts with confidence scores
- Includes node data with type, title, tags, urgency, importance

### Firebase Integration
- Auth handled via Firebase Admin SDK
- Optional token verification in production
- Client-side Firebase config in `/lib/firebase.ts`
- Admin SDK config in `/lib/firebase-admin.ts`

## Important Notes

- TypeScript strict mode is intentionally disabled for rapid prototyping
- Always use `pnpm` for package management
- Path alias `@/` configured for imports from root directory
- Using Next.js 15 with React 19 and Turbopack for fast development
- All AI API keys must be server-side environment variables (not NEXT_PUBLIC_)