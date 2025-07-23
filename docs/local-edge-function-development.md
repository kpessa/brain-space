# Local Edge Function Development

This guide covers how to run and test the CalDAV proxy Edge Function locally.

## Prerequisites

1. Supabase CLI installed (`pnpm add -g supabase`)
2. Docker installed and running (required for local Supabase)

## Step 1: Start Supabase Locally

From the project root directory:

```bash
# Initialize Supabase (if not already done)
supabase init

# Start local Supabase services
supabase start
```

This will start:
- Supabase Studio at http://localhost:54323
- API Gateway at http://localhost:54321
- Database at localhost:54322

## Step 2: Serve Edge Functions Locally

In a new terminal, run:

```bash
# Serve all functions locally
supabase functions serve

# Or serve just the caldav-proxy function
supabase functions serve caldav-proxy --no-verify-jwt
```

The `--no-verify-jwt` flag is useful for testing without authentication during development.

## Step 3: Update Your .env.local

Create or update `.env.local` with your local Supabase URLs:

```env
# Local Supabase Configuration
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=<your-local-anon-key>

# Your Google Calendar config remains the same
VITE_GOOGLE_CLIENT_ID=<your-google-client-id>
VITE_GOOGLE_API_KEY=<your-google-api-key>
```

You can find your local anon key by running:
```bash
supabase status
```

## Step 4: Test the Edge Function

1. Start your development server:
   ```bash
   pnpm run dev
   ```

2. Navigate to http://localhost:5178/test-edge-function

3. Click "Run Test" to verify the Edge Function is working

## Common Issues

### CORS Errors

If you see CORS errors:

1. **Check Docker is running**: Edge Functions require Docker
2. **Verify the function is serving**: Check the terminal where you ran `supabase functions serve`
3. **Check allowed origins**: The function includes common Vite ports (5173-5178)

### Port Conflicts

If port 54321 is already in use:

```bash
# Stop all Supabase services
supabase stop

# Start with a different port
supabase start --port 54320
```

Then update your `.env.local`:
```env
VITE_SUPABASE_URL=http://localhost:54320
```

### Function Not Found

If the function returns 404:

1. Check the function name matches exactly: `caldav-proxy`
2. Ensure you're in the project root when running `supabase functions serve`
3. Check for any errors in the function serve terminal

## Debugging

To see function logs in real-time:

```bash
# In the terminal where you're serving functions
# Logs will appear automatically

# Or in a separate terminal
supabase functions logs caldav-proxy
```

## Testing iCloud Integration Locally

1. Make sure the Edge Function is running locally
2. Navigate to Calendar Settings
3. Click on iCloud Calendar tab
4. Enter your Apple ID and app-specific password
5. The connection should work through your local Edge Function

## Production Deployment

When ready to deploy to production:

```bash
# Deploy the function
supabase functions deploy caldav-proxy

# Update your .env to use production URLs
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key
```