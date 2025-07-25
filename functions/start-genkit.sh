#!/bin/bash

# Load environment variables from .secret.local
if [ -f .secret.local ]; then
    export $(cat .secret.local | xargs)
fi

# Build the TypeScript files
echo "Building TypeScript files..."
pnpm run build

# Start Genkit with the flows
echo "Starting Genkit Developer UI..."
pnpm exec genkit start -- node lib/genkit-flows.js