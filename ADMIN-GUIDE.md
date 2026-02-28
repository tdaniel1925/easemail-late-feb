# EaseMail Admin Guide

## Overview

EaseMail operates as an **invitation-only B2B SaaS platform** with a secure multi-tenancy architecture. This guide explains how to manage organizations, users, and the invitation system.

## Security Model

### Invitation-Only Signup

EaseMail uses a strict invitation-only model to prevent unauthorized access:

1. **No Open Signup**: Users cannot create new organizations without an invitation
2. **Platform Admin Control**: Only platform admins can bootstrap new organizations
3. **Organization Admin Control**: Once bootstrapped, organization owners/admins can invite their team members

### How It Works

When a user attempts to sign in:

1. **Has Pending Invitation?** → User joins the invitation's tenant with the specified role
2. **Tenant Exists for Domain?** → User joins existing tenant as `member`
3. **No Invitation + No Tenant** → **BLOCKED** → Redirected to `/auth/error?error=invitation_required`

## Multi-Tenancy Architecture

### Tenant Isolation

- Each organization has a unique `tenant_id`
- All data (messages, contacts, calendars, etc.) is scoped to tenant
- Users can only access data within their tenant
- Row Level Security (RLS) enforces isolation at the database level

### Domain-Based Grouping

Users with the same email domain automatically share a tenant:
- `mrsmith@smithlaw.com` + `sarah@smithlaw.com` → Same tenant ✅
- `john@acme.com` + `jane@acme.com` → Same tenant ✅
- `bob@gmail.com` + `alice@gmail.com` → **BLOCKED** (personal domains require invitation) ❌

### Roles

- **Owner**: Full control, can manage billing and delete organization
- **Admin**: Can invite users and manage team settings
- **Member**: Can use all features but cannot manage team

## Bootstrapping New Organizations

### Prerequisites

1. Set `ADMIN_API_KEY` in your `.env.local`:
   ```bash
   ADMIN_API_KEY=your-secure-random-key-here
   ```

2. Generate a secure API key:
   ```bash
   openssl rand -base64 32
   ```

### Using the CLI Tool

#### Interactive Mode

```bash
npm run bootstrap
```

The CLI will prompt you for:
- Organization Name (e.g., "Smith & Associates")
- Domain (e.g., "smithlaw.com")
- Owner Email (e.g., "mrsmith@smithlaw.com")
- Owner Name (optional)
- Plan (free/professional/enterprise)

#### Command-Line Arguments

```bash
npm run bootstrap -- \
  --name "Smith & Associates" \
  --domain "smithlaw.com" \
  --email "mrsmith@smithlaw.com" \
  --owner-name "Mr. Smith" \
  --plan "professional"
```

#### Output

The CLI will create:
1. A new tenant with the specified plan
2. An invitation for the owner
3. An invitation URL to send to the owner

**Example Output:**
```
✅ Organization created successfully!

📊 Tenant Details:
   ID: 550e8400-e29b-41d4-a716-446655440000
   Name: Smith & Associates
   Domain: smithlaw.com
   Plan: professional

📧 Owner Invitation:
   Email: mrsmith@smithlaw.com
   Role: owner
   Expires: 2/25/2026, 12:00:00 PM

🔗 Invitation URL:
   https://your-domain.com/accept-invite?token=abc123...

📋 Next Steps:
   1. Copy the invitation URL above
   2. Send it to the organization owner
   3. They will sign in with their Microsoft 365 account
   4. Once signed in, they can invite their team members
```

### Using the API Directly

```bash
curl -X POST https://your-domain.com/api/admin/bootstrap \
  -H "Content-Type: application/json" \
  -H "x-admin-api-key: your-admin-api-key" \
  -d '{
    "organizationName": "Smith & Associates",
    "domain": "smithlaw.com",
    "ownerEmail": "mrsmith@smithlaw.com",
    "ownerName": "Mr. Smith",
    "plan": "professional"
  }'
```

## Managing Invitations

### Organization Admins

Once an organization is bootstrapped and the owner signs in, they can:

1. **View Team Members**: Settings → Organization → Team Members
2. **Invite New Members**: Click "Invite Member" button
3. **Set Roles**: Choose Admin or Member when inviting
4. **Copy Invite Links**: Click copy icon next to pending invitations
5. **Cancel Invitations**: Click X icon to cancel pending invitations

### Invitation Flow

1. Admin creates invitation → Token generated
2. Admin copies invitation URL → Shares with user
3. User clicks URL → Sees invitation details (organization, role, inviter)
4. User clicks "Accept & Sign In" → Signs in with Microsoft 365
5. On successful sign-in → User joins organization with specified role
6. Invitation marked as `accepted`

### Invitation Expiration

- Default expiration: **7 days**
- Expired invitations are automatically marked as `expired`
- Admins can cancel pending invitations before expiration

## Plans and Limits

