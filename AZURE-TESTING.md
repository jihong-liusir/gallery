# Azure App Service - Testing & Validation Guide

## 🚀 Pre-Deployment Testing

### 1. Local Build Test
```powershell
# Test the deployment build process locally
pnpm install
pnpm --filter web build
pnpm --filter @afilmory/ssr build

# Verify build artifacts
ls apps/ssr/.next/
ls apps/web/dist/

# Test SSR locally
cd apps/ssr
npm start
# Visit http://localhost:3000
```

### 2. Environment Variables Test
```powershell
# Create test environment file
cp .env.example .env.production

# Test environment loading (if you have env:check script)
cd apps/ssr
npm run env:check

# Manual verification
node -e "console.log({
  NODE_ENV: process.env.NODE_ENV,
  STORAGE_PROVIDER: process.env.STORAGE_PROVIDER,
  PORT: process.env.PORT
})"
```

## 🔧 Deployment Process

### 1. Run Deployment Script
```powershell
# Full automated deployment
.\deploy-direct-azure.ps1 -ResourceGroup "gallery-rg" -AppName "my-gallery-app"

# Custom configuration
.\deploy-direct-azure.ps1 `
  -ResourceGroup "my-custom-rg" `
  -AppName "my-custom-app" `
  -Location "West Europe" `
  -Environment "production"
```

### 2. Deploy Code
```bash
# Add deployment files to git
git add .deployment deploy.sh package-azure.json
git add .env.production  # Only if you want to commit it (not recommended)
git commit -m "Add Azure deployment configuration"

# Deploy to Azure
git push azure main

# Monitor deployment
az webapp log tail --name my-gallery-app --resource-group gallery-rg
```

## 📊 Post-Deployment Validation

### 1. Health Check Validation
```bash
# Basic health check
curl https://my-gallery-app.azurewebsites.net/api/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 123,
  "environment": "production",
  "platform": {
    "node": "v20.x.x",
    "platform": "linux",
    "hostname": "...",
    "port": "8080"
  },
  "azure": {
    "websiteName": "my-gallery-app",
    "resourceGroup": "gallery-rg",
    "region": "East US"
  },
  "storage": {
    "provider": "s3",
    "bucket": "my-photos",
    "hasCredentials": true
  },
  "database": {
    "configured": true,
    "provider": "postgresql"
  }
}
```

### 2. App Functionality Tests
```bash
# Test main page
curl -I https://my-gallery-app.azurewebsites.net/
# Should return 200 OK

# Test API routes (if applicable)
curl https://my-gallery-app.azurewebsites.net/api/photos
curl https://my-gallery-app.azurewebsites.net/api/manifest

# Test static assets
curl -I https://my-gallery-app.azurewebsites.net/_next/static/css/...
# Should return 200 OK
```

### 3. Performance Validation
```powershell
# Using PowerShell
$response = Invoke-WebRequest -Uri "https://my-gallery-app.azurewebsites.net/api/health" -Method GET
Write-Host "Response Time: $($response.Headers.'Response-Time') ms"
Write-Host "Status: $($response.StatusCode)"

# Using curl with timing
curl -w "@curl-format.txt" -o /dev/null -s "https://my-gallery-app.azurewebsites.net/"

# Create curl-format.txt:
#     time_namelookup:  %{time_namelookup}s\n
#        time_connect:  %{time_connect}s\n
#     time_appconnect:  %{time_appconnect}s\n
#    time_pretransfer:  %{time_pretransfer}s\n
#       time_redirect:  %{time_redirect}s\n
#  time_starttransfer:  %{time_starttransfer}s\n
#                     ----------\n
#          time_total:  %{time_total}s\n
```

## 🔍 Troubleshooting Guide

### Common Issues & Solutions

#### 1. Build Failures
**Symptoms**: Deployment fails during build phase
```bash
# Check build logs
az webapp log show --name my-gallery-app --resource-group gallery-rg

# SSH to investigate
az webapp ssh --name my-gallery-app --resource-group gallery-rg
cd /tmp/8d*  # Build directory
ls -la
cat oryx-build.log
```

**Solutions**:
- Verify `deploy.sh` has executable permissions
- Check if pnpm is available: `which pnpm`
- Verify Node.js version: `node --version`
- Check memory usage: `free -h`

#### 2. Startup Failures
**Symptoms**: App shows "503 Service Unavailable"
```bash
# Check application logs
az webapp log tail --name my-gallery-app --resource-group gallery-rg --provider application

# Check startup command
az webapp config show --name my-gallery-app --resource-group gallery-rg --query "siteConfig.appCommandLine"
```

