#!/bin/bash
# Clean Git History - Remove Exposed API Keys (Linux/Mac version)

echo "🧹 Git History Cleanup Script"
echo "================================="
echo ""

# Check if we're in the right directory
if [ ! -d ".git" ]; then
    echo "❌ Error: Not in a git repository"
    echo "Run this script from the EcoAgent root directory"
    exit 1
fi

echo "⚠️  WARNING: This will rewrite git history!"
echo "All team members will need to re-clone the repository"
echo ""
read -p "Type 'YES' to continue, or anything else to cancel: " confirm

if [ "$confirm" != "YES" ]; then
    echo "❌ Cancelled"
    exit 0
fi

echo ""
echo "📦 Creating backup..."
backupName="EcoAgent-backup-$(date +%Y%m%d-%H%M%S)"
git clone --mirror . "../$backupName"
echo "✅ Backup created: ../$backupName"

echo ""
echo "🔍 Files to remove from history:"
echo "  - backend/.env"
echo "  - .env (if exists)"

echo ""
echo "🗑️  Removing files from git history..."

# Remove backend/.env from all history
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch backend/.env .env" \
  --prune-empty --tag-name-filter cat -- --all

if [ $? -eq 0 ]; then
    echo "✅ Files removed from history"
else
    echo "❌ Error removing files"
    exit 1
fi

echo ""
echo "🧹 Cleaning up..."
git reflog expire --expire=now --all
git gc --prune=now --aggressive

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Verify cleanup: git log --all --full-history -- backend/.env"
echo "   (Should return nothing)"
echo ""
echo "2. Force push to GitHub:"
echo "   git push origin --force --all"
echo "   git push origin --force --tags"
echo ""
echo "3. Tell team members to:"
echo "   - Delete their local EcoAgent folder"
echo "   - Re-clone from GitHub"
echo ""
echo "4. Revoke the old API key at: https://console.groq.com/keys"
echo ""
echo "Backup location: ../$backupName"