### Free Plan
- **Max Seats**: 5 users
- **Features**: Basic email, calendar, contacts
- **AI Features**: ❌ Disabled
- **Shared Inbox**: ❌ Disabled
- **Custom Branding**: ❌ Disabled
- **Advanced Analytics**: ❌ Disabled

### Professional Plan
- **Max Seats**: 50 users
- **Features**: All basic features
- **AI Features**: ✅ Enabled
- **Shared Inbox**: ❌ Disabled
- **Custom Branding**: ❌ Disabled
- **Advanced Analytics**: ❌ Disabled

### Enterprise Plan
- **Max Seats**: 500 users
- **Features**: All features
- **AI Features**: ✅ Enabled
- **Shared Inbox**: ✅ Enabled
- **Custom Branding**: ✅ Enabled
- **Advanced Analytics**: ✅ Enabled

## Database Schema

### Core Tables

**tenants**
- Stores organization information
- Plan level, max seats, features
- Created by bootstrap API

**users**
- Links to tenant via `tenant_id`
- Stores role (owner/admin/member)
- Email, display name, avatar

**invitations**
- Stores pending/accepted/cancelled invitations
- Token for secure acceptance
- Expiration date
- Role to be assigned

**connected_accounts**
- Microsoft 365 accounts per user
- Users can add multiple accounts
- All accounts roll up to user's tenant

**account_tokens**
- OAuth tokens for connected accounts
- Access token, refresh token, expiry
- Used for Microsoft Graph API calls

## Security Best Practices

### API Key Management

1. **Generate Strong Keys**: Use `openssl rand -base64 32`
2. **Store Securely**: Never commit `.env.local` to git
3. **Rotate Regularly**: Change API key every 90 days
4. **Limit Access**: Only share with trusted platform admins

### Invitation URLs

1. **Secure Tokens**: Use `crypto.randomUUID()` for tokens
2. **Set Expiration**: Default 7 days, never longer than 30 days
3. **One-Time Use**: Invitations are marked accepted after use
4. **HTTPS Only**: Always use HTTPS in production

### User Authentication

1. **Microsoft 365 SSO**: Users authenticate via Microsoft Entra ID
2. **No Password Storage**: EaseMail never stores passwords
3. **Token Refresh**: OAuth tokens automatically refreshed
4. **Session Security**: JWT sessions with secure httpOnly cookies

## Troubleshooting

### User Cannot Sign Up

**Error**: "Invitation Required"

**Cause**: User tried to sign up without an invitation and no tenant exists for their domain

**Solution**:
1. Check if user's organization is already in the system
2. If yes: Have organization admin send invitation
3. If no: Bootstrap organization using CLI tool

### Invitation Not Working

**Error**: "Invitation has expired" or "Invitation not found"

**Cause**: Invitation expired or token is invalid

**Solution**:
1. Check invitation status in database
2. Cancel old invitation
3. Create new invitation
4. Send new invitation URL

### User Joined Wrong Organization

**Cause**: User has existing tenant, invitation was ignored

**Solution**:
- Users cannot change tenants after first sign-in
- Contact platform admin to manually fix in database
- Prevention: Check for existing user before bootstrapping

## API Reference

### POST /api/admin/bootstrap

Bootstrap a new organization.

**Headers:**
- `Content-Type: application/json`
- `x-admin-api-key: your-admin-api-key`

**Body:**
```json
{
  "organizationName": "Smith & Associates",
  "domain": "smithlaw.com",
  "ownerEmail": "mrsmith@smithlaw.com",
  "ownerName": "Mr. Smith",
  "plan": "professional"
}
```

**Response:**
```json
{
  "success": true,
  "tenant": {
    "id": "uuid",
    "name": "smithlaw.com",
    "display_name": "Smith & Associates",
    "plan": "professional"
  },
  "invitation": {
    "id": "uuid",
    "email": "mrsmith@smithlaw.com",
    "role": "owner",
    "token": "uuid",
    "expires_at": "2026-03-04T12:00:00.000Z",
    "invite_url": "https://your-domain.com/accept-invite?token=uuid"
  }
}
```

### POST /api/invitations

Create invitation (organization admins).

**Query Params:**
- `userEmail`: Email of admin creating invitation

**Body:**
```json
{
  "email": "colleague@smithlaw.com",
  "role": "member",
  "userEmail": "mrsmith@smithlaw.com"
}
```

### GET /api/invitations/verify

Verify invitation token.

**Query Params:**
- `token`: Invitation token

**Response:**
```json
{
  "invitation": {
    "id": "uuid",
    "email": "colleague@smithlaw.com",
    "role": "member",
    "tenant_name": "Smith & Associates",
    "inviter_name": "Mr. Smith",
    "expires_at": "2026-03-04T12:00:00.000Z"
  }
}
```

## Support

For additional support:
- Email: support@easemail.com
- Documentation: https://docs.easemail.com
- GitHub Issues: https://github.com/your-repo/issues
