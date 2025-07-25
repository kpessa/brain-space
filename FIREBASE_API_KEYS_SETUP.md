# Firebase Functions API Keys Setup

## Problem
The Firebase function is timing out because the Google AI API key is not configured.

## Solution

### 1. Local Development Setup

Add your API keys to the functions environment file:

```bash
# Edit functions/.env
cd functions
cp .env .env.local  # Create a local env file
```

Add the following to `functions/.env.local`:
```
GOOGLE_AI_API_KEY=your_actual_google_ai_api_key_here
OPENAI_API_KEY=your_openai_api_key_here  # Optional
```

### 2. Production Setup (Firebase Secrets)

For production, use Firebase secret management:

```bash
# Set the Google AI API key as a secret
firebase functions:secrets:set GOOGLE_AI_API_KEY

# Set the OpenAI API key as a secret (optional)
firebase functions:secrets:set OPENAI_API_KEY
```

### 3. Get a Google AI API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Create API Key"
3. Copy the key and add it to your `.env.local` file

### 4. Verify Setup

After adding the API key, restart the Firebase emulator:

```bash
# Stop the current emulator (Ctrl+C)
# Start it again
firebase emulators:start --only functions
```

You should see in the logs:
```
Initializing Genkit with API key: present
```

Instead of:
```
Initializing Genkit with API key: missing
```

### 5. Test the Function

Once the API key is configured, test the categorization:

```bash
# Using curl
curl -X POST http://localhost:5001/your-project-id/us-central1/categorizeThoughts \
  -H "Content-Type: application/json" \
  -d '{
    "text": "I need to call the dentist tomorrow",
    "provider": "gemini"
  }'
```

## Troubleshooting

If you still see timeouts:
1. Check that the `.env.local` file is in the `functions` directory, not the root
2. Ensure the API key is valid and has not exceeded its quota
3. Try using a shorter text input for testing
4. Check the Firebase Functions logs for specific error messages

## Security Notes

- Never commit `.env.local` files to version control
- Always use Firebase secrets for production deployments
- Keep your API keys secure and rotate them regularly