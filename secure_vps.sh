#!/bin/bash

# ==============================================================================
# Aurora Project VPS Hardening Script
# ==============================================================================
# ⚠️ Run this on your VPS as root (sudo bash secure_vps.sh)
#
# Features:
# 1. Updates system packages
# 2. Installs Fail2Ban (protects SSH and Mail)
# 3. Configures UFW Firewall (Blocks all except SSH, HTTP/S, Mail)
# 4. Hides direct IP access for AI/Bot services (Forces use of Tunnel)
# ==============================================================================

echo "🛡️  Starting VPS Hardening..."

# 1. Update System
echo "[-] Updating system packages..."
apt-get update && apt-get upgrade -y

# 2. Install Utilities
echo "[-] Installing UFW and Fail2Ban..."
apt-get install -y ufw fail2ban

# 3. Configure Fail2Ban
echo "[-] Configuring Fail2Ban..."
# Create local config to avoid overwriting updates
cat > /etc/fail2ban/jail.local <<EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true

[postfix]
enabled = true
port = smtp,ssmtp
filter = postfix
logpath = /var/log/mail.log

[dovecot]
enabled = true
port = pop3,pop3s,imap,imaps
filter = dovecot
logpath = /var/log/mail.log
EOF

systemctl enable fail2ban
systemctl restart fail2ban
echo "    ✅ Fail2Ban Active"

# 4. Configure Firewall (UFW)
echo "[-] Configuring Firewall Rules..."

# Default: Deny Incoming, Allow Outgoing
ufw default deny incoming
ufw default allow outgoing

# Allow SSH (Crucial! Do not lock yourself out)
# If you have a static IP, replace 'any' with your IP: ufw allow from x.x.x.x to any port 22
ufw allow 22/tcp

# Allow Web (If you host anything on 80/443 like the mail web client)
ufw allow 80/tcp
ufw allow 443/tcp

# Allow Mail Ports (Required for your Mail Server)
ufw allow 25/tcp    # SMTP
ufw allow 587/tcp   # SMTP Submission
ufw allow 993/tcp   # IMAPS
ufw allow 143/tcp   # IMAP
ufw allow 110/tcp   # POP3
ufw allow 465/tcp   # SMTPS

# BLOCK AI & Auth Ports (9090, 9091, 9092)
# Since we use Cloudflare Tunnel, these do NOT need to be open to the world.
# Cloudflare Tunnel connects outbound to Cloudflare.
echo "    🔒 Locking down application ports (9090-9092)..."
# Explicitly deny just in case, though default is deny
ufw deny 9090/tcp
ufw deny 9091/tcp
ufw deny 9092/tcp

# Enable Firewall
echo "⚠️  Enabling UFW. Ensure you have SSH access!"
# Non-interactive enable
ufw --force enable

echo "🛡️  Firewall Status:"
ufw status verbose

echo ""
echo "========================================================"
echo "🎉 VPS Security Hardening Complete!"
echo "1. Fail2Ban is watching SSH and Mail logs."
echo "2. Direct access to AI ports (9092) is BLOCKED (Tunnel still works)."
echo "3. Mail ports remain open (Required)."
echo "========================================================"
