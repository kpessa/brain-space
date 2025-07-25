# Firebase Functions Deployment Guide

## Prerequisites
1. Ensure you have Java installed (required for Firebase emulators)
2. Firebase CLI logged in: `firebase login`
3. Node.js 20 installed

## Steps to Deploy

### 1. Install Dependencies
```bash
cd functions
npm install
```

### 2. Build the Functions
```bash
npm run build
```

### 3. Set Firebase Environment Secrets
Before deploying, you need to set the API keys as Firebase secrets:

```bash
# Set Google AI API key (for Gemini)
firebase functions:secrets:set GOOGLE_AI_API_KEY

# Set OpenAI API key
firebase functions:secrets:set OPENAI_API_KEY

# Set Anthropic API key (optional - removed from Genkit implementation)
firebase functions:secrets:set ANTHROPIC_API_KEY
```

When prompted, paste your API keys. These will be securely stored and available to your functions in production.

To get a Google AI API key:
1. Go to https://makersuite.google.com/app/apikey
2. Click "Create API key"
3. Copy the key and use it in the command above

### 4. Deploy the Functions
```bash
# Deploy only functions
firebase deploy --only functions

# Or deploy everything (functions, firestore rules, hosting)
firebase deploy
```

### 5. Test the Deployment
After deployment, Firebase will provide you with the function URL. It will look like:
```
https://us-central1-brain-space-5d787.cloudfunctions.net/categorizeThoughts
```

The function is automatically called by the frontend AI service when using Firebase auth.

## Local Development

For local development with the emulators:

1. Set the secrets locally for the emulator:
```bash
# Create a .secret.local file in the functions directory
cd functions
echo "OPENAI_API_KEY=your-openai-key" > .secret.local
echo "ANTHROPIC_API_KEY=your-anthropic-key" >> .secret.local
```

2. Start the emulators:
```bash
firebase emulators:start
```

The function will be available at:
```
http://localhost:5001/brain-space-5d787/us-central1/categorizeThoughts
```

## Troubleshooting

### Java Missing Error
If you get "Could not spawn java -version" error:
```bash
# On Ubuntu/Debian
sudo apt update
sudo apt install default-jdk

# On macOS
brew install openjdk
```

### Service Account Error
If you get "Default service account doesn't exist" error, the function has been updated to use Firebase Functions v2 which handles this automatically.

### CORS Issues
The function is configured with CORS enabled. If you still face CORS issues:
1. Check that the frontend is using the correct function URL
2. Ensure the Authorization header is being sent with the Firebase ID token

## Security Notes
- API keys are stored as Firebase secrets, not in the code
- The function requires Firebase authentication (ID token)
- CORS is configured to allow requests from any origin (adjust if needed)