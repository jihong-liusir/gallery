# Azure App Service Configuration
# This file contains Azure-specific configurations and notes

## Resource Requirements
- **App Service Plan**: B1 (Basic) or higher recommended
- **Memory**: Minimum 1.75 GB RAM
- **CPU**: 1 vCPU minimum
- **Storage**: Standard SSD

## Environment Variables Required
```
# Database
DATABASE_URL=postgresql://username:password@server:5432/database
PG_CONNECTION_STRING=postgresql://username:password@server:5432/database

# Storage (Tencent Cloud COS)
S3_ENDPOINT=https://cos.ap-beijing.myqcloud.com
S3_BUCKET=your-bucket-name
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key
S3_REGION=ap-beijing
S3_PREFIX=photos/

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-app-name.azurewebsites.net
NODE_ENV=production
PORT=3000
WEBSITES_PORT=3000

# Optional
GIT_TOKEN=your-github-token
```

## Azure Services Needed

### 1. Azure Database for PostgreSQL
```bash
# Create PostgreSQL server
az postgres flexible-server create \
  --name gallery-db-server \
  --resource-group gallery-rg \
  --location "East US" \
  --admin-user dbadmin \
  --admin-password "YourSecurePassword123!" \
  --sku-name Standard_B1ms \
  --storage-size 32 \
  --version 14
```

### 2. Azure Container Registry (ACR)
```bash
# Create ACR (handled by deployment script)
az acr create \
  --name galleryacr \
  --resource-group gallery-rg \
  --sku Basic \
  --admin-enabled true
```

### 3. Azure App Service
```bash
# Create App Service Plan (handled by deployment script)
az appservice plan create \
  --name gallery-app-plan \
  --resource-group gallery-rg \
  --is-linux \
  --sku B1
```

## Monitoring and Logging

### Application Insights (Optional)
```bash
# Create Application Insights
az monitor app-insights component create \
  --app gallery-insights \
  --location "East US" \
  --resource-group gallery-rg
```

### Log Streaming
```bash
# View live logs
az webapp log tail --name gallery-app --resource-group gallery-rg

# Download logs
az webapp log download --name gallery-app --resource-group gallery-rg
```

## Scaling Configuration

### Manual Scaling
```bash
# Scale up (increase instance size)
az appservice plan update \
  --name gallery-app-plan \
  --resource-group gallery-rg \
  --sku S1

# Scale out (increase instance count)
az webapp scale \
  --name gallery-app \
  --resource-group gallery-rg \
  --instance-count 2
```

### Auto-scaling Rules
```bash
# Enable autoscale
az monitor autoscale create \
  --resource-group gallery-rg \
  --resource /subscriptions/SUBSCRIPTION_ID/resourceGroups/gallery-rg/providers/Microsoft.Web/serverfarms/gallery-app-plan \
  --name gallery-autoscale \
  --min-count 1 \
  --max-count 3 \
  --count 1
```

## Security Considerations

### 1. Container Security
- Use minimal base images (Alpine Linux)
- Run as non-root user
- Enable container scanning in ACR

### 2. App Service Security
- Enable HTTPS only
- Configure custom domains with SSL
- Set up authentication if needed

### 3. Database Security
- Enable SSL connections
- Configure firewall rules
- Use Azure AD authentication

## Performance Optimization

### 1. CDN Setup
```bash
# Create CDN profile
az cdn profile create \
  --name gallery-cdn \
  --resource-group gallery-rg \
  --sku Standard_Microsoft

# Create CDN endpoint
az cdn endpoint create \
  --name gallery-cdn-endpoint \
  --profile-name gallery-cdn \
  --resource-group gallery-rg \
  --origin gallery-app.azurewebsites.net
```

### 2. Caching Configuration
- Configure browser caching headers
- Use Azure Redis Cache for session storage
- Implement application-level caching

## Disaster Recovery

### 1. Backup Strategy
- Database automated backups
- Container image versioning
- Configuration backup

### 2. Multi-region Deployment
- Deploy to multiple regions
- Use Azure Traffic Manager
- Implement health checks

## Cost Optimization

### 1. Resource Sizing
- Start with B1 plan and scale as needed
- Monitor resource utilization
- Use reserved instances for predictable workloads

### 2. Storage Optimization
- Use appropriate storage tiers
- Implement lifecycle policies
- Monitor data transfer costs