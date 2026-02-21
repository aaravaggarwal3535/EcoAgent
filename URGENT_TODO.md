# 🚨 URGENT: Security & Deployment Fixes

## ⚠️ CRITICAL SECURITY ISSUE

**Your Groq API key was exposed in git history!**

Key: `gsk_OlzSDylc...dktv` (redacted - check your local .env file for the full key)

### Immediate Actions (DO NOW - in order):

#### 1. Revoke the Compromised Key (2 minutes)
```
🌐 Open: https://console.groq.com/keys
🔍 Find key: gsk_OlzSDylc...
🗑️  Click: Delete/Revoke
✅ Confirm deletion
```

#### 2. Generate New API Key (1 minute)
```
🌐 In Groq Console
➕ Click: "Create API Key"
📝 Name: EcoAgent-Production
📋 Copy the new key (you won't see it again!)
```

#### 3. Update Local Environment (30 seconds)
```powershell
# DO NOT COMMIT THIS FILE
cd backend
notepad .env
# Replace GROQ_API_KEY with your NEW key
```

#### 4. Clean Git History (5 minutes)
```powershell
# From EcoAgent root directory
cd C:\Coding\EcoAgent
.\scripts\cleanup-git-history.ps1
# Follow the prompts, type YES when asked
```

#### 5. Force Push to GitHub (1 minute)
```powershell
git push origin --force --all
git push origin --force --tags
```

#### 6. Update Render (2 minutes)
```
🌐 Open: https://dashboard.render.com
🎯 Select: ecoagent-backend
⚙️  Go to: Environment tab
🔑 Update: GROQ_API_KEY with your NEW key
💾 Click: Save Changes
```

---

## 🚀 Deployment Fixes (Already Done)

I've fixed the deployment issues:

### ✅ Fixed Files:
1. **backend/requirements.txt** - Resolved pydantic version conflicts
2. **render.yaml** - Fixed build paths
3. **runtime.txt** - Specified Python 3.12.7
4. **.python-version** - For consistent Python version

### 📦 Commit and Deploy:
```powershell
# Commit the fixes
git add backend/requirements.txt render.yaml runtime.txt .python-version
git commit -m "fix: resolve dependency conflicts and deployment config"
git push origin master
```

### 🎯 Monitor Deployment:
```
🌐 Open: https://dashboard.render.com
📊 Watch: Build logs
⏱️  Wait: 3-5 minutes for deployment
```

---

## ✅ Verification Checklist

### After Key Revocation:
- [ ] Old key deleted from Groq console
- [ ] New key generated and copied
- [ ] Local `.env` updated with new key
- [ ] `.env` is in `.gitignore` (already done ✅)
- [ ] Git history cleaned
- [ ] Force pushed to GitHub
- [ ] Render environment variable updated

### After Deployment:
- [ ] Build succeeds on Render
- [ ] Service starts successfully  
- [ ] Health check passes: `curl https://your-app.onrender.com/health`
- [ ] API responds correctly

---

## 🔐 Prevention (Do Later)

### Install Pre-commit Hooks:
```powershell
pip install pre-commit
pre-commit install
```

### Enable GitHub Secret Scanning:
```
🌐 GitHub Repo → Settings → Security → Enable secret scanning
```

### Use Password Manager:
- Store API keys in 1Password, Bitwarden, etc.
- Never store in files or notes

---

## 📞 Need Help?

**If something goes wrong:**

1. **Check Render Logs:**
   - Dashboard → Service → Logs

2. **Test Locally:**
   ```powershell
   cd backend
   pip install -r requirements.txt
   python main.py
   ```

3. **Verify .env is ignored:**
   ```powershell
git status backend/.env
   # Should say: "Untracked files" or nothing
   ```

---

## 📊 Timeline

| Time | Action | Status |
|------|--------|--------|
| Now | Revoke old API key | ⏳ **PENDING** |
| +2 min | Generate new key | ⏳ **PENDING** |
| +5 min | Clean git history | ⏳ **PENDING** |
| +10 min | Force push & deploy | ⏳ **PENDING** |
| +15 min | Verify deployment | ⏳ **PENDING** |

---

## 🎯 Quick Commands

```powershell
# Full sequence (run from EcoAgent root):

# 1. After revoking key and generating new one, update local .env
cd backend
notepad .env  # Update GROQ_API_KEY

# 2. Clean git history
cd ..
.\scripts\cleanup-git-history.ps1

# 3. Verify cleanup
git log --all --full-history -- backend/.env
# Should return NOTHING

# 4. Push fixes
git add backend/requirements.txt render.yaml runtime.txt .python-version scripts/
git commit -m "fix: deployment config and add security measures"
git push origin --force --all

# 5. Monitor deployment
# Go to render.com dashboard and watch logs
```

---

**Priority:** 🔴 **CRITICAL - Do this immediately**

**Time Required:** ~15 minutes total

**See Also:**
- [SECURITY_INCIDENT.md](SECURITY_INCIDENT.md) - Full incident report
- [DEPLOYMENT.md](DEPLOYMENT.md) - Deployment guide
