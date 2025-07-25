# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Current Status: Migration to Next.js

**Important**: This project is currently being migrated from a React (Vite) + Firebase architecture to a Next.js fullstack application with React Server Components and App Router. The Next.js app is located in the `brain-space-nextjs/` subdirectory.

## High-Level Architecture

Brain Space is a PWA-first personal knowledge management system currently transitioning from a React frontend and Firebase backend to a Next.js fullstack architecture. The application uses a brain dump flow for capturing thoughts, which are then processed by AI services to categorize and organize them into structured nodes.

### Key Architecture Components:

1. **Current Frontend (Vite + React + TypeScript)** - Being migrated
   - `/src/components/`: Reusable UI components with Storybook stories
   - `/src/pages/`: Page-level components (Journal, Timebox, Progress, etc.)
   - `/src/store/`: Zustand stores for state management
   - `/src/lib/`: Utility functions and services
   - `/src/services/`: Business logic (AI providers, logging, sync)

2. **New Next.js Application** (in `brain-space-nextjs/`)
   - App Router with React Server Components
   - Server-side rendering and API routes
   - Gradual migration of components from the React app
   - Modern Next.js patterns and best practices

3. **Backend (Firebase + Genkit)**
   - Firebase Auth for authentication
   - Firestore for data persistence
   - Firebase Functions for serverless AI processing
   - Genkit for AI model orchestration

4. **AI Service Architecture**
   - Factory pattern for swappable AI providers (OpenAI, Anthropic, Firebase)
   - Firebase-hosted Genkit functions for secure API key management
   - Mock AI service for development without API keys

## Common Development Commands

```bash
# Package manager - ALWAYS use pnpm
pnpm install              # Install dependencies

# React App (Current)
pnpm run dev             # Start development server
pnpm run storybook       # Start Storybook for component development

# Next.js App (New)
cd brain-space-nextjs && pnpm run dev  # Start Next.js development server

# Testing & Quality
pnpm run lint            # Run ESLint
pnpm run lint:fix        # Auto-fix linting issues
pnpm run format          # Format code with Prettier
pnpm run type-check      # TypeScript type checking

# Building
pnpm run build           # Build for production
pnpm run preview         # Preview production build

# Firebase Development
firebase emulators:start # Start all Firebase emulators
cd functions && pnpm run genkit:start # Start Genkit AI flows

# Firebase Deployment
./deploy-functions.sh    # Deploy Firebase functions (quick method)
firebase deploy --only functions # Deploy functions manually
firebase deploy          # Deploy everything (hosting, functions, rules)

# Supabase CLI (requires password)
supabase --password <password> [command] # Use --password flag for all commands
```

## AI Provider Configuration

The app supports multiple AI providers through environment variables:

```env
# Choose AI provider: 'firebase' | 'openai' | 'anthropic' | 'mock'
VITE_AI_PROVIDER=firebase

# Provider-specific keys (only needed for direct API calls)
VITE_OPENAI_API_KEY=your_key
VITE_ANTHROPIC_API_KEY=your_key

# Firebase configuration
VITE_FIREBASE_API_KEY=...
VITE_USE_FIREBASE_EMULATORS=true # For local development
```

For production, use Firebase Functions with secrets:
```bash
firebase functions:secrets:set GOOGLE_AI_API_KEY
firebase functions:secrets:set OPENAI_API_KEY
```

## Development Workflow

### Current React App
1. **Component Development**: Create components in `/src/components/` with corresponding `.stories.tsx` files
2. **State Management**: Use Zustand stores in `/src/store/` for global state
3. **AI Integration**: The brain dump flow uses AI to categorize thoughts into structured nodes
4. **Firebase Sync**: Authentication and data persistence handled through Firebase services
5. **TypeScript**: Configured for rapid prototyping with relaxed rules (warnings instead of errors)

### Migration Strategy to Next.js
1. **Gradual Migration**: Components are being migrated one by one to `brain-space-nextjs/`
2. **Server Components**: Leveraging React Server Components for better performance
3. **API Routes**: Moving backend logic to Next.js API routes
4. **Shared Code**: Reusing types, utilities, and business logic where possible
5. **Parallel Development**: Both apps can run simultaneously during migration

## Key Features & Flows

### Brain Dump Flow
1. User enters thoughts in `BrainDumpInput`
2. Thoughts are processed by AI service (`categorizeThoughts`)
3. Results displayed in `BrainDumpFlow` with categories and relationships
4. User can convert thoughts to structured nodes

### AI Service Selection
- `createAIService()` factory in `/src/services/ai.ts` handles provider selection
- Firebase provider preferred for security (API keys stored as secrets)
- Falls back to mock service if no provider configured

### Firebase Integration
- Auth state managed in `AppWithFirebase.tsx`
- Firestore rules in `firestore.rules`
- Functions deployed to handle AI categorization securely

## Important Notes

- TypeScript is intentionally configured for rapid prototyping (lenient rules)
- Always use `pnpm` for package management
- Component-first development with Storybook
- Path alias `@/` configured for imports from `/src/`
- PWA features enabled with Vite PWA plugin
- Firebase emulators available for local development