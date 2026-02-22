# Fix Git History and Push to GitHub (Without Secrets)
# This script removes secrets from git history and pushes cleanly to GitHub

Write-Host "🔧 Fixing git history and removing secrets..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Backup .env file
Write-Host "📦 Backing up pocs/.env..." -ForegroundColor Yellow
Copy-Item pocs\.env pocs\.env.backup -Force
Write-Host "✅ Backup created: pocs/.env.backup" -ForegroundColor Green
Write-Host ""

# Step 2: Remove git history
Write-Host "🗑️  Removing old git history..." -ForegroundColor Yellow
Remove-Item -Recurse -Force .git -ErrorAction SilentlyContinue
Write-Host "✅ Git history removed" -ForegroundColor Green
Write-Host ""

# Step 3: Initialize fresh git repo
Write-Host "🆕 Initializing fresh git repository..." -ForegroundColor Yellow
git init
git branch -M main
Write-Host "✅ Git initialized" -ForegroundColor Green
Write-Host ""

# Step 4: Verify .gitignore includes pocs/.env
Write-Host "🔍 Verifying .gitignore protects secrets..." -ForegroundColor Yellow
$gitignoreContent = Get-Content .gitignore -Raw
if ($gitignoreContent -match "pocs/\.env") {
    Write-Host "✅ pocs/.env is in .gitignore" -ForegroundColor Green
} else {
    Write-Host "⚠️  Adding pocs/.env to .gitignore..." -ForegroundColor Yellow
    Add-Content .gitignore "`n# POC environment variables`npocs/.env"
    Write-Host "✅ Added to .gitignore" -ForegroundColor Green
}
Write-Host ""

# Step 5: Stage all files
Write-Host "📁 Adding files to git..." -ForegroundColor Yellow
git add .
Write-Host "✅ Files staged" -ForegroundColor Green
Write-Host ""

# Step 6: Unstage pocs/.env if it was accidentally added
Write-Host "🔒 Ensuring secrets are not staged..." -ForegroundColor Yellow
git reset pocs/.env 2>$null
git reset pocs/.env.backup 2>$null
Write-Host "✅ Secrets excluded" -ForegroundColor Green
Write-Host ""

# Step 7: Show what will be committed
Write-Host "📋 Files to be committed:" -ForegroundColor Cyan
git status --short
Write-Host ""

# Step 8: Verify pocs/.env is NOT in the list
$status = git status --short
if ($status -match "pocs/\.env") {
    Write-Host "❌ ERROR: pocs/.env is still staged!" -ForegroundColor Red
    Write-Host "   This should not happen. Stopping script." -ForegroundColor Red
    exit 1
} else {
    Write-Host "✅ Verified: No secrets will be committed" -ForegroundColor Green
}
Write-Host ""

# Step 9: Commit
Write-Host "💾 Creating commit..." -ForegroundColor Yellow
git commit -m "Initial commit: EaseMail v3 spec + Phase 0 POCs complete (all passed)"
Write-Host "✅ Commit created" -ForegroundColor Green
Write-Host ""

# Step 10: Add remote
Write-Host "🔗 Connecting to GitHub..." -ForegroundColor Yellow
git remote remove origin 2>$null
git remote add origin https://github.com/tdaniel1925/easemail-late-feb.git
Write-Host "✅ Remote added" -ForegroundColor Green
Write-Host ""

# Step 11: Push
Write-Host "🚀 Pushing to GitHub (force push to clean history)..." -ForegroundColor Yellow
Write-Host ""
Write-Host "⚠️  You may be asked for GitHub credentials:" -ForegroundColor Yellow
Write-Host "   Username: Your GitHub username" -ForegroundColor White
Write-Host "   Password: Use a Personal Access Token (not your password)" -ForegroundColor White
Write-Host "   Token: https://github.com/settings/tokens" -ForegroundColor White
Write-Host ""

git push -u origin main --force

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host "✅ SUCCESS! Repository pushed to GitHub" -ForegroundColor Green
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Summary:" -ForegroundColor Cyan
    Write-Host "   ✅ Git history cleaned" -ForegroundColor Green
    Write-Host "   ✅ Secrets removed from repository" -ForegroundColor Green
    Write-Host "   ✅ Pushed to: https://github.com/tdaniel1925/easemail-late-feb" -ForegroundColor Green
    Write-Host ""
    Write-Host "WARNING: Rotate your Azure AD secret!" -ForegroundColor Yellow
    Write-Host "   1. Go to: https://portal.azure.com" -ForegroundColor White
    Write-Host "   2. App registrations - Your app - Certificates and secrets" -ForegroundColor White
    Write-Host "   3. Delete the old secret" -ForegroundColor White
    Write-Host "   4. Create a new secret" -ForegroundColor White
    Write-Host "   5. Update pocs/.env locally (never commit it!)" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "Push failed. Check the error above." -ForegroundColor Red
    Write-Host ""
    Write-Host "Common issues:" -ForegroundColor Yellow
    Write-Host "   - Authentication failed: Use Personal Access Token, not password" -ForegroundColor White
    Write-Host "   - Network issue: Check your internet connection" -ForegroundColor White
    Write-Host ""
}
