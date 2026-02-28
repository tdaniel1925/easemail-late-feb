# Phase 1 Deployment Checklist

**Quick Reference for Production Deployment**

---

## Pre-Deployment (Before you start)

- [ ] Database backup created in Supabase
- [ ] Production environment variables configured in Vercel
- [ ] Git tag created: `git tag -a v1.0.0-phase1 -m "Phase 1 deployment"`
- [ ] Reviewed `PRODUCTION-DEPLOYMENT.md` for full details

---

## Deployment Steps (Execute in order)

### 1. Apply Database Migration ⏱️ 2-5 minutes

**Via Supabase Dashboard:**
- [ ] Login to https://app.supabase.com
- [ ] Navigate to Database → Migrations
- [ ] Create new migration named `010_critical_fixes`
- [ ] Copy contents from `supabase/migrations/010_critical_fixes.sql`
- [ ] Run migration
- [ ] Verify success (green checkmark)

**What it does:** Enables RLS, adds indexes, adds constraints

---

### 2. Deploy Application Code ⏱️ 3-5 minutes

**Via Git Push (Recommended):**
```bash
git checkout main
git push origin main --tags
```

**Monitor:**
- [ ] Check Vercel dashboard for build progress
- [ ] Wait for "Deployment Complete" confirmation
- [ ] Note deployment URL

---

### 3. Verify Environment Variables ⏱️ 2 minutes

**In Vercel Dashboard → Settings → Environment Variables**

**Required (Must Have):**
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `AZURE_AD_CLIENT_ID`
- [ ] `AZURE_AD_CLIENT_SECRET`
- [ ] `AZURE_AD_TENANT_ID`
- [ ] `NEXTAUTH_URL` (production domain)
- [ ] `NEXTAUTH_SECRET` (32+ chars)

**Optional (Recommended):**
- [ ] `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` (for AI features)
- [ ] `NEXT_PUBLIC_SENTRY_DSN` (for error monitoring)
- [ ] `WEBHOOK_SECRET` (32+ chars for webhooks)

---

## Post-Deployment Verification ⏱️ 15-30 minutes

### Automated Checks (Immediate)

```bash
# 1. Health check
curl https://your-domain.com

# 2. API check
curl https://your-domain.com/api/accounts
# Expected: 401 Unauthorized (means API is working)
```

- [ ] Application loads without errors
- [ ] Check logs for: `✅ All environment variables validated successfully`

### Manual Testing

**Authentication:**
- [ ] Navigate to `/login`
- [ ] Sign in with Microsoft
- [ ] Successfully redirected to dashboard

**Email Sync:**
- [ ] Connect email account
- [ ] Wait 30-60 seconds
- [ ] Folders appear in sidebar
- [ ] Messages load in inbox
- [ ] No errors in browser console

**Performance:**
- [ ] Open DevTools → Network tab
- [ ] API calls occur every ~30 seconds (not every 3 seconds)
- [ ] Sync completes in <2 minutes for 5,000+ messages

**Database (Via Supabase SQL Editor):**
```sql
-- Verify RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('messages', 'account_folders', 'attachments');
-- All should show rowsecurity = true

-- Verify indexes exist
SELECT indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_messages%';
-- Should return 10+ indexes
```

- [ ] RLS enabled on all 7 tables
- [ ] 20+ indexes created
- [ ] No unexpected errors in database logs

---

## Success Criteria

Deployment is successful when:

- [x] Migration applied without errors
- [ ] Application deployed and accessible
- [ ] Users can authenticate
- [ ] Email sync working correctly
- [ ] No critical errors in logs/Sentry
- [ ] Performance metrics meet expectations:
  - Sync: ~60 messages/second
  - API polling: 30-second intervals
  - Query performance: fast (<500ms)

---

## If Something Goes Wrong

### Migration Failed
1. **STOP** - Do not deploy application code
2. Check Supabase logs for error details
3. Restore database from backup
4. Review migration file and fix issues

### Deployment Failed
1. Vercel auto-rolls back to previous version
2. Check build logs in Vercel dashboard
3. Fix errors and redeploy

### Issues After Deployment
1. Check Sentry for error details (if configured)
2. Check Vercel logs for application errors
3. Check Supabase logs for database errors
4. Review troubleshooting section in `PRODUCTION-DEPLOYMENT.md`

**Quick Rollback:**
```bash
# Via Vercel Dashboard:
# Deployments → [Previous Deployment] → Promote to Production
```

---

## Monitoring (First 24 Hours)

**Watch for:**
- Error rate (target: <1%)
- Response times (target: <500ms)
- Sync performance (target: 50-70 messages/sec)
- User-reported issues

**Where to monitor:**
- Vercel Deployment Logs
- Supabase Database Metrics
- Sentry Error Dashboard (if configured)
- User feedback channels

---

## Post-Deployment Actions

**Immediate (Next 1-2 hours):**
- [ ] Monitor error rates closely
- [ ] Watch first few user syncs
- [ ] Respond to any user reports

**First 24 Hours:**
- [ ] Check performance metrics
- [ ] Review Sentry for unexpected errors
- [ ] Document any issues encountered
- [ ] Update deployment documentation if needed

**First Week:**
- [ ] Analyze performance data
- [ ] Collect user feedback
- [ ] Plan any necessary hotfixes
- [ ] Schedule Phase 2 planning meeting

---

## Quick Links

- Full Deployment Guide: `PRODUCTION-DEPLOYMENT.md`
- Test Results: `PHASE-1-TEST-RESULTS.md`
- Migration File: `supabase/migrations/010_critical_fixes.sql`
- Environment Template: `.env.example`

---

**Version:** 1.0
**Date:** 2026-02-28
**Status:** Ready for Production ✅
