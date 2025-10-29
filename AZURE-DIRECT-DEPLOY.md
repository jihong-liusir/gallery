# Azure App Service Direct Deployment Guide (No Container)

## 🎯 Overview

This guide shows how to deploy your photo gallery directly to Azure App Service using Node.js runtime (without Docker containers). This is simpler than container deployment but provides the same functionality.

## 📋 Prerequisites

1. **Azure CLI installed and logged in**
2. **Git repository with your code**
3. **pnpm/npm available locally**
4. **Environment variables configured**

## 🚀 Quick Start (5 minutes)

### Option A: Automated Deployment Script
```powershell
# 1. Configure your app name and resource group
.\deploy-direct-azure.ps1 -ResourceGroup "gallery-rg" -AppName "my-gallery-app"

# 2. Create environment file (see AZURE-ENVIRONMENT.md)
cp .env.example .env.production
# Edit .env.production with your values

# 3. Deploy code
git add .
git commit -m "Deploy to Azure"
git push azure main
```

### Option B: Manual Step-by-Step
Follow the detailed steps below for full control.

## 📖 Detailed Manual Deployment

### Step 1: Azure Resource Setup

```bash
# Login to Azure
az login

# Create resource group
az group create --name gallery-rg --location "East US"

# Create App Service Plan (Linux, B1 tier)
az appservice plan create \
  --name gallery-plan \
  --resource-group gallery-rg \
  --sku B1 \
  --is-linux

# Create Web App with Node.js 20
az webapp create \
  --name my-gallery-app \
  --resource-group gallery-rg \
  --plan gallery-plan \
  --runtime "NODE:20-lts"
```

### Step 2: Configure Web App Settings

```bash
# Set Node.js and build configuration
az webapp config appsettings set \
  --name my-gallery-app \
  --resource-group gallery-rg \
  --settings \
    SCM_DO_BUILD_DURING_DEPLOYMENT=true \
    ENABLE_ORYX_BUILD=true \
    PRE_BUILD_SCRIPT_PATH=deploy.sh \
    WEBSITE_NODE_DEFAULT_VERSION="~20" \
    WEBSITE_NPM_DEFAULT_VERSION="10.2.4" \
    NODE_ENV=production \
    PORT=8080 \
    WEBSITES_PORT=8080

# Set startup command
az webapp config set \
  --name my-gallery-app \
  --resource-group gallery-rg \
  --startup-file "cd apps/ssr && npm start"
```

### Step 3: Set Environment Variables

```bash
# Option 1: From .env.production file (recommended)
# The deployment script will read .env.production automatically

# Option 2: Manual setup
az webapp config appsettings set \
  --name my-gallery-app \
  --resource-group gallery-rg \
  --settings \
    STORAGE_PROVIDER=s3 \
    STORAGE_BUCKET_NAME=my-photos \
    STORAGE_ACCESS_KEY_ID=your-access-key \
    STORAGE_SECRET_ACCESS_KEY=your-secret-key
```

### Step 4: Deploy Code

```bash
# Setup local Git deployment
az webapp deployment source config-local-git \
  --name my-gallery-app \
  --resource-group gallery-rg

# Get deployment credentials
az webapp deployment list-publishing-credentials \
  --name my-gallery-app \
  --resource-group gallery-rg

# Add Azure remote to your git repo
git remote add azure https://my-gallery-app.scm.azurewebsites.net/my-gallery-app.git

# Deploy
git add .
git commit -m "Initial deployment to Azure"
git push azure main
# Enter deployment credentials when prompted
```

## 🔧 How It Works

### Build Process (deploy.sh)
1. **Install Dependencies**: `pnpm install` (with frozen lockfile)
2. **Build Web App**: `pnpm --filter web build` (creates dist/)
3. **Convert HTML**: Transforms dist/index.html to apps/ssr/src/index.html.ts
4. **Build SSR**: `pnpm --filter @afilmory/ssr build` (creates .next/)
5. **Production Dependencies**: Installs only production dependencies
6. **Cleanup**: Removes unnecessary files to save space

### Runtime Process
1. **Azure starts**: `cd apps/ssr && npm start`
2. **Next.js serves**: Pre-built SPA + dynamic SEO/OG images
3. **Static assets**: Served from .next/static/
4. **Photos**: Loaded from configured storage (S3/COS/GitHub)

## 🎛️ Configuration Files

### .deployment
```ini
[config]
project = apps/ssr
```
Points Azure to the SSR app folder for deployment.

### deploy.sh
- Custom build script for pnpm monorepo
- Handles web → SSR conversion
- Optimizes for Azure App Service

### package-azure.json
- Azure-compatible package.json
- Correct Node.js version specification
- Production start script

## 📊 Monitoring & Management

### View Logs
```bash
# Live log streaming
az webapp log tail --name my-gallery-app --resource-group gallery-rg

# Download logs
az webapp log download --name my-gallery-app --resource-group gallery-rg
```

### SSH Access
```bash
# SSH into the running app
az webapp ssh --name my-gallery-app --resource-group gallery-rg

# Inside SSH:
cd /home/site/wwwroot/apps/ssr
ls -la
npm run env:check  # If you have this script
```

### App Management
```bash
# Restart app
az webapp restart --name my-gallery-app --resource-group gallery-rg

# Scale app
az appservice plan update --name gallery-plan --resource-group gallery-rg --sku S1

# Update environment variables
az webapp config appsettings set \
  --name my-gallery-app \
  --resource-group gallery-rg \
  --settings NEW_VAR=new_value
```

## 🌐 Accessing Your App

- **Main App**: https://my-gallery-app.azurewebsites.net
- **Health Check**: https://my-gallery-app.azurewebsites.net/api/health
- **Environment Info**: https://my-gallery-app.azurewebsites.net/api/env (if you add the debug endpoint)

## 🔍 Troubleshooting

### Common Issues

1. **Build Fails**: Check if `deploy.sh` is executable and all dependencies are available
2. **App Won't Start**: Verify startup command and check logs
3. **Photos Don't Load**: Check storage provider credentials and bucket permissions
4. **502 Bad Gateway**: Usually startup timeout - check build logs and increase timeout

### Debug Steps
```bash
# Check build logs
az webapp log show --name my-gallery-app --resource-group gallery-rg

# Check if files were deployed correctly
az webapp ssh --name my-gallery-app --resource-group gallery-rg
# Then: ls -la /home/site/wwwroot/

# Test environment variables
az webapp config appsettings list --name my-gallery-app --resource-group gallery-rg --output table

# Manual restart after changes
az webapp restart --name my-gallery-app --resource-group gallery-rg
```

## 💰 Cost Optimization

- **B1 Plan**: ~$13/month for basic usage
- **Auto-scale**: Configure based on traffic
- **Storage**: Use efficient storage provider (S3/COS)
- **CDN**: Consider Azure CDN for global distribution

## 🔄 CI/CD Integration

### GitHub Actions (Optional)
```yaml
# .github/workflows/azure-deploy.yml
name: Deploy to Azure App Service

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '20'
        
    - name: Deploy to Azure
      uses: azure/webapps-deploy@v2
      with:
        app-name: 'my-gallery-app'
        publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
```

## 📋 Summary

✅ **Pros of Direct Deployment**:
- Simpler setup (no Docker knowledge required)
- Faster cold starts
- Built-in Azure monitoring
- Automatic SSL certificates
- Easy scaling

❌ **Cons vs Container**:
- Less control over runtime environment
- Azure-specific deployment process
- Harder to replicate locally

This direct deployment approach is perfect for most use cases and provides excellent performance with minimal complexity!