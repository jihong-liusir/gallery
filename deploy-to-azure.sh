#!/bin/bash
# Azure Container Deployment Script
# Usage: ./deploy-to-azure.sh [environment]

set -e

# Configuration
RESOURCE_GROUP="gallery-rg"
APP_NAME="gallery-app"
ACR_NAME="galleryacr"
IMAGE_NAME="gallery"
LOCATION="East US"
ENVIRONMENT=${1:-production}

echo "🚀 Starting Azure deployment for environment: $ENVIRONMENT"

# Step 1: Login to Azure (if not already logged in)
echo "📝 Checking Azure login..."
if ! az account show &> /dev/null; then
    echo "Please login to Azure CLI first:"
    az login
fi

# Step 2: Create resource group if it doesn't exist
echo "📦 Creating/checking resource group..."
az group create --name $RESOURCE_GROUP --location "$LOCATION" --output table

# Step 3: Create Azure Container Registry if it doesn't exist
echo "🐳 Creating/checking Azure Container Registry..."
if ! az acr show --name $ACR_NAME --resource-group $RESOURCE_GROUP &> /dev/null; then
    az acr create \
        --name $ACR_NAME \
        --resource-group $RESOURCE_GROUP \
        --sku Basic \
        --admin-enabled true \
        --location "$LOCATION"
fi

# Step 4: Login to ACR
echo "🔐 Logging into Azure Container Registry..."
az acr login --name $ACR_NAME

# Step 5: Build and push Docker image
echo "🏗️  Building Docker image..."
IMAGE_TAG="${ACR_NAME}.azurecr.io/${IMAGE_NAME}:$(date +%Y%m%d-%H%M%S)"
IMAGE_LATEST="${ACR_NAME}.azurecr.io/${IMAGE_NAME}:latest"

# Build with build arguments
docker build \
    --build-arg S3_ACCESS_KEY_ID="$S3_ACCESS_KEY_ID" \
    --build-arg S3_SECRET_ACCESS_KEY="$S3_SECRET_ACCESS_KEY" \
    --build-arg S3_ENDPOINT="$S3_ENDPOINT" \
    --build-arg S3_BUCKET="$S3_BUCKET" \
    --build-arg S3_REGION="$S3_REGION" \
    --build-arg DATABASE_URL="$DATABASE_URL" \
    --build-arg NEXT_PUBLIC_APP_URL="$NEXT_PUBLIC_APP_URL" \
    -f Dockerfile.azure \
    -t $IMAGE_TAG \
    -t $IMAGE_LATEST \
    .

echo "📤 Pushing image to registry..."
docker push $IMAGE_TAG
docker push $IMAGE_LATEST

# Step 6: Create App Service Plan if it doesn't exist
echo "📋 Creating/checking App Service Plan..."
PLAN_NAME="${APP_NAME}-plan"
if ! az appservice plan show --name $PLAN_NAME --resource-group $RESOURCE_GROUP &> /dev/null; then
    az appservice plan create \
        --name $PLAN_NAME \
        --resource-group $RESOURCE_GROUP \
        --is-linux \
        --sku B1 \
        --location "$LOCATION"
fi

# Step 7: Create/Update Web App
echo "🌐 Creating/updating Web App..."
if ! az webapp show --name $APP_NAME --resource-group $RESOURCE_GROUP &> /dev/null; then
    # Create new web app
    az webapp create \
        --name $APP_NAME \
        --resource-group $RESOURCE_GROUP \
        --plan $PLAN_NAME \
        --deployment-container-image-name $IMAGE_LATEST
else
    # Update existing web app
    az webapp config container set \
        --name $APP_NAME \
        --resource-group $RESOURCE_GROUP \
        --docker-custom-image-name $IMAGE_LATEST
fi

# Step 8: Configure container settings
echo "⚙️  Configuring container settings..."
az webapp config appsettings set \
    --name $APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --settings \
        WEBSITES_ENABLE_APP_SERVICE_STORAGE=false \
        WEBSITES_PORT=3000 \
        DOCKER_REGISTRY_SERVER_URL="https://${ACR_NAME}.azurecr.io" \
        DOCKER_REGISTRY_SERVER_USERNAME=$(az acr credential show --name $ACR_NAME --query username --output tsv) \
        DOCKER_REGISTRY_SERVER_PASSWORD=$(az acr credential show --name $ACR_NAME --query passwords[0].value --output tsv)

# Step 9: Set environment variables
echo "🔧 Setting environment variables..."
if [ -f ".env.$ENVIRONMENT" ]; then
    # Read environment variables from file and set them
    while IFS= read -r line || [ -n "$line" ]; do
        if [[ $line =~ ^[^#]*= ]]; then
            key=$(echo "$line" | cut -d'=' -f1)
            value=$(echo "$line" | cut -d'=' -f2-)
            # Remove quotes if present
            value=$(echo "$value" | sed 's/^"\(.*\)"$/\1/')
            
            az webapp config appsettings set \
                --name $APP_NAME \
                --resource-group $RESOURCE_GROUP \
                --settings "$key=$value" \
                --output none
        fi
    done < ".env.$ENVIRONMENT"
fi

# Step 10: Enable continuous deployment (optional)
echo "🔄 Enabling container continuous deployment..."
az webapp deployment container config \
    --name $APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --enable-cd true

# Step 11: Restart the web app
echo "🔄 Restarting web app..."
az webapp restart --name $APP_NAME --resource-group $RESOURCE_GROUP

# Step 12: Get the URL
APP_URL="https://${APP_NAME}.azurewebsites.net"
echo "✅ Deployment completed!"
echo "🌐 App URL: $APP_URL"
echo "📊 Health Check: $APP_URL/api/health"
echo ""
echo "📝 To check logs:"
echo "   az webapp log tail --name $APP_NAME --resource-group $RESOURCE_GROUP"
echo ""
echo "🔧 To update environment variables:"
echo "   az webapp config appsettings set --name $APP_NAME --resource-group $RESOURCE_GROUP --settings KEY=VALUE"