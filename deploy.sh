#!/bin/bash
# Void Collector - Deployment Script for Production Server

set -e  # Exit on error

echo "🚀 Starting Void Collector deployment..."

# Configuration
APP_NAME="void-collector"
APP_DIR="/var/www/$APP_NAME"
NODE_VERSION="18"  # or higher

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Step 1: Creating application directory${NC}"
mkdir -p $APP_DIR
cd $APP_DIR

echo -e "${YELLOW}Step 2: Copying application files${NC}"
# Files will be transferred via scp/rsync separately

echo -e "${YELLOW}Step 3: Installing dependencies${NC}"
npm install --production

echo -e "${YELLOW}Step 4: Setting up PM2${NC}"
npm install -g pm2

# Stop existing process if running
pm2 delete $APP_NAME 2>/dev/null || true

echo -e "${YELLOW}Step 5: Starting application with PM2${NC}"
pm2 start npm --name $APP_NAME -- start
pm2 save
pm2 startup

echo -e "${YELLOW}Step 6: Configuring Nginx${NC}"
cat > /etc/nginx/sites-available/$APP_NAME << 'EOF'
server {
    listen 80;
    server_name void.skyreel.art;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo -e "${GREEN}Application is running at: http://void.skyreel.art${NC}"
echo ""
echo "PM2 Commands:"
echo "  pm2 status          - Check app status"
echo "  pm2 logs $APP_NAME  - View logs"
echo "  pm2 restart $APP_NAME - Restart app"
