#!/bin/bash

# Update environment variables for new domain: easemaill.app

NEW_DOMAIN="https://easemaill.app"

echo "🔄 Updating environment variables for domain: $NEW_DOMAIN"
echo ""

# Update NEXTAUTH_URL
echo "✅ Updating NEXTAUTH_URL"
echo "$NEW_DOMAIN" | vercel env add NEXTAUTH_URL production --force

# Update NEXT_PUBLIC_APP_URL (if it exists)
echo "✅ Updating NEXT_PUBLIC_APP_URL"
echo "$NEW_DOMAIN" | vercel env add NEXT_PUBLIC_APP_URL production --force

# Update AZURE_AD_REDIRECT_URI
echo "✅ Updating AZURE_AD_REDIRECT_URI"
echo "$NEW_DOMAIN/api/auth/callback/microsoft-entra-id" | vercel env add AZURE_AD_REDIRECT_URI production --force

echo ""
echo "✨ Done! Environment variables updated for $NEW_DOMAIN"
echo ""
echo "Next steps:"
echo "1. Configure custom domain in Vercel dashboard"
echo "2. Update Azure AD redirect URIs (see instructions below)"
echo "3. Redeploy: vercel --prod"
