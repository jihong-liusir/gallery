# Azure App Service Direct Deployment Script (No Container)
# Usage: .\deploy-direct-azure.ps1 [-ResourceGroup "gallery-rg"] [-AppName "gallery-app"]

param(
    [string]$ResourceGroup = "gallery-rg",
    [string]$AppName = "gallery-app", 
    [string]$Location = "East US",
    [string]$Environment = "production"
)

Write-Host "🚀 Starting Azure App Service direct deployment..." -ForegroundColor Green
Write-Host "📋 Resource Group: $ResourceGroup" -ForegroundColor Yellow
Write-Host "🌐 App Name: $AppName" -ForegroundColor Yellow
Write-Host "📍 Location: $Location" -ForegroundColor Yellow

try {
    # Step 1: Check Azure login
    Write-Host "📝 Checking Azure login..." -ForegroundColor Yellow
    try {
        $account = az account show --output json | ConvertFrom-Json
        Write-Host "✅ Logged in as: $($account.user.name)" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Not logged in to Azure. Please login first:" -ForegroundColor Red
        az login
    }

    # Step 2: Create resource group
    Write-Host "📦 Creating/checking resource group..." -ForegroundColor Yellow
    az group create --name $ResourceGroup --location $Location --output table

    # Step 3: Create App Service Plan (Linux, Node.js)
    Write-Host "📋 Creating/checking App Service Plan..." -ForegroundColor Yellow
    $PlanName = "${AppName}-plan"
    $planExists = az appservice plan show --name $PlanName --resource-group $ResourceGroup --output none 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Creating new App Service Plan..." -ForegroundColor Cyan
        az appservice plan create `
            --name $PlanName `
            --resource-group $ResourceGroup `
            --sku B1 `
            --is-linux `
            --location $Location
    }
    else {
        Write-Host "App Service Plan already exists" -ForegroundColor Green
    }

    # Step 4: Create Web App with Node.js runtime
    Write-Host "🌐 Creating/checking Web App..." -ForegroundColor Yellow
    $appExists = az webapp show --name $AppName --resource-group $ResourceGroup --output none 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Creating new Web App with Node.js 20..." -ForegroundColor Cyan
        az webapp create `
            --name $AppName `
            --resource-group $ResourceGroup `
            --plan $PlanName `
            --runtime "NODE:20-lts"
    }
    else {
        Write-Host "Web App already exists" -ForegroundColor Green
    }

    # Step 5: Configure Web App settings
    Write-Host "⚙️ Configuring Web App settings..." -ForegroundColor Yellow
    
    # Basic Node.js settings
    az webapp config appsettings set `
        --name $AppName `
        --resource-group $ResourceGroup `
        --settings `
        SCM_DO_BUILD_DURING_DEPLOYMENT=true `
        ENABLE_ORYX_BUILD=true `
        PRE_BUILD_SCRIPT_PATH=deploy.sh `
        POST_BUILD_SCRIPT_PATH="" `
        WEBSITE_NODE_DEFAULT_VERSION="~20" `
        WEBSITE_NPM_DEFAULT_VERSION="10.2.4" `
        NODE_ENV=production `
        PORT=8080 `
        WEBSITES_PORT=8080

    # Step 6: Set environment variables from file
    Write-Host "🔧 Setting environment variables..." -ForegroundColor Yellow
    $envFile = ".env.$Environment"
    if (Test-Path $envFile) {
        $settings = @()
        Get-Content $envFile | ForEach-Object {
            if ($_ -match '^([^#][^=]+)=(.*)$') {
                $key = $matches[1].Trim()
                $value = $matches[2].Trim() -replace '^"?(.*?)"?$', '$1'  # Remove quotes
                if ($key -and $value) {
                    $settings += "$key=$value"
                    Write-Host "   Setting: $key" -ForegroundColor Gray
                }
            }
        }
        
        if ($settings.Count -gt 0) {
            az webapp config appsettings set `
                --name $AppName `
                --resource-group $ResourceGroup `
                --settings $settings `
                --output none
            Write-Host "✅ Set $($settings.Count) environment variables" -ForegroundColor Green
        }
    }
    else {
        Write-Host "⚠️  Environment file $envFile not found. You'll need to set environment variables manually." -ForegroundColor Yellow
    }

    # Step 7: Configure startup command
    Write-Host "🚀 Setting startup command..." -ForegroundColor Yellow
    az webapp config set `
        --name $AppName `
        --resource-group $ResourceGroup `
        --startup-file "cd apps/ssr && npm start"

    # Step 8: Deploy from local Git (if .git exists)
    if (Test-Path ".git") {
        Write-Host "📤 Setting up local Git deployment..." -ForegroundColor Yellow
        
        # Enable local Git deployment
        $gitUrl = az webapp deployment source config-local-git `
            --name $AppName `
            --resource-group $ResourceGroup `
            --query url `
            --output tsv

        Write-Host "Git deployment URL: $gitUrl" -ForegroundColor Cyan
        
        # Get deployment credentials
        Write-Host "📋 Getting deployment credentials..." -ForegroundColor Yellow
        $creds = az webapp deployment list-publishing-credentials `
            --name $AppName `
            --resource-group $ResourceGroup `
            --query "{username:publishingUserName, password:publishingPassword}" `
            --output json | ConvertFrom-Json

        Write-Host "🔑 Deployment credentials:" -ForegroundColor Cyan
        Write-Host "   Username: $($creds.username)" -ForegroundColor Gray
        Write-Host "   Password: $($creds.password)" -ForegroundColor Gray

        # Add Azure remote if it doesn't exist
        $remotes = git remote -v
        if ($remotes -notmatch "azure") {
            Write-Host "Adding Azure remote..." -ForegroundColor Cyan
            git remote add azure $gitUrl
        }

        Write-Host "📤 To deploy, run:" -ForegroundColor Yellow
        Write-Host "   git add ." -ForegroundColor Gray
        Write-Host "   git commit -m 'Deploy to Azure'" -ForegroundColor Gray
        Write-Host "   git push azure main" -ForegroundColor Gray
        Write-Host "   (Use the credentials above when prompted)" -ForegroundColor Gray
    }

    # Step 9: Show deployment information
    $AppURL = "https://${AppName}.azurewebsites.net"
    Write-Host "✅ Azure App Service setup completed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 App URL: $AppURL" -ForegroundColor Cyan
    Write-Host "📊 Health Check: $AppURL/api/health" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📝 Useful commands:" -ForegroundColor Yellow
    Write-Host "   # View logs" -ForegroundColor Gray
    Write-Host "   az webapp log tail --name $AppName --resource-group $ResourceGroup" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   # SSH into the instance" -ForegroundColor Gray
    Write-Host "   az webapp ssh --name $AppName --resource-group $ResourceGroup" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   # Update environment variable" -ForegroundColor Gray
    Write-Host "   az webapp config appsettings set --name $AppName --resource-group $ResourceGroup --settings KEY=VALUE" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   # Restart app" -ForegroundColor Gray
    Write-Host "   az webapp restart --name $AppName --resource-group $ResourceGroup" -ForegroundColor Gray

}
catch {
    Write-Host "❌ Deployment failed: $_" -ForegroundColor Red
    Write-Host $_.ScriptStackTrace -ForegroundColor Red
    exit 1
}