#!/bin/bash
set -e

# Configuration
SERVER="prod"
REMOTE_DIR="/var/www/void-telegram"

echo "🚀 Deploying to Telegram Mini App instance ($SERVER)..."

# 1. Sync files
echo "📦 Syncing files..."
rsync -avz --exclude 'node_modules' \
    --exclude '.git' \
    --exclude '.next/cache' \
    --exclude '*.tar.gz' \
    --exclude '.gemini' \
    app \
    components \
    store \
    lib \
    hooks \
    public \
    messages \
    i18n \
    scripts \
    proxy.ts \
    package.json \
    package-lock.json \
    next.config.ts \
    tsconfig.json \
    postcss.config.js \
    ecosystem.telegram.config.cjs \
    $SERVER:$REMOTE_DIR

# 2. Install dependencies, BUILD, & Restart on server
echo "🔄 Updating server..."
ssh $SERVER "cd $REMOTE_DIR && chmod +x scripts/*.sh && npm install --legacy-peer-deps && npm run build && cp -r public .next/standalone/ && cp -r .next/static .next/standalone/.next/ && pm2 delete void-telegram || true && pm2 start ecosystem.telegram.config.cjs && pm2 save"

echo "✅ Telegram Deployment complete!"
