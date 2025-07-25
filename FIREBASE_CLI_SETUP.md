# Firebase CLI Setup Guide

## Prerequisites
✅ Firebase CLI is installed (version 14.10.1)
✅ Firestore is created in test mode
✅ Configuration files are created

## Setup Steps

### 1. Login to Firebase
```bash
firebase login
```

### 2. Set Your Project ID
Replace "your-project-id" in `.firebaserc` with your actual Firebase project ID:
```bash
# Edit .firebaserc and replace "your-project-id" with your actual project ID
# You can find your project ID in the Firebase Console
```

### 3. Deploy Firestore Rules and Indexes
```bash
# Deploy security rules
firebase deploy --only firestore:rules

# Deploy indexes
firebase deploy --only firestore:indexes
```

### 4. (Optional) Test with Emulators
```bash
# Start Firebase emulators
firebase emulators:start

# Your app will be available at:
# - Emulator UI: http://localhost:4000
# - Firestore: http://localhost:8080
# - Auth: http://localhost:9099
```

## Current Configuration

### Security Rules (Test Mode)
- Located in `firestore.rules`
- Currently allows all reads/writes (insecure - for development only)
- Will expire 30 days from database creation
- Update before production!

### Indexes
- Located in `firestore.indexes.json`
- Pre-configured for node queries:
  - Type + CreatedAt
  - Type + Category + CreatedAt
  - Status + CreatedAt
  - Urgency + Importance

### Firebase Configuration
- `firebase.json` - Main configuration
- `.firebaserc` - Project aliases
- Configured for:
  - Firestore
  - Hosting (builds to `dist` folder)
  - Emulators (Auth, Firestore, Hosting)

## Next Steps

1. **Update `.firebaserc`** with your project ID
2. **Deploy rules and indexes** using the commands above
3. **Test your app** - Firestore should now work with your Node system
4. **Before production**, update security rules to be more restrictive

## Production Security Rules Example

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```