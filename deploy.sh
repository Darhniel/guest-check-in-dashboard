#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "📥 Pulling latest changes..."
git pull origin main

echo "📦 Installing dependencies..."
npm install
# Or if you use yarn: yarn install
# Or if you use pnpm: pnpm install

echo "🏗️ Building the Next.js app..."
npm run build
# This creates the .next folder with optimized production code

echo "🔄 Restarting the Next.js server..."
# OPTION A: If you are using PM2 (Recommended for production)
pm2 restart guest-accreditaion-dashboard
# Replace 'nextjs-app' with whatever name you gave your PM2 process

echo "✅ Deployment complete!"