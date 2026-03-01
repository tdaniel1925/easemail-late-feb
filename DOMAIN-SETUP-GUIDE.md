# Custom Domain Setup Guide: easemail.app

This guide covers all changes needed to set up your custom domain `easemail.app`.

---

## 📝 Checklist

### 1. Vercel Environment Variables

Update these environment variables in Vercel:

| Variable | Old Value | New Value |
|----------|-----------|-----------|
| `NEXTAUTH_URL` | `https://easemail-late-afguzoos8-bot-makers.vercel.app` | `https://easemail.app` |
| `NEXT_PUBLIC_APP_URL` | `https://easemail-late-afguzoos8-bot-makers.vercel.app` | `https://easemail.app` |
| `AZURE_AD_REDIRECT_URI` | `https://easemail-late-afguzoos8-bot-makers.vercel.app/api/auth/callback/microsoft-entra-id` | `https://easemail.app/api/auth/callback/microsoft-entra-id` |

**Quick update:**
```bash
./update-domain-vars.sh
```

---

### 2. Azure AD App Registration Changes

#### A. Update Redirect URIs

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** → **App registrations**
3. Select your EaseMail app
4. Go to **Authentication** in the left sidebar
5. Under **Platform configurations** → **Web** → **Redirect URIs**
6. Add these URIs:
   ```
   https://easemail.app/api/auth/callback/microsoft-entra-id
   https://easemail.app/api/accounts/connect/callback
   https://easemail.app/api/accounts/reauth/callback
   ```
7. **Keep the old URLs** during transition (remove after testing):
   ```
   https://easemail-late-afguzoos8-bot-makers.vercel.app/api/auth/callback/microsoft-entra-id
   https://easemail-late-afguzoos8-bot-makers.vercel.app/api/accounts/connect/callback
   https://easemail-late-afguzoos8-bot-makers.vercel.app/api/accounts/reauth/callback
   ```
8. Click **Save**

#### B. Update Web Origins (if configured)

1. In the same **Authentication** section
2. Under **Web** → **Redirect URIs** → scroll to **Front-channel logout URL**
3. If you have a logout URL set, update it to:
   ```
   https://easemail.app
   ```

#### C. Update App ID URI (if configured)

1. Go to **Expose an API** in the left sidebar
2. If you have an Application ID URI set, update it to:
   ```
   api://easemail.app
   ```
3. Click **Save**

---

### 3. Vercel Domain Configuration

#### A. Add Custom Domain in Vercel

1. Go to [Vercel Dashboard](https://vercel.com/bot-makers/easemail-late-feb)
2. Go to **Settings** → **Domains**
3. Click **Add** and enter: `easemail.app`
4. Click **Add** again for the www subdomain: `www.easemail.app`
5. Vercel will provide DNS configuration instructions

#### B. DNS Configuration

Add these DNS records at your domain registrar:

**For apex domain (easemail.app):**
```
Type: A
Name: @
Value: 76.76.21.21
TTL: 3600
```

**For www subdomain:**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 3600
```

**Optional: For email (if using email on this domain):**
```
Type: MX
Name: @
Value: [Your email provider's MX records]
Priority: 10
```

#### C. SSL Certificate

- Vercel automatically provisions SSL certificates via Let's Encrypt
- This usually takes 1-5 minutes after DNS propagates
- You'll see "SSL Certificate: Active" in the Vercel dashboard once ready

---

### 4. Update Supabase Settings (if applicable)

If you have Supabase authentication configured:

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Authentication** → **URL Configuration**
4. Update **Site URL** to: `https://easemail.app`
5. Under **Redirect URLs**, add:
   ```
   https://easemail.app/**
   https://easemail.app/api/auth/callback/microsoft-entra-id
   ```

---

### 5. Microsoft Graph Webhook Configuration

If you're using webhooks for real-time sync:

1. Webhooks are created programmatically by your app
2. The webhook URLs will automatically use the new domain
3. Verify the `NEXT_PUBLIC_APP_URL` env var is set correctly
4. After deployment, test webhook creation:
   ```bash
   curl https://easemail.app/api/webhooks/manage -X POST
   ```

---

### 6. Update Local Development .env.local

For testing, update your local `.env.local`:

```bash
# Production URLs (for reference)
NEXTAUTH_URL=https://easemail.app
NEXT_PUBLIC_APP_URL=https://easemail.app
```

**Important:** Keep your local dev URLs as `http://localhost:3000` for local development.

---

### 7. Deployment Steps

After making all changes:

1. **Update environment variables:**
   ```bash
   ./update-domain-vars.sh
   ```

2. **Verify variables:**
   ```bash
   vercel env ls production
   ```

3. **Deploy to production:**
   ```bash
   vercel --prod
   ```

4. **Wait for DNS propagation** (can take 5 minutes to 48 hours)

5. **Test the new domain:**
   ```bash
   curl -I https://easemail.app
   ```

6. **Test authentication:**
   - Visit https://easemail.app/login
   - Click "Sign in with Microsoft"
   - Verify redirect works correctly

---

## 🧪 Testing Checklist

After deployment, test these flows:

- [ ] Homepage loads at https://easemail.app
- [ ] SSL certificate is valid (green padlock in browser)
- [ ] Login redirects to Microsoft correctly
- [ ] After Microsoft auth, redirects back to easemail.app
- [ ] Connect additional account works
- [ ] Email sync starts automatically
- [ ] Webhooks are created successfully
- [ ] www.easemail.app redirects to easemail.app (or vice versa)

---

## 🔧 Troubleshooting

### DNS not propagating
```bash
# Check DNS propagation
dig easemail.app
nslookup easemail.app

# Check from multiple locations
https://dnschecker.org
```

### SSL certificate issues
- Wait 5-10 minutes after DNS propagates
- Check Vercel dashboard for certificate status
- Try removing and re-adding the domain in Vercel

### Redirect URI mismatch error
- Double-check Azure AD redirect URIs match exactly
- Make sure there's no trailing slash
- Verify the protocol is `https://` not `http://`

### Environment variables not taking effect
```bash
# Pull latest env vars to verify
vercel env pull

# Redeploy to ensure they're used
vercel --prod --force
```

---

## 📚 Reference

- Vercel Custom Domains: https://vercel.com/docs/concepts/projects/domains
- Azure AD Redirect URIs: https://docs.microsoft.com/en-us/azure/active-directory/develop/reply-url
- NextAuth.js Configuration: https://next-auth.js.org/configuration/options#nextauth_url

---

## ✅ Post-Deployment

After everything is working:

1. Update documentation with new domain
2. Send updated login link to users
3. Update any marketing materials
4. Set up monitoring/alerts for the new domain
5. Remove old Vercel URLs from Azure AD (after 1-2 weeks)
