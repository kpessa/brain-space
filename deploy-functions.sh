#!/bin/bash

echo "🚀 Firebase Functions Deployment Script"
echo "======================================"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "firebase.json" ]; then
    echo -e "${RED}Error: firebase.json not found. Please run this script from the project root.${NC}"
    exit 1
fi

# Step 1: Install dependencies
echo -e "\n${YELLOW}Step 1: Installing dependencies...${NC}"
cd functions
pnpm install
if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Failed to install dependencies${NC}"
    exit 1
fi
cd ..

# Step 2: Build the functions
echo -e "\n${YELLOW}Step 2: Building functions...${NC}"
cd functions
pnpm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Failed to build functions${NC}"
    exit 1
fi
cd ..

# Step 3: Check if secrets are set
echo -e "\n${YELLOW}Step 3: Checking Firebase secrets...${NC}"
echo "Have you set the Firebase secrets? (y/n)"
read -r response
if [[ "$response" != "y" ]]; then
    echo -e "${YELLOW}Please set the secrets using:${NC}"
    echo "  firebase functions:secrets:set OPENAI_API_KEY"
    echo "  firebase functions:secrets:set ANTHROPIC_API_KEY"
    echo -e "${YELLOW}Then run this script again.${NC}"
    exit 0
fi

# Step 4: Deploy
echo -e "\n${YELLOW}Step 4: Deploying functions...${NC}"
firebase deploy --only functions

if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}✅ Functions deployed successfully!${NC}"
    echo -e "${GREEN}Check the Firebase console for your function URL.${NC}"
else
    echo -e "\n${RED}❌ Deployment failed. Please check the error messages above.${NC}"
    exit 1
fi