#!/bin/bash
set -e

# Configuration
SERVER="prod"
REMOTE_DIR="/var/www/void-collector"

echo "🚀 Deploying to $SERVER..."

# 1. Sync files
echo "📦 Syncing files..."
rsync -avz --exclude 'node_modules' \
    --exclude '.git' \
    --exclude '.next/cache' \
    --exclude '*.tar.gz' \
    --exclude '.gemini' \
    .next \
    app \
    components \
    store \
    lib \
    hooks \
    public \
    package.json \
    package-lock.json \
    next.config.ts \
    tsconfig.json \
    postcss.config.mjs \
    ecosystem.config.js \
    $SERVER:$REMOTE_DIR

# 2. Install dependencies, BUILD, & Restart on server
echo "🔄 Updating server..."
ssh $SERVER "cd $REMOTE_DIR && npm install --production && npm run build && pm2 delete void-collector || true && pm2 start ecosystem.config.js && pm2 save"

echo "✅ Deployment complete!"

