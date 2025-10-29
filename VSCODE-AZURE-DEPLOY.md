# VS Code Azure Extension Deployment Guide

## 🎯 Overview

The **Azure App Service extension** for VS Code provides a visual, user-friendly way to deploy your photo gallery application directly from VS Code without using command-line tools.

## 📦 Required Extensions

You already have these installed:
```vscode-extensions
ms-azuretools.vscode-azureappservice,ms-azuretools.vscode-azureresourcegroups,ms-azuretools.vscode-azurefunctions
```

If you need to install them manually:
- **Azure App Service** (`ms-azuretools.vscode-azureappservice`)
- **Azure Resources** (`ms-azuretools.vscode-azureresourcegroups`)

## 🚀 Step-by-Step Visual Deployment

### Step 1: Sign in to Azure
1. **Open Command Palette**: `Ctrl+Shift+P` (Windows) or `Cmd+Shift+P` (Mac)
2. **Type**: `Azure: Sign In`
3. **Follow browser authentication flow**
4. **Verify**: You should see your subscriptions in the Azure sidebar

### Step 2: Prepare Your Project
1. **Ensure all deployment files are ready**:
   ```
   ✅ .deployment
   ✅ deploy.sh  
   ✅ package-azure.json
   ✅ .env.production (with your settings)
   ```

2. **Build your project locally** (recommended):
   ```bash
   pnpm install
   pnpm --filter web build
   pnpm --filter @afilmory/ssr build
   ```

### Step 3: Open Azure Extension Panel
1. **Click Azure icon** in VS Code sidebar (🔷)
2. **Expand "App Service" section**
3. **Select your subscription** if you have multiple

### Step 4: Create App Service (Visual Method)

#### Option A: Create New App Service
1. **Right-click** on your subscription under "App Service"
2. **Select**: `Create New Web App...`
3. **Follow the prompts**:
   - **App Name**: `gallery-tu` (or your preferred name)
   - **Resource Group**: `Create new` → `rg-gallery`
   - **Runtime Stack**: `Node 20 LTS`
   - **Pricing Tier**: `Basic B1` (or your preference)
   - **Location**: `East US` (or your region)

#### Option B: Use Existing (if you already have one)
1. **Expand your subscription**
2. **Find your existing App Service**
3. **Right-click** → `Deploy to Web App...`

### Step 5: Configure Environment Variables (Visual)
1. **Find your App Service** in the Azure sidebar
2. **Right-click** → `Open in Portal`
3. **In Azure Portal**:
   - Go to **Configuration** → **Application Settings**
   - **Add** your environment variables from `.env.production`:
     ```
     NODE_ENV=production
     COS_REGION=ap-chengdu
     COS_BUCKET=media-1309653188
     COS_SECRET_ID=your-cos-secret-id
     COS_SECRET_KEY=your-cos-secret-key
     NEXT_PUBLIC_APP_URL=gallery-tu.azurewebsites.net
     PORT=8080
     WEBSITES_PORT=8080
     ```
   - **Click Save**

### Step 6: Deploy Your Application
1. **Right-click** on your App Service in VS Code
2. **Select**: `Deploy to Web App...`
3. **Choose deployment source**:
   - **Select**: `Browse...` → Choose your project root folder
   - **OR**: Use current workspace if you're in the gallery folder
4. **Confirm deployment**: Click `Deploy`
5. **Monitor progress** in VS Code output panel

### Step 7: Monitor Deployment
1. **Watch Output Panel**: `View` → `Output` → Select `Azure App Service`
2. **Check deployment status**: You'll see build progress and logs
3. **Wait for completion**: Usually takes 5-10 minutes

## 🔧 Advanced VS Code Azure Features

### Stream Logs in Real-Time
1. **Right-click** your App Service
2. **Select**: `Start Streaming Logs`
3. **View logs** in VS Code output panel
4. **Stop streaming**: Right-click → `Stop Streaming Logs`

### Browse Files on Server
1. **Right-click** your App Service  
2. **Select**: `Browse Files`
3. **Navigate** through your deployed files
4. **Edit files** directly on the server (for quick fixes)

### Environment Variables Management
1. **Right-click** your App Service
2. **Select**: `View Properties`
3. **See current settings** in JSON format
4. **For editing**: Use "Open in Portal" for visual interface

