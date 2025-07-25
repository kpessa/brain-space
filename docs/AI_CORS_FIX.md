# AI CORS Fix Documentation

## The Problem
Direct API calls to Anthropic and OpenAI from the browser are blocked by CORS (Cross-Origin Resource Sharing) policy.

## The Solution

### Development (Local)
- Uses Vite's proxy configuration in `vite.config.ts`
- Routes `/api/anthropic/*` → `https://api.anthropic.com/*`
- Routes `/api/openai/*` → `https://api.openai.com/*`

### Production (Vercel)
- Uses Vercel serverless functions in `/api` directory
- `/api/anthropic.ts` - Proxies requests to Anthropic
- `/api/openai.ts` - Proxies requests to OpenAI
- API keys are stored server-side for security

## What You Need to Do

### 1. Restart Your Dev Server
```bash
# Stop current server (Ctrl+C)
pnpm run dev
```

### 2. Try Creating a Brain Dump Again
The CORS error should be gone!

### 3. For Production Deployment
The `/api` directory will automatically be deployed as Vercel Functions.

## How It Works

### Development Flow:
```
Browser → Vite Proxy → Anthropic/OpenAI API
```

### Production Flow:
```
Browser → Vercel Function → Anthropic/OpenAI API
```

## Security Benefits
- API keys never exposed to browser
- Requests proxied through your server
- Can add rate limiting if needed

## Debugging
With debug mode enabled, you'll see:
- `Request URL: /api/anthropic/v1/messages` (development)
- `Request URL: /api/anthropic` (production)

Both will work without CORS issues!