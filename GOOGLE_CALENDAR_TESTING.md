# Google Calendar Firebase Integration Testing

## Overview
This document outlines how to test the Google Calendar OAuth2 integration with Firebase Auth.

## Prerequisites
1. Firebase project set up with Authentication enabled
2. Google Cloud Console project with Calendar API enabled
3. OAuth 2.0 Client ID configured for web application

## Environment Variables Required
```env
# Google Calendar API Configuration
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
VITE_GOOGLE_API_KEY=your_google_api_key_here
VITE_GOOGLE_CALENDAR_DISCOVERY_DOC=https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest
VITE_GOOGLE_CALENDAR_SCOPES=https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events

# Firebase Auth Toggle
VITE_USE_FIREBASE_AUTH=true
```

## Testing Steps

### 1. Access the Test Page
Navigate to `/calendar-test` in your application.

### 2. Authentication Flow Test
1. **Firebase Auth Check**: Verify that you're logged in with Firebase Auth
2. **Google Calendar Authorization**: Click "Authorize Google Calendar" button
3. **OAuth2 Flow**: Complete the Google OAuth2 consent flow
4. **Token Storage**: Verify that the access token is stored in Firestore

### 3. Verify Firestore Token Storage
The test page displays three status indicators:
- ✅ Firebase Auth: Shows if you're logged in
- ✅ Google Calendar: Shows if you have a valid Google Calendar authorization
- ✅ Token in Firestore: Shows if the token is properly stored

Token is stored at: `users/{userId}/settings/googleCalendar/google_access_token`

### 4. Test Calendar Operations
Once authorized, you can test:
- **List Calendars**: Fetches all calendars associated with the Google account
- **View Events**: Click on any calendar to fetch upcoming events
- **Create Test Event**: Creates a test event for tomorrow at 2 PM

### 5. Test Token Persistence
1. Refresh the page
2. The authorization should persist (no need to re-authorize)
3. The token should be loaded from Firestore automatically

### 6. Test Sign Out
1. Click "Sign Out" to revoke Google Calendar access
2. The token should be removed from Firestore
3. Calendar data should be cleared

## Debugging

### Check Firestore
Use Firebase Console to verify token storage:
1. Go to Firestore Database
2. Navigate to: `users > {userId} > settings > googleCalendar`
3. Verify `google_access_token` field exists

### Common Issues
1. **CORS Errors**: Ensure your OAuth2 redirect URIs include your development URL
2. **Token Not Persisting**: Check Firestore security rules allow user to write to their own settings
3. **API Key Issues**: Verify Google Calendar API is enabled in Google Cloud Console

## Security Notes
- Access tokens are stored encrypted in Firestore
- Tokens are only accessible by the authenticated user
- Refresh tokens are not stored (using implicit flow)
- Tokens expire after 1 hour and need re-authorization

## Integration with Calendar View
The main calendar view at `/calendar` uses the same `googleCalendarWrapper` service and should work seamlessly once authorization is complete in the test page.