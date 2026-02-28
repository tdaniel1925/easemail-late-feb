# Setup Checklist for EaseMail v3

## Files Created ✅
- ✅ `.env.local` - Environment variables configured
- ✅ `.gitignore` - Git ignore rules set up
- ✅ `WIPE-DATABASE.sql` - Database cleanup script

---

## What YOU Need to Do Manually

### 1. Wipe the Existing Database (2 minutes)

**Option A: Via Supabase SQL Editor (Recommended)**

1. Go to https://supabase.com/dashboard/project/bfswjaswmfwvpwvrsqdb/sql/new
2. Copy all content from `WIPE-DATABASE.sql`
3. Paste into SQL editor
4. Click "Run" button
5. Verify "0 rows" returned (means database is clean)

**Option B: Via Dashboard**
1. Go to https://supabase.com/dashboard/project/bfswjaswmfwvpwvrsqdb/database/tables
2. Delete each table manually (click ... → Delete table)

---

### 2. Install Supabase CLI (5 minutes)

**Choose ONE method:**

**Method A: Scoop (Recommended for Windows)**
```powershell
# Install Scoop (if not installed)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
Invoke-RestMethod -Uri https://get.scoop.sh | Invoke-Expression

# Install Supabase
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

**Method B: Direct Download**
1. Download: https://github.com/supabase/cli/releases/latest
2. Get: `supabase_windows_amd64.zip`
3. Extract `supabase.exe` to `C:\Users\tdani\bin\`
4. Add to PATH (run in PowerShell):
```powershell
$env:Path += ";C:\Users\tdani\bin"
[Environment]::SetEnvironmentVariable("Path", $env:Path + ";C:\Users\tdani\bin", [EnvironmentVariableTarget]::User)
```

**Verify installation:**
```powershell
supabase --version
```

---

### 3. Link Supabase CLI to Your Project (1 minute)

```powershell
# Make sure you're in the project directory
cd "C:\dev\1 - EaseMail -  Late Feb"

# Login to Supabase (opens browser)
supabase login

# Initialize Supabase
supabase init

# Link to your project
supabase link --project-ref bfswjaswmfwvpwvrsqdb --password ttandSellaBella1234

# Verify link worked
supabase status
```

---

### 4. Generate Admin API Key (1 minute)

EaseMail uses an invitation-only system. Platform admins need an API key to bootstrap new organizations.

**Generate a secure API key:**
```powershell
# Using OpenSSL (if installed)
openssl rand -base64 32

# OR using PowerShell
[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((New-Guid).Guid))
```

**Add to `.env.local`:**
```bash
ADMIN_API_KEY=your-generated-key-here
```

**Important:**
- Keep this key secret
- Never commit it to git
- Rotate every 90 days
- Only share with trusted platform admins

**To bootstrap a new organization:**
```powershell
npm run bootstrap
```

See `ADMIN-GUIDE.md` for complete documentation on managing organizations and invitations.

---

### 5. Commit Initial Setup (1 minute)

```powershell
# Initialize git (if not already done)
git init
git branch -M main

# Add files
git add .

# Commit
git commit -m "Initial setup: Environment configured, database ready"
```

---

## What's Next?

After completing the checklist above, you have TWO options:

### Option A: Phase 0 POCs (Recommended - 4 hours)
Validate critical integrations BEFORE building the full app:
- POC 1: Token Refresh Reliability
- POC 2: Delta Sync Performance
- POC 3: Webhook Reliability

**Why:** Catch integration issues early, save weeks of debugging

### Option B: Jump to Agent 1, Step 1.1 (Faster - but riskier)
Start building the Next.js app immediately.

**Why:** Move fast, debug integration issues as they arise

---

## Completion Status

- [ ] Database wiped via SQL script
- [ ] Supabase CLI installed
- [ ] Supabase CLI linked to project
- [ ] Admin API key generated and added to .env.local
- [ ] Git repo initialized and committed
- [ ] Ready to choose Path A or B

---

**When you've completed these steps, tell Claude Code which path you want to take!**
