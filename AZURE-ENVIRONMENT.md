# Azure Direct Deployment - Environment Variables Guide

## 1. Create Environment File

Create `.env.production` in your project root:

```bash
# App Configuration
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
HOSTNAME=0.0.0.0
PORT=8080

# Photo Storage Configuration (Choose one)
# For S3-compatible storage:
STORAGE_PROVIDER=s3
STORAGE_ENDPOINT=your-s3-endpoint.com
STORAGE_ACCESS_KEY_ID=your-access-key
STORAGE_SECRET_ACCESS_KEY=your-secret-key
STORAGE_BUCKET_NAME=your-bucket-name
STORAGE_REGION=us-east-1
STORAGE_SSL_ENABLED=true

# For Tencent Cloud COS:
STORAGE_PROVIDER=cos
COS_SECRET_ID=your-secret-id
COS_SECRET_KEY=your-secret-key
COS_BUCKET=your-bucket-name
COS_REGION=ap-beijing
COS_SSL_ENABLED=true

# Database (if using PostgreSQL)
DATABASE_URL=postgresql://user:password@host:5432/dbname
POSTGRES_URL=postgresql://user:password@host:5432/dbname

# Optional: External Services
ANALYTICS_ID=your-analytics-id
SENTRY_DSN=your-sentry-dsn

# Git Configuration (for manifest updates)
GITHUB_TOKEN=your-github-token
GITHUB_REPO=username/repo-name
GITHUB_BRANCH=main
```

## 2. Azure-specific Settings

These are automatically set by the deployment script:

```bash
# Azure App Service Settings (Automatic)
SCM_DO_BUILD_DURING_DEPLOYMENT=true
ENABLE_ORYX_BUILD=true
PRE_BUILD_SCRIPT_PATH=deploy.sh
WEBSITE_NODE_DEFAULT_VERSION=~20
WEBSITE_NPM_DEFAULT_VERSION=10.2.4
WEBSITES_PORT=8080
```

## 3. Manual Environment Variable Setup

If you need to set variables manually:

### Using Azure CLI:
```bash
# Set single variable
az webapp config appsettings set \
  --name gallery-app \
  --resource-group gallery-rg \
  --settings NODE_ENV=production

# Set multiple variables
az webapp config appsettings set \
  --name gallery-app \
  --resource-group gallery-rg \
  --settings \
    NODE_ENV=production \
    STORAGE_PROVIDER=s3 \
    STORAGE_BUCKET_NAME=my-photos
```

### Using Azure Portal:
1. Go to Azure Portal → App Services → Your App
2. Navigate to **Configuration** → **Application Settings**
3. Click **+ New application setting**
4. Add Name/Value pairs
5. Click **Save**

## 4. Security Best Practices

### For Production:
- Never commit `.env.production` to git
- Use Azure Key Vault for sensitive data
- Enable HTTPS only in Azure App Service
- Use managed identities when possible

### Key Vault Integration:
```bash
# Create Key Vault
az keyvault create \
  --name gallery-keyvault \
  --resource-group gallery-rg \
  --location "East US"

# Store secrets
az keyvault secret set \
  --vault-name gallery-keyvault \
  --name "storage-access-key" \
  --value "your-secret-key"

# Reference in App Service
az webapp config appsettings set \
  --name gallery-app \
  --resource-group gallery-rg \
  --settings STORAGE_ACCESS_KEY_ID="@Microsoft.KeyVault(VaultName=gallery-keyvault;SecretName=storage-access-key)"
```

## 5. Validation Commands

### Check current settings:
```bash
# View all app settings
az webapp config appsettings list \
  --name gallery-app \
  --resource-group gallery-rg \
  --output table

# View specific setting
az webapp config appsettings list \
  --name gallery-app \
  --resource-group gallery-rg \
  --query "[?name=='NODE_ENV'].value" \
  --output tsv
```

### Test environment variables in the app:
```bash
# SSH into the app
az webapp ssh --name gallery-app --resource-group gallery-rg

# Inside the SSH session:
echo $NODE_ENV
echo $STORAGE_PROVIDER
cd apps/ssr && npm run env:check  # If you have this script
```

## 6. Common Environment Variables for Gallery App

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NODE_ENV` | Yes | Environment mode | `production` |
| `STORAGE_PROVIDER` | Yes | Storage backend | `s3`, `cos`, `github` |
| `STORAGE_BUCKET_NAME` | Yes | Bucket/container name | `my-photos` |
| `DATABASE_URL` | No | PostgreSQL connection | `postgresql://...` |
| `GITHUB_TOKEN` | No | For manifest updates | `ghp_xxx` |
| `PORT` | No | Server port (Azure sets this) | `8080` |
| `HOSTNAME` | No | Server hostname | `0.0.0.0` |

## 7. Troubleshooting

### Check environment loading:
Add this to your Next.js app to debug:
```javascript
// apps/ssr/src/app/api/env/route.ts
export async function GET() {
  return Response.json({
    nodeEnv: process.env.NODE_ENV,
    storageProvider: process.env.STORAGE_PROVIDER,
    port: process.env.PORT,
    // Don't log secrets in production!
    hasSecrets: {
      storageKey: !!process.env.STORAGE_ACCESS_KEY_ID,
      databaseUrl: !!process.env.DATABASE_URL,
    }
  })
}
```

Visit: `https://your-app.azurewebsites.net/api/env`

### Common issues:
- **Variables not loading**: Check if `.env.production` is in project root
- **Build failing**: Verify all required variables are set
- **Storage errors**: Check bucket permissions and credentials
- **Database errors**: Verify connection string format and network access