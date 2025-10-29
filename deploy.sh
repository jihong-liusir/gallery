#!/bin/bash

# Azure App Service Deployment Script (Kudu)
# This script runs during Azure App Service deployment

# Exit on any error
set -e 

echo "Starting Azure App Service deployment..."

# Setup
DEPLOYMENT_SOURCE=${DEPLOYMENT_SOURCE:-$PWD}
DEPLOYMENT_TARGET=${DEPLOYMENT_TARGET:-$PWD/wwwroot}
DEPLOYMENT_TEMP=${DEPLOYMENT_TEMP:-$PWD/temp}

# Install pnpm if not present
if ! command -v pnpm &> /dev/null; then
    echo "Installing pnpm..."
    npm install -g pnpm@10.19.0
fi

# Install dependencies
echo "Installing dependencies..."
pnpm install --frozen-lockfile --production=false

# Build the application
echo "Building the application..."

# First build the web app
echo "Building web application..."
cd apps/web
pnpm build
cd ../..

# Copy web build to SSR public directory
echo "Copying web build to SSR..."
rm -rf apps/ssr/public
cp -r apps/web/dist apps/ssr/public

# Generate index.html.ts for SSR
cd apps/ssr
node -e "
const fs = require('fs');
const html = fs.readFileSync('./public/index.html', 'utf8');
const jsContent = \`export default \\\`\${html.replace(/\`/g, '\\\\\`').replace(/\\\$/g, '\\\\\$')}\\\`;\`;
fs.writeFileSync('./src/index.html.ts', jsContent);
"
rm ./public/index.html
cd ../..

# Build Next.js application
echo "Building Next.js SSR application..."
cd apps/ssr
pnpm run build:next
cd ../..

# Install production dependencies only
echo "Installing production dependencies..."
pnpm install --frozen-lockfile --production=true

echo "Deployment completed successfully!"