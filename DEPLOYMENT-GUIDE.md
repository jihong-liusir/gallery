# 🚀 Azure App Service Deployment Guide

**Complete Step-by-Step Guide for Deploying Photo Gallery to Existing Azure App Service**

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Before You Start](#before-you-start)
3. [Deployment Methods](#deployment-methods)
   - [Option 1: Automated Script (Recommended)](#option-1-automated-script-recommended)
   - [Option 2: VS Code Extension (Visual)](#option-2-vs-code-extension-visual)
   - [Option 3: Manual Azure CLI](#option-3-manual-azure-cli)
4. [Post-Deployment Verification](#post-deployment-verification)
5. [Troubleshooting](#troubleshooting)
6. [Future Updates Workflow](#future-updates-workflow)
7. [Quick Reference](#quick-reference)

---

## Prerequisites

### Required Software

- ✅ **Node.js 20** or higher (`node --version`)
- ✅ **pnpm** package manager (`pnpm --version`)
- ✅ **Git** (`git --version`)
- ✅ **Azure CLI** (`az --version`)
  - If not installed: Download from https://aka.ms/installazurecliwindows
  - Or use: `winget install Microsoft.AzureCLI`

### Azure Resources

- ✅ **Azure App Service** already created (Node.js runtime)
- ✅ **Resource Group** where your App Service is located
- ✅ **Tencent COS Storage** with photos uploaded

### Project Files

- ✅ `.env.production` - Environment configuration file
- ✅ `builder.config.ts` - Photo processing configuration
- ✅ `deploy-direct-azure.ps1` - Automated deployment script
- ✅ `deploy.sh` - Build script for Azure

---

## Before You Start

### Step 1: Install Azure CLI (if needed)

Check if Azure CLI is installed:

```powershell
az --version
```

If not installed:

```powershell
# Using winget (Windows 11/10)
winget install Microsoft.AzureCLI

# Or download from: https://aka.ms/installazurecliwindows
```

### Step 2: Login to Azure

```powershell
# Login to Azure
az login

# Verify login
az account show

# List your subscriptions
az account list --output table

# Set active subscription (if you have multiple)
az account set --subscription "YOUR_SUBSCRIPTION_ID"
```

### Step 3: Get Your App Service Information

```powershell
# List all your App Services
az webapp list --output table

# Note down:
# - App Name (e.g., "my-gallery-app")
# - Resource Group (e.g., "gallery-rg")
# - Location (e.g., "East US")
```

### Step 4: Update Environment Configuration

Edit `.env.production` file and update the `NEXT_PUBLIC_APP_URL`:

```bash
# Replace "your-app-name" with your actual Azure App Service name
NEXT_PUBLIC_APP_URL=your-app-name.azurewebsites.net
```

Your `.env.production` should look like this:

```bash
# Tencent Cloud COS Configuration
COS_REGION=ap-chengdu
COS_BUCKET=media-1309653188
COS_SECRET_ID=your-cos-secret-id
COS_SECRET_KEY=your-cos-secret-key
COS_PREFIX=

# Next.js Configuration
NEXT_PUBLIC_APP_URL=your-app-name.azurewebsites.net
NODE_ENV=production
PORT=8080

# App Service Specific
WEBSITES_PORT=8080
```

### Step 5: Build Photo Manifest

Generate the photo manifest from your Tencent COS storage:

```powershell
# This downloads photos from COS and generates metadata
pnpm run build:manifest
```

**This step is important!** It will:
- Download photos from your COS bucket
- Extract EXIF metadata (camera, GPS, settings)
- Generate thumbnails
- Create `photos-manifest.json`

Wait for completion (may take several minutes depending on photo count).

---

## Deployment Methods

Choose the method that best suits your preference:

| Method | Best For | Difficulty | Time |
|--------|----------|------------|------|
| **Option 1: Script** | First-time setup, automation | ⭐ Easy | 10 min |
| **Option 2: VS Code** | Visual learners, GUI preference | ⭐ Very Easy | 15 min |
| **Option 3: Manual CLI** | Learning, full control | ⭐⭐ Medium | 20 min |

---

## Option 1: Automated Script (Recommended)

**This is the easiest and fastest method!**

### Step 1: Run Deployment Script

```powershell
# Replace with your actual App Service name and Resource Group
.\deploy-direct-azure.ps1 -ResourceGroup "your-resource-group" -AppName "your-app-name" -Location "East US"
```

**Example:**
```powershell
.\deploy-direct-azure.ps1 -ResourceGroup "gallery-rg" -AppName "my-photo-gallery" -Location "East US"
```

The script will:
- ✅ Verify Azure login
- ✅ Check/create resource group
- ✅ Check/create App Service Plan
- ✅ Check/create Web App with Node.js 20
- ✅ Configure build settings
- ✅ Set environment variables from `.env.production`
- ✅ Configure startup command
- ✅ Setup Git deployment

### Step 2: Note Deployment Credentials

The script will output deployment credentials. **Save these!**

```
🔑 Deployment credentials:
   Username: $your-app-name
   Password: xxxxxxxxxxxxxxxxxxxxxxxxx
```

### Step 3: Deploy Code via Git

```powershell
# Add all files
git add .

# Commit changes
git commit -m "Deploy photo gallery to Azure"

# Push to Azure (this triggers deployment)
git push azure main
```

When prompted, enter the deployment credentials from Step 2.

### Step 4: Monitor Deployment

Open a new PowerShell window and stream logs:

```powershell
az webapp log tail --name your-app-name --resource-group your-resource-group
```

Wait for deployment to complete (5-10 minutes). You'll see:
- Dependencies installation
- Running `deploy.sh` build script
- Building web app
- Building SSR app
- Starting application

### Step 5: Access Your Gallery

Open in browser:
```
https://your-app-name.azurewebsites.net
```

**Done!** 🎉

---

## Option 2: VS Code Extension (Visual)

**Perfect for visual learners who prefer GUI over command-line.**

### Prerequisites

Install VS Code extensions:
1. Open VS Code Extensions (`Ctrl+Shift+X`)
2. Search and install:
   - **Azure App Service** (`ms-azuretools.vscode-azureappservice`)
   - **Azure Resources** (`ms-azuretools.vscode-azureresourcegroups`)

### Step 1: Sign In to Azure

1. Press `Ctrl+Shift+P`
2. Type: `Azure: Sign In`
3. Follow browser authentication
4. Return to VS Code

### Step 2: Build Application Locally

```powershell
# Build the application
pnpm build
```

This creates production-ready files in:
- `apps/web/dist/` - SPA build
- `apps/ssr/.next/` - SSR build

### Step 3: Configure Environment Variables

1. Click **Azure icon** (🔷) in VS Code sidebar
2. Expand **App Service** section
3. Find and expand your subscription
4. **Right-click** your App Service → **Open in Portal**

In Azure Portal:
1. Navigate to **Configuration** → **Application Settings**
2. Click **+ New application setting** for each variable:

```
Name: COS_REGION                   Value: ap-chengdu
Name: COS_BUCKET                   Value: media-1309653188
Name: COS_SECRET_ID                Value: your-cos-secret-id
Name: COS_SECRET_KEY               Value: your-cos-secret-key
Name: COS_PREFIX                   Value: (leave empty)
Name: NEXT_PUBLIC_APP_URL          Value: your-app-name.azurewebsites.net
Name: NODE_ENV                     Value: production
Name: PORT                         Value: 8080
Name: WEBSITES_PORT                Value: 8080
Name: SCM_DO_BUILD_DURING_DEPLOYMENT  Value: true
Name: ENABLE_ORYX_BUILD            Value: true
Name: PRE_BUILD_SCRIPT_PATH        Value: deploy.sh
Name: WEBSITE_NODE_DEFAULT_VERSION Value: ~20
```

3. Click **Save** → **Continue**

### Step 4: Configure Startup Command

Still in Azure Portal:
1. Go to **Configuration** → **General Settings**
2. **Startup Command**: `cd apps/ssr && npm start`
3. Click **Save**

### Step 5: Deploy from VS Code

1. Return to VS Code
2. In Azure sidebar, find your App Service
3. **Right-click** → **Deploy to Web App...**
4. **Select folder to deploy**: Choose your workspace root
5. **Confirm** deployment when prompted
6. Wait 5-10 minutes

### Step 6: Monitor Deployment

In VS Code:
1. **Right-click** your App Service
2. **Select**: `Start Streaming Logs`
3. Watch deployment progress in Output panel

### Step 7: Verify Deployment

Once complete, in VS Code:
1. **Right-click** your App Service
2. **Select**: `Browse Website`

Or open browser:
```
https://your-app-name.azurewebsites.net
```

**Done!** 🎉

---

## Option 3: Manual Azure CLI

**For those who want full control and understanding of each step.**

### Step 1: Verify Azure Login

```powershell
# Check current login
az account show

# Login if needed
az login

# Set subscription (if you have multiple)
az account set --subscription "YOUR_SUBSCRIPTION_ID"

# Verify App Service exists
az webapp show --name YOUR_APP_NAME --resource-group YOUR_RG
```

### Step 2: Build Application

```powershell
# Build photo manifest
pnpm run build:manifest

# Build web app (Vite SPA)
pnpm --filter web build

# Build SSR app (Next.js)
pnpm --filter @afilmory/ssr build
```

### Step 3: Configure App Service Runtime

```powershell
# Set Node.js runtime and build configuration
az webapp config appsettings set `
  --name YOUR_APP_NAME `
  --resource-group YOUR_RG `
  --settings `
    SCM_DO_BUILD_DURING_DEPLOYMENT=true `
    ENABLE_ORYX_BUILD=true `
    PRE_BUILD_SCRIPT_PATH=deploy.sh `
    WEBSITE_NODE_DEFAULT_VERSION="~20" `
    WEBSITE_NPM_DEFAULT_VERSION="10.2.4" `
    NODE_ENV=production `
    PORT=8080 `
    WEBSITES_PORT=8080
```

### Step 4: Set Environment Variables

```powershell
# Set COS and app environment variables
az webapp config appsettings set `
  --name YOUR_APP_NAME `
  --resource-group YOUR_RG `
  --settings `
    COS_REGION=ap-chengdu `
    COS_BUCKET=media-1309653188 `
    COS_SECRET_ID=your-cos-secret-id `
    COS_SECRET_KEY=your-cos-secret-key `
    COS_PREFIX="" `
    NEXT_PUBLIC_APP_URL=YOUR_APP_NAME.azurewebsites.net
```

### Step 5: Set Startup Command

```powershell
# Configure how Azure starts your application
az webapp config set `
  --name YOUR_APP_NAME `
  --resource-group YOUR_RG `
  --startup-file "cd apps/ssr && npm start"
```

### Step 6: Setup Git Deployment

```powershell
# Enable local Git deployment
az webapp deployment source config-local-git `
  --name YOUR_APP_NAME `
  --resource-group YOUR_RG

# Get deployment URL
$gitUrl = az webapp deployment source config-local-git `
  --name YOUR_APP_NAME `
  --resource-group YOUR_RG `
  --query url `
  --output tsv

Write-Host "Git deployment URL: $gitUrl"

# Get deployment credentials
az webapp deployment list-publishing-credentials `
  --name YOUR_APP_NAME `
  --resource-group YOUR_RG `
  --query "{username:publishingUserName, password:publishingPassword}" `
  --output json
```

Save the username and password!

### Step 7: Add Azure Git Remote

```powershell
# Check existing remotes
git remote -v

# Add Azure remote (if not exists)
git remote add azure $gitUrl

# Or update if exists
git remote set-url azure $gitUrl
```

### Step 8: Deploy via Git Push

```powershell
# Ensure all changes are committed
git status

# Add and commit if needed
git add .
git commit -m "Deploy to Azure App Service"

# Push to Azure (triggers deployment)
git push azure main
```

Enter deployment credentials when prompted.

### Step 9: Monitor Deployment

```powershell
# Stream logs in real-time
az webapp log tail --name YOUR_APP_NAME --resource-group YOUR_RG

# Or in a separate window, check deployment status
az webapp deployment list-publishing-profiles `
  --name YOUR_APP_NAME `
  --resource-group YOUR_RG
```

### Step 10: Verify Deployment

```powershell
# Check app state
az webapp show `
  --name YOUR_APP_NAME `
  --resource-group YOUR_RG `
  --query "state" `
  --output tsv
```

Should return: `Running`

Open browser:
```
https://YOUR_APP_NAME.azurewebsites.net
```

**Done!** 🎉

---

## Post-Deployment Verification

### 1. Check Health Endpoint

Open in browser:
```
https://your-app-name.azurewebsites.net/api/health
```

**Expected response:**
```json
{
  "status": "ok"
}
```

### 2. Verify Photo Gallery Loads

1. Open: `https://your-app-name.azurewebsites.net`
2. **Check:** Photos from COS are displayed
3. **Open browser console** (F12 → Console)
4. **Verify:** No JavaScript errors

### 3. Test Photo Details

1. Click on any photo
2. **Check:** Photo opens in detail view
3. **Verify:** EXIF metadata displays (camera, lens, settings)
4. **Verify:** GPS location shows on map (if available)

### 4. Test Social Sharing

1. Copy your gallery URL
2. Paste in Twitter/Facebook
3. **Verify:** Preview card shows with correct image and description

### 5. Check Performance

1. Open browser DevTools (F12) → Network tab
2. Refresh page
3. **Verify:** Page loads in < 3 seconds
4. **Verify:** Images load progressively
5. **Check:** Lighthouse score (should be > 90)

---

## Troubleshooting

### Issue 1: "az: command not found" or Azure CLI Error

**Problem:** Azure CLI not installed or not in PATH

**Solution:**
```powershell
# Install Azure CLI
winget install Microsoft.AzureCLI

# Or download: https://aka.ms/installazurecliwindows

# After installation, restart PowerShell
# Verify installation
az --version
```

### Issue 2: Git Push Fails with Authentication Error

**Problem:** Wrong deployment credentials

**Solution:**
```powershell
# Get fresh credentials
az webapp deployment list-publishing-credentials `
  --name YOUR_APP_NAME `
  --resource-group YOUR_RG `
  --query "{username:publishingUserName, password:publishingPassword}" `
  --output json

# Try git push again with correct credentials
git push azure main
```

### Issue 3: Build Fails During Deployment

**Problem:** `deploy.sh` not executing or dependencies missing

**Solution:**
```powershell
# SSH into your app
az webapp ssh --name YOUR_APP_NAME --resource-group YOUR_RG

# Inside SSH session, check logs:
cd /home/site/wwwroot
ls -la
cat /home/LogFiles/kudu/trace/*.txt

# Check if deploy.sh is executable
ls -la deploy.sh
# Should show: -rwxr-xr-x

# Check Node.js version
node --version  # Should be v20.x

# Check if pnpm is available
which pnpm
```

If `deploy.sh` is not executable:
```bash
chmod +x deploy.sh
```

### Issue 4: App Returns 502 Bad Gateway

**Problem:** App not starting correctly, usually port mismatch or startup command issue

**Solution:**
```powershell
# Check startup command
az webapp config show `
  --name YOUR_APP_NAME `
  --resource-group YOUR_RG `
  --query "appCommandLine"

# Should return: cd apps/ssr && npm start

# Check PORT configuration
az webapp config appsettings list `
  --name YOUR_APP_NAME `
  --resource-group YOUR_RG `
  --query "[?name=='PORT' || name=='WEBSITES_PORT']" `
  --output table

# Both should be 8080

# If wrong, fix them:
az webapp config appsettings set `
  --name YOUR_APP_NAME `
  --resource-group YOUR_RG `
  --settings PORT=8080 WEBSITES_PORT=8080

# Restart app
az webapp restart --name YOUR_APP_NAME --resource-group YOUR_RG
```

### Issue 5: Photos Don't Load / Show Broken Images

**Problem:** COS credentials incorrect or bucket access issues

**Solution:**
```powershell
# Verify environment variables
az webapp config appsettings list `
  --name YOUR_APP_NAME `
  --resource-group YOUR_RG `
  --output table

# Check specifically COS settings
az webapp config appsettings list `
  --name YOUR_APP_NAME `
  --resource-group YOUR_RG `
  --query "[?starts_with(name, 'COS_')]" `
  --output table

# If wrong, update them:
az webapp config appsettings set `
  --name YOUR_APP_NAME `
  --resource-group YOUR_RG `
  --settings `
    COS_REGION=ap-chengdu `
    COS_BUCKET=media-1309653188 `
    COS_SECRET_ID=YOUR_SECRET_ID `
    COS_SECRET_KEY=YOUR_SECRET_KEY

# Restart app
az webapp restart --name YOUR_APP_NAME --resource-group YOUR_RG
```

**Test COS connection:**
```powershell
# SSH into app
az webapp ssh --name YOUR_APP_NAME --resource-group YOUR_RG

# Inside SSH, test environment variables
echo $COS_REGION
echo $COS_BUCKET
echo $COS_SECRET_ID
```

### Issue 6: Deployment Timeout

**Problem:** Build takes too long and Azure times out

**Solution:**
```powershell
# Increase SCM timeout to 1 hour
az webapp config appsettings set `
  --name YOUR_APP_NAME `
  --resource-group YOUR_RG `
  --settings SCM_COMMAND_IDLE_TIMEOUT=3600

# Restart and try deploying again
az webapp restart --name YOUR_APP_NAME --resource-group YOUR_RG
git push azure main
```

### Issue 7: "Application Error" Page

**Problem:** Application crashed after deployment

**Solution:**
```powershell
# Check application logs
az webapp log tail --name YOUR_APP_NAME --resource-group YOUR_RG

# Look for error messages in logs
# Common issues:
# - Missing dependencies
# - Wrong Node.js version
# - Environment variable issues
# - Port binding errors

# Download full logs for analysis
az webapp log download `
  --name YOUR_APP_NAME `
  --resource-group YOUR_RG `
  --log-file logs.zip

# Extract and check logs/docker.log
```

### Issue 8: CSS/JavaScript Not Loading

**Problem:** Static assets not found (404 errors)

**Solution:**
```powershell
# SSH into app and verify build output
az webapp ssh --name YOUR_APP_NAME --resource-group YOUR_RG

# Check if .next folder exists with static assets
cd /home/site/wwwroot/apps/ssr
ls -la .next/static

# If missing, rebuild might have failed
# Check build logs:
cat /home/LogFiles/kudu/trace/*.txt | grep -i error

# Force redeploy:
git commit --allow-empty -m "Force rebuild"
git push azure main
```

---

## Future Updates Workflow

### When You Add New Photos to COS

Every time you upload new photos to your Tencent COS bucket:

```powershell
# 1. Rebuild manifest (downloads new photos and processes metadata)
pnpm run build:manifest

# 2. Commit changes
git add .
git commit -m "Update: Add new photos from $(Get-Date -Format 'yyyy-MM-dd')"

# 3. Deploy to Azure
git push azure main

# 4. Monitor deployment
az webapp log tail --name YOUR_APP_NAME --resource-group YOUR_RG

# 5. Verify (wait 5-10 minutes)
# Open: https://your-app-name.azurewebsites.net
```

**Note:** Because your `builder.config.ts` has `repo.enable: false`, the manifest is bundled with your app. This means you **must redeploy** every time you add new photos.

### Alternative: Enable Dynamic Manifest Loading

To avoid redeployment for new photos, enable Git repository sync:

1. **Update `builder.config.ts`:**
```typescript
repo: {
    enable: true,
    url: 'https://github.com/your-username/your-manifest-repo',
    token: process.env.GITHUB_TOKEN,
}
```

2. **Set GitHub token:**
```powershell
# Add to .env.production
echo "GIT_TOKEN=your_github_token" >> .env.production

# Update Azure environment variable
az webapp config appsettings set `
  --name YOUR_APP_NAME `
  --resource-group YOUR_RG `
  --settings GIT_TOKEN=your_github_token
```

3. **Future workflow (no redeployment needed):**
```powershell
# Just rebuild manifest (it will push to GitHub)
pnpm run build:manifest

# Users will see new photos automatically!
# No need to redeploy the app
```

### When You Update Code

For code changes (not photo additions):

```powershell
# 1. Make your code changes

# 2. Test locally
pnpm dev

# 3. Build and verify
pnpm build

# 4. Commit and deploy
git add .
git commit -m "Fix: Your change description"
git push azure main

# 5. Monitor
az webapp log tail --name YOUR_APP_NAME --resource-group YOUR_RG
```

### When You Update Environment Variables

```powershell
# Update via Azure CLI
az webapp config appsettings set `
  --name YOUR_APP_NAME `
  --resource-group YOUR_RG `
  --settings NEW_VAR=new_value ANOTHER_VAR=another_value

# Restart app to apply changes
az webapp restart --name YOUR_APP_NAME --resource-group YOUR_RG

# Verify changes
az webapp config appsettings list `
  --name YOUR_APP_NAME `
  --resource-group YOUR_RG `
  --output table
```

---

## Quick Reference

### Essential Commands

```powershell
# ============================================
# Azure CLI - General
# ============================================

# Login to Azure
az login

# Show current account
az account show

# List subscriptions
az account list --output table

# Set subscription
az account set --subscription "SUBSCRIPTION_ID"

# ============================================
# App Service - Management
# ============================================

# List all App Services
az webapp list --output table

# Show specific app
az webapp show --name APP_NAME --resource-group RG_NAME

# Restart app
az webapp restart --name APP_NAME --resource-group RG_NAME

# Stop app
az webapp stop --name APP_NAME --resource-group RG_NAME

# Start app
az webapp start --name APP_NAME --resource-group RG_NAME

# Delete app
az webapp delete --name APP_NAME --resource-group RG_NAME

# ============================================
# Logging & Monitoring
# ============================================

# Stream logs (real-time)
az webapp log tail --name APP_NAME --resource-group RG_NAME

# Download logs
az webapp log download --name APP_NAME --resource-group RG_NAME

# SSH into app
az webapp ssh --name APP_NAME --resource-group RG_NAME

# ============================================
# Configuration
# ============================================

# List all app settings
az webapp config appsettings list --name APP_NAME --resource-group RG_NAME --output table

# Set app settings
az webapp config appsettings set --name APP_NAME --resource-group RG_NAME --settings KEY=VALUE

# Delete app setting
az webapp config appsettings delete --name APP_NAME --resource-group RG_NAME --setting-names KEY

# Show configuration
az webapp config show --name APP_NAME --resource-group RG_NAME

# Set startup command
az webapp config set --name APP_NAME --resource-group RG_NAME --startup-file "COMMAND"

# ============================================
# Deployment
# ============================================

# Setup local Git deployment
az webapp deployment source config-local-git --name APP_NAME --resource-group RG_NAME

# Get deployment credentials
az webapp deployment list-publishing-credentials --name APP_NAME --resource-group RG_NAME

# List deployment history
az webapp deployment list-publishing-profiles --name APP_NAME --resource-group RG_NAME

# ============================================
# Scaling
# ============================================

# Scale up (change plan size)
az appservice plan update --name PLAN_NAME --resource-group RG_NAME --sku S1

# Scale out (change instance count)
az appservice plan update --name PLAN_NAME --resource-group RG_NAME --number-of-workers 2

# ============================================
# Git Commands
# ============================================

# Add Azure remote
git remote add azure GIT_URL

# Update Azure remote
git remote set-url azure GIT_URL

# Deploy to Azure
git push azure main

# Force deploy
git push azure main --force

# ============================================
# Project Build Commands
# ============================================

# Install dependencies
pnpm install

# Build manifest from COS
pnpm run build:manifest

# Build web app
pnpm --filter web build

# Build SSR app
pnpm --filter @afilmory/ssr build

# Build everything
pnpm build

# Run locally
pnpm dev

# ============================================
# Troubleshooting
# ============================================

# View environment variables
az webapp config appsettings list --name APP_NAME --resource-group RG_NAME --output table

# Check app state
az webapp show --name APP_NAME --resource-group RG_NAME --query "state"

# Browse app (opens in browser)
az webapp browse --name APP_NAME --resource-group RG_NAME

# Show app URL
az webapp show --name APP_NAME --resource-group RG_NAME --query "defaultHostName" --output tsv
```

### Environment Variables Reference

All environment variables needed in Azure App Service:

```bash
# Runtime Configuration
NODE_ENV=production
PORT=8080
WEBSITES_PORT=8080

# Build Configuration
SCM_DO_BUILD_DURING_DEPLOYMENT=true
ENABLE_ORYX_BUILD=true
PRE_BUILD_SCRIPT_PATH=deploy.sh
WEBSITE_NODE_DEFAULT_VERSION=~20
WEBSITE_NPM_DEFAULT_VERSION=10.2.4

# Tencent COS Storage
COS_REGION=ap-chengdu
COS_BUCKET=media-1309653188
COS_SECRET_ID=your_secret_id
COS_SECRET_KEY=your_secret_key
COS_PREFIX=

# Application Configuration
NEXT_PUBLIC_APP_URL=your-app-name.azurewebsites.net

# Optional: GitHub Token (if using git repo for manifest)
GIT_TOKEN=your_github_token

# Optional: Database (if needed)
DATABASE_URL=your_database_url
PG_CONNECTION_STRING=your_postgres_connection
```

### Useful URLs

Replace `YOUR_APP_NAME` with your actual app name:

- **Main App**: `https://YOUR_APP_NAME.azurewebsites.net`
- **Health Check**: `https://YOUR_APP_NAME.azurewebsites.net/api/health`
- **Azure Portal**: `https://portal.azure.com`
- **App Service Portal**: `https://portal.azure.com/#@/resource/subscriptions/YOUR_SUB_ID/resourceGroups/YOUR_RG/providers/Microsoft.Web/sites/YOUR_APP_NAME`
- **Kudu (Advanced Tools)**: `https://YOUR_APP_NAME.scm.azurewebsites.net`
- **Log Stream**: `https://YOUR_APP_NAME.scm.azurewebsites.net/api/logstream`

### File Structure Reference

Key files for deployment:

```
gallery/
├── .deployment              # Azure deployment configuration
├── deploy.sh               # Build script for Azure (pnpm monorepo)
├── package-azure.json      # Azure-compatible package.json
├── .env.production         # Production environment variables
├── builder.config.ts       # Photo processing configuration
├── site.config.ts          # Site metadata and branding
├── apps/
│   ├── web/               # Vite SPA (React frontend)
│   │   └── dist/          # Built files (after pnpm build)
│   └── ssr/               # Next.js SSR app
│       ├── .next/         # Built files (after pnpm build)
│       └── src/
│           └── index.html.ts  # Pre-compiled HTML template
└── photos-manifest.json   # Photo metadata (after build:manifest)
```

---

## Support & Resources

### Documentation

- **Azure App Service**: https://docs.microsoft.com/azure/app-service/
- **Azure CLI Reference**: https://docs.microsoft.com/cli/azure/
- **Next.js Deployment**: https://nextjs.org/docs/deployment
- **Vite Production Build**: https://vitejs.dev/guide/build.html

### Project-Specific Docs

- `README.md` - Project overview and quick start
- `AGENTS.md` - Architecture and development guidelines
- `AZURE-DIRECT-DEPLOY.md` - Detailed Azure deployment info
- `AZURE-ENVIRONMENT.md` - Environment variables reference
- `VSCODE-AZURE-DEPLOY.md` - VS Code extension deployment guide

### Common Azure Pricing (as of 2025)

- **B1 Plan**: ~$13/month (1 GB RAM, 1 vCPU)
- **S1 Plan**: ~$70/month (1.75 GB RAM, auto-scaling)
- **P1v2 Plan**: ~$85/month (3.5 GB RAM, production-ready)

**Storage costs** (Tencent COS) depend on usage and region.

### Getting Help

1. **Check logs first**: `az webapp log tail --name APP_NAME --resource-group RG_NAME`
2. **Review troubleshooting section** in this guide
3. **Check Azure service health**: https://status.azure.com/
4. **Azure Support**: https://azure.microsoft.com/support/

---

## Summary

✅ **Three deployment methods available:**
- **Automated Script** - Fastest, handles everything automatically
- **VS Code Extension** - Visual, user-friendly GUI approach
- **Manual Azure CLI** - Full control, best for learning

✅ **Key points to remember:**
- Build manifest before each deployment with new photos
- Environment variables must be set in Azure
- Deployment takes 5-10 minutes
- Monitor logs to catch issues early
- Test thoroughly after deployment

✅ **For future updates:**
- New photos: Rebuild manifest + redeploy
- Code changes: Commit + git push azure main
- Consider enabling git repo sync to avoid redeployment

**Good luck with your deployment!** 🚀

If you encounter any issues, refer to the Troubleshooting section or check the logs using `az webapp log tail`.