**Solutions**:
- Verify startup command: `"cd apps/ssr && npm start"`
- Check if package.json exists in apps/ssr
- Verify port configuration (PORT=8080, WEBSITES_PORT=8080)
- Check for missing dependencies

#### 3. Environment Variable Issues
**Symptoms**: Features not working, configuration errors
```bash
# Check environment variables
az webapp config appsettings list --name my-gallery-app --resource-group gallery-rg --output table

# Test inside app
curl https://my-gallery-app.azurewebsites.net/api/health
# Check "storage" and "database" sections
```

**Solutions**:
- Verify all required variables are set
- Check for typos in variable names
- Restart app after setting variables: `az webapp restart --name my-gallery-app --resource-group gallery-rg`

#### 4. Storage/Photo Issues
**Symptoms**: Photos not loading, storage errors
```bash
# Check storage configuration in health endpoint
curl https://my-gallery-app.azurewebsites.net/api/health | jq '.storage'

# Test storage connectivity (SSH into app)
az webapp ssh --name my-gallery-app --resource-group gallery-rg
cd apps/ssr
node -e "
const config = require('./next.config.mjs');
console.log('Storage config:', process.env.STORAGE_PROVIDER);
"
```

**Solutions**:
- Verify storage credentials
- Check bucket/container permissions
- Test network connectivity to storage provider
- Verify SSL/TLS settings for storage provider

## 📈 Monitoring & Alerts

### 1. Setup Application Insights
```bash
# Create Application Insights
az monitor app-insights component create \
  --app my-gallery-insights \
  --location "East US" \
  --resource-group gallery-rg \
  --application-type web

# Connect to Web App
az webapp config appsettings set \
  --name my-gallery-app \
  --resource-group gallery-rg \
  --settings APPLICATIONINSIGHTS_CONNECTION_STRING="InstrumentationKey=..."
```

### 2. Health Check Monitoring
```bash
# Create health check alert
az monitor action-group create \
  --name gallery-alerts \
  --resource-group gallery-rg \
  --short-name gallery

# Add email notification
az monitor action-group update \
  --name gallery-alerts \
  --resource-group gallery-rg \
  --add-action email my-email@domain.com MyEmail
```

### 3. Log Analysis Queries
```kusto
// Application Insights queries
requests
| where url contains "/api/health"
| summarize avg(duration), count() by bin(timestamp, 5m)
| render timechart

exceptions
| where timestamp > ago(1h)
| summarize count() by type, bin(timestamp, 5m)
| render columnchart
```

## ✅ Validation Checklist

### Pre-Deployment ✓
- [ ] Local build succeeds (`pnpm build`)
- [ ] Environment variables configured
- [ ] Storage provider credentials tested
- [ ] Git repository ready for deployment

### During Deployment ✓
- [ ] Azure resources created successfully
- [ ] App settings configured correctly
- [ ] Git deployment succeeds without errors
- [ ] Build logs show no errors

### Post-Deployment ✓
- [ ] Health check returns 200 OK
- [ ] Main app loads correctly
- [ ] Photos display properly
- [ ] API endpoints respond
- [ ] Static assets load fast
- [ ] No console errors in browser
- [ ] Mobile responsiveness works
- [ ] Performance is acceptable (<3s load time)

### Production Ready ✓
- [ ] SSL certificate is active (HTTPS)
- [ ] Custom domain configured (if applicable)
- [ ] Monitoring/alerts setup
- [ ] Backup strategy implemented
- [ ] CI/CD pipeline configured (optional)

## 🚨 Emergency Procedures

### Quick Rollback
```bash
# Stop the app
az webapp stop --name my-gallery-app --resource-group gallery-rg

# Rollback to previous deployment (if available)
az webapp deployment slot swap --name my-gallery-app --resource-group gallery-rg --slot production --target-slot staging

# Or redeploy from previous commit
git reset --hard HEAD~1
git push azure main --force

# Restart app
az webapp start --name my-gallery-app --resource-group gallery-rg
```

### Emergency Debug Access
```bash
# Enable detailed error pages
az webapp config appsettings set \
  --name my-gallery-app \
  --resource-group gallery-rg \
  --settings WEBSITE_DETAILED_ERROR_MESSAGES_ENABLED=true

# SSH access
az webapp ssh --name my-gallery-app --resource-group gallery-rg

# Download logs for offline analysis
az webapp log download --name my-gallery-app --resource-group gallery-rg --log-file app-logs.zip
```

This comprehensive testing guide ensures your Azure deployment is solid and production-ready! 🎉