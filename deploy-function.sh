#!/bin/bash
# Deploy the updated generate-narrative edge function with reasoning support

echo "Deploying generate-narrative function..."
cd "$(dirname "$0")"

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "Error: Supabase CLI is not installed."
    echo "Install it with: npm install -g supabase"
    exit 1
fi

# Deploy the function
supabase functions deploy generate-narrative --no-verify-jwt

if [ $? -eq 0 ]; then
    echo "✓ Function deployed successfully!"
    echo ""
    echo "The function now includes:"
    echo "  - AI reasoning/thinking capture"
    echo "  - Collapsible debug display in UI"
    echo "  - Removed invalid reasoning_effort parameter"
else
    echo "✗ Deployment failed"
    exit 1
fi
