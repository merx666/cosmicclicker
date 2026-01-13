#!/bin/bash
# Deployment script for void-collector with missions upgrade
# Run from server: bash /var/www/void-collector/deploy-missions.sh

set -e

echo "🚀 Starting void-collector deployment with missions upgrade..."

# Configuration
APP_DIR="/var/www/void-collector"
TMP_ARCHIVE="/tmp/void-missions-upgrade-20260108_100859.tar.gz"
BACKUP_DIR="/var/www/void-collector-backup-$(date +%Y%m%d_%H%M%S)"

# Step 1: Backup current application
echo "📦 Creating backup at $BACKUP_DIR..."
cp -r $APP_DIR $BACKUP_DIR

# Step 2: Extract new version
echo "📂 Extracting new version..."
cd $APP_DIR
tar -xzf $TMP_ARCHIVE

# Step 3: Install dependencies
echo "📥 Installing dependencies..."
npm ci --production

# Step 4: Run database migration (Supabase)
echo "🗄️  Running database migration..."
echo "ℹ️  Please run this SQL manually in Supabase Dashboard:"
echo "   https://supabase.com/dashboard/project/wrruwhauyttrbgjrkcje/editor"
cat supabase/migrations/003_add_passive_particles.sql
echo ""
read -p "✅ Press Enter after running the SQL migration in Supabase..."

# Step 5: Build application
echo "🔨 Building application..."
npm run build

# Step 6: Restart PM2
echo "🔄 Restarting PM2 application..."
pm2 restart void-collector
pm2 save

# Step 7: Check application status
echo "🔍 Checking application status..."
sleep 3
pm2 status void-collector
pm2 logs void-collector --lines 20

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Verify application is running: pm2 logs void-collector"
echo "2. Test missions in app: https://void.skyreel.art"
echo "3. Verify new missions display correctly"
echo ""
echo "🔙 Rollback if needed:"
echo "   rm -rf $APP_DIR && mv $BACKUP_DIR $APP_DIR && pm2 restart void-collector"
