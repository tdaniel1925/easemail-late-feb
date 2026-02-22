# Push to GitHub (Clean Version - No Secrets)

Write-Host "Cleaning git history and pushing to GitHub..." -ForegroundColor Cyan
Write-Host ""

# Backup .env
Copy-Item pocs\.env pocs\.env.backup -Force -ErrorAction SilentlyContinue
Write-Host "Backed up pocs/.env" -ForegroundColor Green

# Remove old git
Remove-Item -Recurse -Force .git -ErrorAction SilentlyContinue
Write-Host "Removed old git history" -ForegroundColor Green

# Initialize fresh repo
git init
git branch -M main
Write-Host "Initialized fresh git repo" -ForegroundColor Green
Write-Host ""

# Stage files
git add .
Write-Host "Staged all files" -ForegroundColor Green

# Unstage secrets
git reset pocs/.env 2>$null
git reset pocs/.env.backup 2>$null
Write-Host "Excluded secret files" -ForegroundColor Green
Write-Host ""

# Commit
git commit -m "Initial commit: EaseMail v3 spec + Phase 0 POCs complete"
Write-Host "Created commit" -ForegroundColor Green
Write-Host ""

# Add remote
git remote remove origin 2>$null
git remote add origin https://github.com/tdaniel1925/easemail-late-feb.git
Write-Host "Connected to GitHub" -ForegroundColor Green
Write-Host ""

# Push
Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
Write-Host ""
git push -u origin main --force

Write-Host ""
if ($LASTEXITCODE -eq 0) {
    Write-Host "SUCCESS! Pushed to GitHub" -ForegroundColor Green
    Write-Host "https://github.com/tdaniel1925/easemail-late-feb" -ForegroundColor Cyan
} else {
    Write-Host "Push failed. Check error above." -ForegroundColor Red
}