### Restart Application
1. **Right-click** your App Service
2. **Select**: `Restart`
3. **Confirm** the restart action

### Download Logs
1. **Right-click** your App Service
2. **Select**: `Download Logs`
3. **Choose location** to save log files
4. **Analyze offline** for detailed troubleshooting

## 🎯 Deployment Settings Optimization

### Configure Deployment Settings (Portal)
After deployment, optimize these settings in Azure Portal:

1. **Configuration** → **General Settings**:
   ```
   Stack: Node
   Major version: 20
   Minor version: 20-lts
   Startup Command: cd apps/ssr && npm start
   ```

2. **Configuration** → **Application Settings**:
   ```
   SCM_DO_BUILD_DURING_DEPLOYMENT: true
   ENABLE_ORYX_BUILD: true
   PRE_BUILD_SCRIPT_PATH: deploy.sh
   WEBSITE_NODE_DEFAULT_VERSION: ~20
   ```

## 🔍 Troubleshooting with VS Code

### Common Issues & VS Code Solutions

#### 1. Deployment Fails
**VS Code Action**:
1. **Right-click** App Service → `View Properties`
2. **Check** deployment status and error messages
3. **Right-click** → `Start Streaming Logs` to see real-time errors

#### 2. App Won't Start
**VS Code Action**:
1. **Stream logs** to see startup errors
2. **Browse Files** to verify deployment structure
3. **Check** if `apps/ssr` folder exists with proper files

#### 3. Environment Variables Issues
**VS Code Action**:
1. **Right-click** → `Open in Portal`
2. **Verify** all environment variables are set correctly
3. **Test** with `/api/health` endpoint after setting

### Quick Fixes via VS Code
1. **Edit files directly**: Browse Files → Edit → Save
2. **Restart quickly**: Right-click → Restart
3. **Check logs immediately**: Start Streaming Logs
4. **Redeploy easily**: Right-click → Deploy to Web App

## 🎉 Benefits of VS Code Azure Extension

### ✅ **Advantages**
- **Visual Interface**: No command-line knowledge required
- **Integrated Experience**: Everything within VS Code
- **Real-time Monitoring**: Stream logs and watch deployment
- **Easy Management**: Restart, browse files, edit settings
- **Quick Iteration**: Fast redeploy and testing cycle

### ⚠️ **Considerations**
- **Build Process**: May not use custom `deploy.sh` script
- **Environment Setup**: Requires manual configuration in portal
- **Advanced Features**: Some CLI-only features not available

## 📋 Complete Deployment Checklist

### Pre-Deployment ✓
- [ ] Azure extensions installed in VS Code
- [ ] Signed in to Azure account
- [ ] Project built locally (`pnpm build`)
- [ ] `.env.production` configured with your values
- [ ] Deployment files ready (`.deployment`, `deploy.sh`, `package-azure.json`)

### During Deployment ✓
- [ ] App Service created with correct settings
- [ ] Environment variables configured in portal
- [ ] Deployment initiated from VS Code
- [ ] Logs monitored for errors
- [ ] Build completion verified

### Post-Deployment ✓
- [ ] App loads at `https://your-app.azurewebsites.net`
- [ ] Health check works: `/api/health`
- [ ] Photos display correctly
- [ ] No console errors in browser
- [ ] Performance is acceptable

### Ongoing Management ✓
- [ ] Log streaming configured for monitoring
- [ ] Restart procedure tested
- [ ] Environment variable updates workflow established
- [ ] Redeploy process verified

## 🚀 Quick Start Commands

```bash
# If you prefer hybrid approach (VS Code + CLI)
# Build locally first
pnpm build

# Then use VS Code for deployment
# Right-click App Service → Deploy to Web App
```

## 🔗 Useful VS Code Commands

- **Azure: Sign In**: `Ctrl+Shift+P` → `Azure: Sign In`
- **Azure: Sign Out**: `Ctrl+Shift+P` → `Azure: Sign Out`  
- **Azure: Select Subscriptions**: `Ctrl+Shift+P` → `Azure: Select Subscriptions`
- **Azure: Create Resource**: `Ctrl+Shift+P` → `Azure: Create Resource`

The VS Code Azure extension provides an excellent balance of simplicity and power for deploying your photo gallery application! 🎯