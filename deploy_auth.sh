#!/bin/bash

# ==============================================================================
# Aurora Auth & AI Service Deployment Script
# ==============================================================================
# Usage: sudo bash deploy_auth.sh
# ==============================================================================

echo "🚀 Starting Deployment..."

# 1. Pull Latest Code
echo "[-] Pulling latest code from GitHub..."
# 如果你在 VPS 上配置了 git
if [ -d ".git" ]; then
    git pull origin main
else
    echo "⚠️ Not a git repository. Assuming files are uploaded manually."
fi

# 2. Install Python Dependencies
echo "[-] Installing dependencies..."
pip3 install pyjwt requests --upgrade

# 3. Restart Auth Service (Port 9091)
echo "[-] Deploying Auth Service..."

# Ask for Mail Password securely
echo -n "🔑 Enter Mail Password for admin@auroraproject.dpdns.org: "
read -s MAIL_PASS
echo ""

if [ -z "$MAIL_PASS" ]; then
    echo "❌ Password cannot be empty!"
    exit 1
fi

# Check if auth-service is running in PM2
if pm2 list | grep -q "auth-service"; then
    pm2 delete auth-service
fi

# Start with Env Var
AURORA_MAIL_PASS="$MAIL_PASS" pm2 start vps_auth_server.py --name auth-service --interpreter python3 --update-env

# 4. Restart AI Service (Port 9092)
echo "[-] Deploying AI Service..."
if pm2 list | grep -q "ai-service"; then
    pm2 restart ai-service
else
    pm2 start vps_ai_server.py --name ai-service --interpreter python3
fi

# 5. Check Tunnels
echo "[-] Checking Cloudflare Tunnels..."
# Check Tunnel for Auth (9091)
if ! pm2 list | grep -q "tunnel-auth"; then
    echo "⚠️ Tunnel for Auth (9091) missing! Starting..."
    pm2 start cloudflared --name "tunnel-auth" -- tunnel --url http://localhost:9091
fi

# Check Tunnel for AI (9092)
if ! pm2 list | grep -q "tunnel-ai"; then
    echo "⚠️ Tunnel for AI (9092) missing! Starting..."
    pm2 start cloudflared --name "tunnel-ai" -- tunnel --url http://localhost:9092
fi

# 6. Save PM2 List
pm2 save

echo "=================================================="
echo "🎉 Deployment Complete!"
echo "Services Status:"
pm2 list
echo "=================================================="
