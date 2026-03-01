# Azure AD Redirect URIs for easemail.app

## Quick Reference: URIs to Add

Copy and paste these into Azure AD App Registration → Authentication → Redirect URIs:

### Primary Authentication Callback
```
https://easemail.app/api/auth/callback/microsoft-entra-id
```

### Account Connection Callbacks
```
https://easemail.app/api/accounts/connect/callback
https://easemail.app/api/accounts/reauth/callback
```

---

## Step-by-Step Instructions

1. **Navigate to Azure Portal**
   - Go to: https://portal.azure.com
   - Or use direct link: https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps

2. **Find Your App Registration**
   - Click **Azure Active Directory** in the left sidebar
   - Click **App registrations**
   - Find and click your EaseMail app (Client ID: `${AZURE_AD_CLIENT_ID}`)

3. **Update Redirect URIs**
   - Click **Authentication** in the left sidebar
   - Under **Platform configurations** → **Web** → **Redirect URIs**
   - Click **Add URI** and enter:
     ```
     https://easemail.app/api/auth/callback/microsoft-entra-id
     ```
   - Click **Add URI** again and enter:
     ```
     https://easemail.app/api/accounts/connect/callback
     ```
   - Click **Add URI** again and enter:
     ```
     https://easemail.app/api/accounts/reauth/callback
     ```
   - Click **Save** at the top

4. **Keep Old URLs During Transition** (Recommended)
   - Keep these old URLs for 1-2 weeks during testing:
     ```
     https://easemail-late-afguzoos8-bot-makers.vercel.app/api/auth/callback/microsoft-entra-id
     https://easemail-late-afguzoos8-bot-makers.vercel.app/api/accounts/connect/callback
     https://easemail-late-afguzoos8-bot-makers.vercel.app/api/accounts/reauth/callback
     ```
   - This allows you to test without breaking the old deployment
   - Remove them after you've verified the new domain works

5. **Optional: Add Development URLs**
   - If you want to test locally, also add:
     ```
     http://localhost:3000/api/auth/callback/microsoft-entra-id
     http://localhost:3000/api/accounts/connect/callback
     http://localhost:3000/api/accounts/reauth/callback
     ```

---

## After Adding URIs

### Test Authentication Flow

1. Visit: https://easemail.app/login
2. Click "Sign in with Microsoft"
3. Complete Microsoft authentication
4. Verify you're redirected back to easemail.app successfully

### Test Account Connection

1. Go to: https://easemail.app/settings?tab=accounts
2. Click "Connect Account"
3. Complete Microsoft authentication
4. Verify the account is added successfully

---

## Troubleshooting

### Error: "AADSTS50011: The reply URL specified in the request does not match"

**Cause:** The redirect URI in Azure AD doesn't match the one being sent by your app.

**Fix:**
1. Double-check the URI in Azure AD matches exactly (no trailing slash, correct protocol)
2. Wait 1-2 minutes for Azure AD changes to propagate
3. Clear browser cache and try again
4. Verify your Vercel env vars are set correctly:
   ```bash
   vercel env pull
   cat .env.local | grep NEXTAUTH_URL
   ```

### Error: "AADSTS500113: No reply address is registered for the application"

**Cause:** No redirect URIs are configured in Azure AD.

**Fix:**
1. Go back to Azure Portal
2. Add the redirect URIs as shown above
3. Make sure you clicked **Save**

### Authentication works but account connection fails

**Cause:** You may have only added the primary auth callback, not the account connection callbacks.

**Fix:**
1. Make sure ALL THREE redirect URIs are added:
   - `/api/auth/callback/microsoft-entra-id`
   - `/api/accounts/connect/callback`
   - `/api/accounts/reauth/callback`

---

## Reference

Your current Azure AD configuration:
- **Client ID:** Check `.env.local` → `AZURE_AD_CLIENT_ID`
- **Tenant ID:** Check `.env.local` → `AZURE_AD_TENANT_ID`
- **Portal Link:** https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps

---

## Verification Checklist

- [ ] Added `https://easemail.app/api/auth/callback/microsoft-entra-id`
- [ ] Added `https://easemail.app/api/accounts/connect/callback`
- [ ] Added `https://easemail.app/api/accounts/reauth/callback`
- [ ] Clicked **Save** in Azure Portal
- [ ] Waited 1-2 minutes for changes to propagate
- [ ] Tested login at https://easemail.app/login
- [ ] Tested account connection at https://easemail.app/settings?tab=accounts
- [ ] Both flows work without "redirect URI mismatch" errors
