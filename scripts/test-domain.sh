#!/bin/bash

# Test script for easemaill.app domain

DOMAIN="https://easemaill.app"

echo "🧪 Testing easemaill.app deployment..."
echo ""

# Test 1: Homepage
echo "1️⃣  Testing homepage..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$DOMAIN")
if [ "$STATUS" = "200" ] || [ "$STATUS" = "301" ] || [ "$STATUS" = "302" ]; then
  echo "   ✅ Homepage responding (HTTP $STATUS)"
else
  echo "   ❌ Homepage not responding (HTTP $STATUS)"
fi

# Test 2: SSL Certificate
echo ""
echo "2️⃣  Testing SSL certificate..."
if curl -s "$DOMAIN" > /dev/null 2>&1; then
  echo "   ✅ SSL certificate valid"
else
  echo "   ❌ SSL certificate issue"
fi

# Test 3: Login page
echo ""
echo "3️⃣  Testing login page..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$DOMAIN/login")
if [ "$STATUS" = "200" ]; then
  echo "   ✅ Login page accessible (HTTP $STATUS)"
else
  echo "   ❌ Login page issue (HTTP $STATUS)"
fi

# Test 4: API routes
echo ""
echo "4️⃣  Testing API routes..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$DOMAIN/api/test/auth")
if [ "$STATUS" != "000" ]; then
  echo "   ✅ API routes responding (HTTP $STATUS)"
else
  echo "   ❌ API routes not responding"
fi

echo ""
echo "📋 Manual testing checklist:"
echo "   □ Visit $DOMAIN and verify it loads"
echo "   □ Click 'Sign in with Microsoft' and test authentication"
echo "   □ After login, go to Settings → Accounts"
echo "   □ Try connecting an additional account"
echo "   □ Verify email sync works"
echo ""
echo "🔗 Production URLs:"
echo "   • Main app: $DOMAIN"
echo "   • Login: $DOMAIN/login"
echo "   • Settings: $DOMAIN/settings"
echo "   • Vercel: https://easemail-late-2ct95yfky-bot-makers.vercel.app"
