# Google Calendar API Production Setup

## 1. Google Cloud Console Configuration

### Create Production OAuth Credentials
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create one for production)
3. Navigate to **APIs & Services** > **Credentials**
4. Click **+ CREATE CREDENTIALS** > **OAuth client ID**

### Configure OAuth Client for Production
1. **Application type**: Web application
2. **Name**: "Brain Space Production"
3. **Authorized JavaScript origins**:
   ```
   https://brain-space-olive.vercel.app
   https://your-custom-domain.com  # if using custom domain
   ```
4. **Authorized redirect URIs**:
   ```
   https://rtxfdwtsuhxggrdcuspe.supabase.co/auth/v1/callback
   ```

## 2. Vercel Environment Variables

Set these environment variables in your Vercel project dashboard:

```env
VITE_SUPABASE_URL=https://rtxfdwtsuhxggrdcuspe.supabase.co
VITE_SUPABASE_ANON_KEY=your_production_anon_key

# Google Calendar API
VITE_GOOGLE_CLIENT_ID=your_production_google_client_id
VITE_GOOGLE_API_KEY=your_production_google_api_key
VITE_GOOGLE_CALENDAR_DISCOVERY_DOC=https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest
VITE_GOOGLE_CALENDAR_SCOPES=https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events
```

## 3. Supabase Production Configuration

### Enable Google Provider in Supabase Dashboard
1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Navigate to **Authentication** > **Providers**
3. Enable **Google** provider
4. Enter your production Google OAuth credentials:
   - **Client ID**: From Google Cloud Console
   - **Client Secret**: From Google Cloud Console

### Update Redirect URLs
Make sure your Supabase project has the correct redirect URLs configured for your production domain.

## 4. API Keys Setup

### Google Calendar API Key
1. In Google Cloud Console, go to **APIs & Services** > **Credentials**
2. Click **+ CREATE CREDENTIALS** > **API key**
3. Restrict the API key:
   - **Application restrictions**: HTTP referrers
   - **Website restrictions**: Add your production domains
   - **API restrictions**: Google Calendar API

## 5. Testing Production Setup

### Manual Testing Steps
1. Deploy to Vercel with updated environment variables
2. Visit your production URL
3. Test Google Calendar authentication flow
4. Verify calendar data loads correctly

### Common Issues and Solutions

**Issue**: "Redirect URI mismatch"
- **Solution**: Ensure the redirect URI in Google Console exactly matches your Supabase project URL

**Issue**: "Invalid client"
- **Solution**: Double-check Client ID and Secret in both Google Console and Supabase

**Issue**: "This app is blocked"
- **Solution**: Publish your OAuth consent screen or add test users in Google Cloud Console

**Issue**: CORS errors
- **Solution**: Verify authorized JavaScript origins include your production domain

## 6. Security Considerations

- Never expose Client Secret in frontend code (it's only used in Supabase)
- Use API key restrictions to limit usage to your domains
- Regularly rotate API keys and OAuth credentials
- Monitor API usage in Google Cloud Console

## 7. Monitoring

### Check These Logs for Issues
- Vercel function logs
- Supabase auth logs
- Google Cloud Console API usage
- Browser console errors

### Key Metrics to Watch
- OAuth authentication success rate
- API request quotas and limits
- Token refresh patterns
- Error rates by endpoint