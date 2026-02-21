# Clean Git History - Remove Exposed API Keys
# This script removes sensitive files from git history

Write-Host "🧹 Git History Cleanup Script" -ForegroundColor Yellow
Write-Host "=================================" -ForegroundColor Yellow
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path ".git")) {
    Write-Host "❌ Error: Not in a git repository" -ForegroundColor Red
    Write-Host "Run this script from the EcoAgent root directory" -ForegroundColor Red
    exit 1
}

Write-Host "⚠️  WARNING: This will rewrite git history!" -ForegroundColor Red
Write-Host "All team members will need to re-clone the repository" -ForegroundColor Red
Write-Host ""
$confirm = Read-Host "Type 'YES' to continue, or anything else to cancel"

if ($confirm -ne "YES") {
    Write-Host "❌ Cancelled" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "📦 Creating backup..." -ForegroundColor Cyan
$backupName = "EcoAgent-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
git clone --mirror . "../$backupName"
Write-Host "✅ Backup created: ../$backupName" -ForegroundColor Green

Write-Host ""
Write-Host "🔍 Files to remove from history:" -ForegroundColor Cyan
Write-Host "  - backend/.env" -ForegroundColor White
Write-Host "  - .env (if exists)" -ForegroundColor White

Write-Host ""
Write-Host "🗑️  Removing files from git history..." -ForegroundColor Cyan

# Remove backend/.env from all history
git filter-branch --force --index-filter `
  "git rm --cached --ignore-unmatch backend/.env .env" `
  --prune-empty --tag-name-filter cat -- --all

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Files removed from history" -ForegroundColor Green
} else {
    Write-Host "❌ Error removing files" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🧹 Cleaning up..." -ForegroundColor Cyan
git reflog expire --expire=now --all
git gc --prune=now --aggressive

Write-Host ""
Write-Host "✅ Cleanup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Yellow
Write-Host "1. Verify cleanup: git log --all --full-history -- backend/.env" -ForegroundColor White
Write-Host "   (Should return nothing)" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Force push to GitHub:" -ForegroundColor White
Write-Host "   git push origin --force --all" -ForegroundColor Cyan
Write-Host "   git push origin --force --tags" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Tell team members to:" -ForegroundColor White
Write-Host "   - Delete their local EcoAgent folder" -ForegroundColor Gray
Write-Host "   - Re-clone from GitHub" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Revoke the old API key at: https://console.groq.com/keys" -ForegroundColor White
Write-Host ""
Write-Host "Backup location: ../$backupName" -ForegroundColor Cyan
