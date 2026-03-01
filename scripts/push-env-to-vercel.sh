#!/bin/bash

# Script to push environment variables from .env.local to Vercel
# Usage: ./scripts/push-env-to-vercel.sh [production|preview|development]

set -e

# Default to production if no argument provided
ENV_TYPE=${1:-production}

echo "🚀 Pushing environment variables to Vercel ($ENV_TYPE)..."
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
  echo "❌ Error: .env.local not found"
  echo "Please create .env.local with your environment variables first"
  exit 1
fi

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
  echo "❌ Error: Vercel CLI not found"
  echo "Install with: npm i -g vercel"
  exit 1
fi

echo "📋 Reading variables from .env.local..."
echo ""

# Counter for tracking
count=0

# Read .env.local and push each variable
while IFS='=' read -r key value; do
  # Skip empty lines and comments
  if [[ -z "$key" ]] || [[ "$key" =~ ^[[:space:]]*# ]]; then
    continue
  fi

  # Remove leading/trailing whitespace
  key=$(echo "$key" | xargs)
  value=$(echo "$value" | xargs)

  # Skip if key or value is empty
  if [[ -z "$key" ]] || [[ -z "$value" ]]; then
    continue
  fi

  # Skip placeholder values
  if [[ "$value" =~ ^(your_|https://YOUR_PROJECT|sk-ant-your_key) ]]; then
    echo "⏭️  Skipping $key (placeholder value)"
    continue
  fi

  echo "✅ Setting $key"
  echo "$value" | vercel env add "$key" "$ENV_TYPE" --force > /dev/null 2>&1 || {
    echo "⚠️  Warning: Failed to set $key"
  }

  ((count++))
done < .env.local

echo ""
echo "✨ Done! Pushed $count environment variables to Vercel ($ENV_TYPE)"
echo ""
echo "Next steps:"
echo "1. Verify variables: vercel env ls"
echo "2. Trigger a new deployment: vercel --prod"
