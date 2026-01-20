#!/bin/bash

# ==============================================================================
# Aurora Deployment Script (Template)
# ==============================================================================
# Usage: 
# 1. Copy this file: cp deploy.sh deploy_local.sh
# 2. Fill in the secrets below
# 3. Run: sudo bash deploy_local.sh
# ==============================================================================

# --- Secrets (Fill these in local copy only) ---
export SUPABASE_URL=""
export SUPABASE_SERVICE_KEY=""
export TURNSTILE_SECRET=""
export AURORA_MAIL_PASS=""
export AURORA_SECRET_KEY="aurora_secret_key_change_this_in_production"

# --- Deployment Logic ---

echo "🚀 Starting Deployment..."

if [ -z "$AURORA_MAIL_PASS" ]; then
    echo "⚠️ Secrets not configured! Please edit the script first."
    exit 1
fi

# 1. Pull Latest Code
if [ -d ".git" ]; then
    echo "[-] Pulling latest code..."
    git pull origin main
fi

# 2. Install Dependencies
pip3 install pyjwt requests supabase --upgrade

# 3. Restart Auth Service
if pm2 list | grep -q "auth-service"; then
    pm2 delete auth-service
fi
pm2 start vps_auth_server.py --name auth-service --interpreter python3 --update-env

# 4. Restart AI Service
if pm2 list | grep -q "ai-service"; then
    pm2 delete ai-service
fi
pm2 start vps_ai_server.py --name ai-service --interpreter python3 --update-env

# 5. Check Tunnels
if ! pm2 list | grep -q "tunnel-auth"; then
    pm2 start cloudflared --name "tunnel-auth" -- tunnel --url http://localhost:9091
fi
if ! pm2 list | grep -q "tunnel-ai"; then
    pm2 start cloudflared --name "tunnel-ai" -- tunnel --url http://localhost:9092
fi

pm2 save
echo "🎉 Deployment Complete!"
