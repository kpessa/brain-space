#!/bin/bash

echo "🚀 Brain Space - Google OAuth Setup Helper"
echo "========================================="
echo ""
echo "This script will help you set up Google OAuth for local development."
echo ""

# Check if .env file exists in supabase directory
ENV_FILE="./supabase/.env"

if [ ! -f "$ENV_FILE" ]; then
    echo "Creating $ENV_FILE..."
    touch "$ENV_FILE"
fi

echo "📝 Please follow these steps:"
echo ""
echo "1. Go to: https://console.cloud.google.com/"
echo "2. Create OAuth 2.0 credentials (Web application)"
echo "3. Add these Authorized redirect URIs:"
echo "   - http://localhost:54321/auth/v1/callback"
echo "   - http://127.0.0.1:54321/auth/v1/callback"
echo ""
echo "4. Copy your credentials and paste them below:"
echo ""

read -p "Enter your Google Client ID: " CLIENT_ID
read -p "Enter your Google Client Secret: " CLIENT_SECRET

# Write to .env file
cat > "$ENV_FILE" << EOF
GOOGLE_CLIENT_ID=$CLIENT_ID
GOOGLE_CLIENT_SECRET=$CLIENT_SECRET
EOF

echo ""
echo "✅ Credentials saved to $ENV_FILE"
echo ""
echo "🔄 Restarting Supabase with new configuration..."
echo ""

# Restart Supabase
supabase stop
supabase start

echo ""
echo "✨ Setup complete! You can now:"
echo "1. Access Supabase Studio at: http://127.0.0.1:54323"
echo "2. Run your app with: pnpm run dev"
echo "3. Test Google login at: http://localhost:5173"
echo ""
echo "📚 For more details, see GOOGLE_OAUTH_LOCAL_SETUP.md"