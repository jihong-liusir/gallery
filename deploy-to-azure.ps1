# Azure Container Deployment Script (PowerShell)
# Usage: .\deploy-to-azure.ps1 [-Environment production]

param(
    [string]$Environment = "production"
)

# Configuration
$ResourceGroup = "rg-gallery"
$AppName = "gallery-tu"
$ACRName = "galleryacr"
$ImageName = "gallery"
$Location = "East US"

Write-Host "🚀 Starting Azure deployment for environment: $Environment" -ForegroundColor Green

try {
    # Step 1: Check Azure login
    Write-Host "📝 Checking Azure login..." -ForegroundColor Yellow
    try {
        az account show | Out-Null
    }
    catch {
        Write-Host "Please login to Azure CLI first:" -ForegroundColor Red
        az login
    }

    # Step 2: Create resource group
    Write-Host "📦 Creating/checking resource group..." -ForegroundColor Yellow
    az group create --name $ResourceGroup --location $Location --output table

    # Step 3: Create Azure Container Registry
    Write-Host "🐳 Creating/checking Azure Container Registry..." -ForegroundColor Yellow
    $acrExists = az acr show --name $ACRName --resource-group $ResourceGroup 2>$null
    if (-not $acrExists) {
        az acr create `
            --name $ACRName `
            --resource-group $ResourceGroup `
            --sku Basic `
            --admin-enabled true `
            --location $Location
    }

    # Step 4: Login to ACR
    Write-Host "🔐 Logging into Azure Container Registry..." -ForegroundColor Yellow
    az acr login --name $ACRName

    # Step 5: Build and push Docker image
    Write-Host "🏗️ Building Docker image..." -ForegroundColor Yellow
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $ImageTag = "${ACRName}.azurecr.io/${ImageName}:${timestamp}"
    $ImageLatest = "${ACRName}.azurecr.io/${ImageName}:latest"

    # Load environment variables from file if it exists
    $envFile = ".env.$Environment"
    if (Test-Path $envFile) {
        Get-Content $envFile | ForEach-Object {
            if ($_ -match '^([^#][^=]+)=(.*)$') {
                [Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
            }
        }
    }

    # Build with build arguments
    $buildArgs = @()
    if ($env:S3_ACCESS_KEY_ID) { $buildArgs += "--build-arg", "S3_ACCESS_KEY_ID=$env:S3_ACCESS_KEY_ID" }
    if ($env:S3_SECRET_ACCESS_KEY) { $buildArgs += "--build-arg", "S3_SECRET_ACCESS_KEY=$env:S3_SECRET_ACCESS_KEY" }
    if ($env:S3_ENDPOINT) { $buildArgs += "--build-arg", "S3_ENDPOINT=$env:S3_ENDPOINT" }
    if ($env:S3_BUCKET) { $buildArgs += "--build-arg", "S3_BUCKET=$env:S3_BUCKET" }
    if ($env:S3_REGION) { $buildArgs += "--build-arg", "S3_REGION=$env:S3_REGION" }
    if ($env:DATABASE_URL) { $buildArgs += "--build-arg", "DATABASE_URL=$env:DATABASE_URL" }
    if ($env:NEXT_PUBLIC_APP_URL) { $buildArgs += "--build-arg", "NEXT_PUBLIC_APP_URL=$env:NEXT_PUBLIC_APP_URL" }

    docker build $buildArgs -f Dockerfile.azure -t $ImageTag -t $ImageLatest .

    Write-Host "📤 Pushing image to registry..." -ForegroundColor Yellow
    docker push $ImageTag
    docker push $ImageLatest

    # Step 6: Create App Service Plan
    Write-Host "📋 Creating/checking App Service Plan..." -ForegroundColor Yellow
    $PlanName = "${AppName}-plan"
    $planExists = az appservice plan show --name $PlanName --resource-group $ResourceGroup 2>$null
    if (-not $planExists) {
        az appservice plan create `
            --name $PlanName `
            --resource-group $ResourceGroup `
            --is-linux `
            --sku B1 `
            --location $Location
    }

    # Step 7: Create/Update Web App
    Write-Host "🌐 Creating/updating Web App..." -ForegroundColor Yellow
    $appExists = az webapp show --name $AppName --resource-group $ResourceGroup 2>$null
    if (-not $appExists) {
        az webapp create `
            --name $AppName `
            --resource-group $ResourceGroup `
            --plan $PlanName `
            --deployment-container-image-name $ImageLatest
    }
    else {
        az webapp config container set `
            --name $AppName `
            --resource-group $ResourceGroup `
            --docker-custom-image-name $ImageLatest
    }

    # Step 8: Configure container settings
    Write-Host "⚙️ Configuring container settings..." -ForegroundColor Yellow
    $acrUsername = az acr credential show --name $ACRName --query username --output tsv
    $acrPassword = az acr credential show --name $ACRName --query passwords[0].value --output tsv

    az webapp config appsettings set `
        --name $AppName `
        --resource-group $ResourceGroup `
        --settings `
        WEBSITES_ENABLE_APP_SERVICE_STORAGE=false `
        WEBSITES_PORT=3000 `
        "DOCKER_REGISTRY_SERVER_URL=https://${ACRName}.azurecr.io" `
        "DOCKER_REGISTRY_SERVER_USERNAME=$acrUsername" `
        "DOCKER_REGISTRY_SERVER_PASSWORD=$acrPassword"

    # Step 9: Set environment variables from file
    Write-Host "🔧 Setting environment variables..." -ForegroundColor Yellow
    if (Test-Path $envFile) {
        $settings = @()
        Get-Content $envFile | ForEach-Object {
            if ($_ -match '^([^#][^=]+)=(.*)$') {
                $key = $matches[1]
                $value = $matches[2] -replace '^"?(.*?)"?$', '$1'  # Remove quotes
                $settings += "$key=$value"
            }
        }
        
        if ($settings.Count -gt 0) {
            az webapp config appsettings set `
                --name $AppName `
                --resource-group $ResourceGroup `
                --settings $settings `
                --output none
        }
    }

    # Step 10: Enable continuous deployment
    Write-Host "🔄 Enabling container continuous deployment..." -ForegroundColor Yellow
    az webapp deployment container config `
        --name $AppName `
        --resource-group $ResourceGroup `
        --enable-cd true

    # Step 11: Restart the web app
    Write-Host "🔄 Restarting web app..." -ForegroundColor Yellow
    az webapp restart --name $AppName --resource-group $ResourceGroup

    # Step 12: Show results
    $AppURL = "https://${AppName}.azurewebsites.net"
    Write-Host "✅ Deployment completed!" -ForegroundColor Green
    Write-Host "🌐 App URL: $AppURL" -ForegroundColor Cyan
    Write-Host "📊 Health Check: $AppURL/api/health" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📝 To check logs:" -ForegroundColor Yellow
    Write-Host "   az webapp log tail --name $AppName --resource-group $ResourceGroup"
    Write-Host ""
    Write-Host "🔧 To update environment variables:" -ForegroundColor Yellow
    Write-Host "   az webapp config appsettings set --name $AppName --resource-group $ResourceGroup --settings KEY=VALUE"

}
catch {
    Write-Host "❌ Deployment failed: $_" -ForegroundColor Red
    exit 1
}