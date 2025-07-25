# Firebase Functions Setup for AI Integration

This guide explains how to set up Firebase Functions to enable AI-powered brain dump categorization.

## Prerequisites

1. Firebase CLI installed
2. Firebase project configured
3. OpenAI or Anthropic API key

## Setup Steps

### 1. Install Functions Dependencies

```bash
cd functions
npm install
```

### 2. Configure API Keys

Set your API keys as Firebase Functions environment variables:

```bash
# For OpenAI
firebase functions:config:set openai.api_key="sk-your-openai-api-key"

# For Anthropic
firebase functions:config:set anthropic.api_key="sk-your-anthropic-api-key"
```

### 3. Test Locally

Run the Firebase emulators:

```bash
firebase emulators:start
```

The functions will be available at:
- `http://localhost:5001/your-project-id/us-central1/categorizeThoughts`

### 4. Deploy to Production

Deploy the functions:

```bash
firebase deploy --only functions
```

### 5. Update Environment Variables

Make sure your `.env` file has:

```env
VITE_USE_FIREBASE_AUTH=true
VITE_AI_PROVIDER=openai  # or 'anthropic'
```

## How It Works

1. **Client-side**: When AI categorization is enabled, the app calls the Firebase Function instead of making direct API calls
2. **Authentication**: The function verifies the user's Firebase Auth token
3. **API Call**: The function makes the actual API call to OpenAI or Anthropic
4. **Response**: Results are returned to the client

## Security Benefits

- API keys are never exposed to the client
- Authentication is required for all requests
- CORS is properly configured
- Rate limiting can be added if needed

## Troubleshooting

### "Unauthorized" Error
- Make sure you're logged in with Firebase Auth
- Check that the ID token is being sent correctly

### "API key not configured" Error
- Verify the Firebase Functions config was set correctly:
  ```bash
  firebase functions:config:get
  ```

### CORS Issues
- The function already includes CORS handling
- Make sure you're using the correct function URL

## Cost Considerations

- Firebase Functions have a free tier (125K invocations/month)
- You'll also pay for the AI API usage (OpenAI or Anthropic)
- Consider implementing caching or rate limiting for production use