# AI Provider Setup Guide

## Overview
Brain Space supports multiple AI providers for enhancing your nodes. The AI helps categorize thoughts, extract tags, set priorities, and expand on your ideas.

## Supported Providers

### 1. OpenAI (GPT-4)
**Best for**: General purpose, high-quality responses
**Cost**: ~$0.01-0.03 per request

### 2. Google AI (Gemini)
**Best for**: Fast responses, good for basic categorization
**Cost**: Free tier available (60 requests/minute)

### 3. Anthropic (Claude)
**Best for**: Thoughtful analysis, nuanced categorization
**Cost**: ~$0.01-0.03 per request

## Quick Setup

### Step 1: Get API Keys

#### OpenAI
1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Copy the key (starts with `sk-`)

#### Google AI (Gemini)
1. Go to https://makersuite.google.com/app/apikey
2. Click "Create API Key"
3. Copy the key

#### Anthropic
1. Go to https://console.anthropic.com/settings/keys
2. Create a new API key
3. Copy the key

### Step 2: Add to Environment Variables

Open `.env.local` and add your keys:

```env
# AI Provider Keys (choose one or more)
OPENAI_API_KEY=sk-your-openai-key-here
GOOGLE_AI_API_KEY=your-google-ai-key-here
ANTHROPIC_API_KEY=your-anthropic-key-here

# Set default provider (optional)
NEXT_PUBLIC_AI_PROVIDER=openai  # or 'google' or 'anthropic'
```

### Step 3: Restart Your Dev Server

```bash
# Stop the server (Ctrl+C) then:
pnpm dev
```

## Testing Your Setup

1. Go to `/ai-test` for the AI Provider Test Page
2. Go to `/nodes` or press `Cmd+K` for Quick Add
2. Make sure "Enhance with AI" is checked
3. Type something like:
   - "Plan a trip to Japan"
   - "Build a mobile app for tracking habits"
   - "Learn machine learning"
4. The AI should categorize it and suggest tags

## What the AI Does

When you enable "Enhance with AI", it will:
- **Categorize** your thought (goal, task, idea, question, etc.)
- **Generate a title** if your input is long
- **Extract tags** relevant to the content
- **Set urgency/importance** scores (1-10)
- **Detect due dates** from natural language
- **Expand** on brief ideas with more context

## Cost Management

### Free Options
1. **Google AI (Gemini)**: 60 requests/minute free
2. **Mock Provider**: Always free (basic categorization only)

### Paid Options (Approximate)
- **OpenAI GPT-4**: $0.01-0.03 per enhancement
- **Anthropic Claude**: $0.01-0.03 per enhancement

### Tips to Reduce Costs
1. Use the mock provider for testing
2. Only enable AI enhancement when needed
3. Start with Google AI's free tier

## Security Notes

- API keys are stored in `.env.local` (never committed to git)
- Keys are only used server-side (never exposed to browser)
- Each request is authenticated with your Firebase user

## Troubleshooting

### "AI enhancement failed"
- Check your API key is correct
- Verify you have credits/quota remaining
- Check browser console for specific errors

### "Mock provider being used"
- Ensure you've added API keys to `.env.local`
- Restart the dev server after adding keys
- Check NEXT_PUBLIC_AI_PROVIDER is set correctly

### Rate Limits
- **OpenAI**: 3-10 requests/minute (depending on tier)
- **Google AI**: 60 requests/minute (free tier)
- **Anthropic**: Varies by plan

## Advanced Configuration

### Using Multiple Providers
You can add multiple API keys and switch between them. The app will show a provider selector when multiple keys are configured.

### Custom System Prompts
Edit `/app/api/ai/enhance-node/route.ts` to customize how the AI analyzes your thoughts.