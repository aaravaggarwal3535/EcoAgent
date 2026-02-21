# 🚨 SECURITY INCIDENT RESPONSE

## IMMEDIATE ACTION REQUIRED

### Your API Key Has Been Compromised

**Exposed Key:** `gsk_OlzSDylc...dktv` (redacted for security)

**Location:** Committed to GitHub repository in commit `906e712` (first commit)

**Public Exposure:** This key is now publicly visible on GitHub

---

## Steps to Remediate (DO THIS NOW):

### 1. Revoke Compromised Key
```
1. Go to: https://console.groq.com/keys
2. Find the key starting with: gsk_OlzSDylc...
3. Click "Delete" or "Revoke"
4. Confirm deletion
```

### 2. Generate New API Key
```
1. In Groq Console, click "Create API Key"
2. Name it: "EcoAgent-Production"
3. Copy the new key immediately
4. Store it securely (password manager)
```

### 3. Update Local Environment
```bash
cd backend
# Edit .env file - DO NOT COMMIT THIS FILE
# Replace with your NEW key:
GROQ_API_KEY=your_new_key_here
```

### 4. Update Render Environment Variables
```
1. Go to: https://dashboard.render.com
2. Select your service: ecoagent-backend
3. Go to "Environment" tab
4. Update GROQ_API_KEY with your NEW key
5. Click "Save Changes"
6. Service will auto-restart
```

### 5. Clean Git History (CRITICAL)
```bash
# WARNING: This rewrites history - coordinate with team

# Option A: Remove .env from history
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch backend/.env" \
  --prune-empty --tag-name-filter cat -- --all

# Option B: Use BFG Repo Cleaner (recommended)
# Download from: https://rtyley.github.io/bfg-repo-cleaner/
java -jar bfg.jar --delete-files .env
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push (DANGEROUS - team must re-clone)
git push origin --force --all
git push origin --force --tags
```

### 6. Verify Cleanup
```bash
# Check that .env is not in history
git log --all --full-history -- backend/.env

# Should return NOTHING
```

### 7. Notify Team
- [ ] Inform all team members about the incident
- [ ] Tell them to delete their local repos and re-clone
- [ ] Share the new API key securely (NOT via email/chat)

---

## Prevention Checklist

### ✅ Verify .gitignore
```bash
# Ensure these lines exist in .gitignore:
.env
.env.*
backend/.env
*.env
```

### ✅ Pre-commit Hook
```bash
# Install pre-commit hooks to prevent future leaks
pip install pre-commit
# Create .pre-commit-config.yaml:
cat > .pre-commit-config.yaml << 'EOF'
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.5.0
    hooks:
      - id: check-added-large-files
      - id: detect-private-key
  - repo: https://github.com/Yelp/detect-secrets
    rev: v1.4.0
    hooks:
      - id: detect-secrets
EOF

pre-commit install
```

### ✅ Scan Repository
```bash
# Use git-secrets to scan for exposed secrets
git clone https://github.com/awslabs/git-secrets
cd git-secrets
make install
cd ../EcoAgent
git secrets --install
git secrets --register-aws
git secrets --scan-history
```

### ✅ GitHub Secret Scanning
```
1. Go to: https://github.com/yourusername/EcoAgent/settings/security_analysis
2. Enable "Secret scanning"
3. Enable "Push protection"
```

---

## Monitor for Abuse

### Check Groq Usage
```
1. https://console.groq.com/usage
2. Look for unexpected API calls
3. Check for unusual patterns
4. Set up usage alerts
```

### Review Access Logs
- Check if anyone else accessed your account
- Review recent API activity
- Look for unauthorized requests

---

## Timeline

- **Incident Discovered:** February 17, 2026
- **Key Exposed In:** Commit 906e712 (first commit)
- **Pushed to GitHub:** Public repository
- **Exposure Duration:** Unknown - could be days/weeks

---

## Lessons Learned

1. **NEVER commit .env files**
2. **Always use .env.example templates**
3. **Use pre-commit hooks**
4. **Enable GitHub secret scanning**
5. **Rotate keys regularly**
6. **Use environment variable management tools (Vault, AWS Secrets Manager)**

---

## Contact

If you notice suspicious activity:
- Groq Support: support@groq.com
- GitHub Support: https://support.github.com

---

**Status:** 🔴 ACTIVE INCIDENT - IMMEDIATE ACTION REQUIRED

**Next Review:** After remediation steps completed
