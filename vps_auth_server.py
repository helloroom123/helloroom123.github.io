import json
import random
import time
import smtplib
import os
import requests
import jwt
import datetime
from email.mime.text import MIMEText
from http.server import BaseHTTPRequestHandler, HTTPServer
from supabase import create_client, Client # pip install supabase

# ==============================================================================
# Aurora Auth Service v2.0 (Supabase + Turnstile)
# ==============================================================================

PORT = 9091
HOST = '0.0.0.0'
SECRET_KEY = os.environ.get("AURORA_SECRET_KEY", "aurora_secret_key_change_this")

# Mail Config
MAIL_HOST = "127.0.0.1" # Localhost for speed
MAIL_PORT = 587
MAIL_USER = "admin@auroraproject.dpdns.org"
MAIL_PASS = os.environ.get("AURORA_MAIL_PASS")

# Turnstile Config
TURNSTILE_SECRET = os.environ.get("TURNSTILE_SECRET", "0x4AAAAAAA...") # Replace with yours

# Supabase Config
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")

# Initialize Supabase
supabase: Client = None
if SUPABASE_URL and SUPABASE_KEY:
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("[Auth] Supabase connected.")
    except Exception as e:
        print(f"[Auth] Supabase Init Error: {e}")

# In-memory codes
verification_codes = {}

def verify_turnstile(token):
    if not TURNSTILE_SECRET or len(TURNSTILE_SECRET) < 10:
        return True # Bypass if not configured
    
    url = "https://challenges.cloudflare.com/turnstile/v0/siteverify"
    data = {
        "secret": TURNSTILE_SECRET,
        "response": token
    }
    try:
        res = requests.post(url, data=data, timeout=5)
        result = res.json()
        return result.get("success", False)
    except:
        return False

def send_email(to_email, code):
    if not MAIL_PASS: return False
    try:
        msg = MIMEText(f"Your Verification Code: {code}\n\nValid for 5 minutes.", 'plain', 'utf-8')
        msg['From'] = f"Aurora Auth <{MAIL_USER}>"
        msg['To'] = to_email
        msg['Subject'] = "Aurora Project Login Code"

        server = smtplib.SMTP(MAIL_HOST, MAIL_PORT)
        server.starttls()
        server.login(MAIL_USER, MAIL_PASS)
        server.sendmail(MAIL_USER, [to_email], msg.as_string())
        server.quit()
        return True
    except Exception as e:
        print(f"[Mail Error] {e}")
        return False

class AuthHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        
        try:
            data = json.loads(post_data.decode('utf-8'))
            action = data.get('action')
            email = data.get('email')

            # 1. Send Code (with Turnstile)
            if action == 'send-code':
                ts_token = data.get('turnstile')
                if not verify_turnstile(ts_token):
                    self._respond(400, {"error": "Human verification failed"})
                    return

                if not email:
                    self._respond(400, {"error": "Email required"})
                    return

                code = str(random.randint(100000, 999999))
                verification_codes[email] = {
                    "code": code,
                    "expire": time.time() + 300
                }
                
                if send_email(email, code):
                    self._respond(200, {"success": True})
                else:
                    self._respond(500, {"error": "Failed to send email"})

            # 2. Login / Check Registration
            elif action == 'verify-code':
                user_code = data.get('code')
                record = verification_codes.get(email)
                
                if not record or time.time() > record['expire'] or record['code'] != user_code:
                    self._respond(400, {"error": "Invalid or expired code"})
                    return
                
                # Code Valid. Check Supabase for User
                user_data = None
                if supabase:
                    res = supabase.table('profiles').select("*").eq('email', email).execute()
                    if res.data and len(res.data) > 0:
                        user_data = res.data[0]
                
                if user_data:
                    # User exists, issue token
                    token = self._issue_token(email, user_data)
                    del verification_codes[email] # Consume code
                    self._respond(200, {"success": True, "token": token, "user": user_data})
                else:
                    # User needs to register
                    # Don't delete code yet, they need it for registration step
                    self._respond(200, {"success": True, "need_register": True})

            # 3. Complete Registration
            elif action == 'register':
                # Re-verify code (must be valid to register)
                user_code = data.get('code')
                record = verification_codes.get(email)
                
                if not record or record['code'] != user_code:
                    self._respond(400, {"error": "Session expired, please retry login"})
                    return

                username = data.get('username')
                avatar = data.get('avatar', 'default') # URL or base64? Better URL
                bio = data.get('bio', '')

                if not username:
                    self._respond(400, {"error": "Username required"})
                    return

                # Save to Supabase
                new_user = {
                    "email": email,
                    "username": username,
                    "avatar_url": avatar,
                    "bio": bio,
                    "created_at": datetime.datetime.utcnow().isoformat()
                }
                
                if supabase:
                    try:
                        supabase.table('profiles').insert(new_user).execute()
                    except Exception as e:
                        print(f"[Supabase Error] {e}")
                        self._respond(500, {"error": "Database error"})
                        return

                token = self._issue_token(email, new_user)
                del verification_codes[email]
                self._respond(200, {"success": True, "token": token, "user": new_user})

            # 5. Update Profile
            elif action == 'update-profile':
                token = data.get('token')
                username = data.get('username')
                bio = data.get('bio')
                # avatar logic can be added later

                # Verify Token First
                try:
                    decoded = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
                    email = decoded['email']
                except:
                    self._respond(401, {"error": "Invalid token"})
                    return

                # Update Supabase
                update_data = {}
                if username: update_data['username'] = username
                if bio is not None: update_data['bio'] = bio # Allow empty bio
                
                if supabase and update_data:
                    try:
                        supabase.table('profiles').update(update_data).eq('email', email).execute()
                        # Return updated user object
                        res = supabase.table('profiles').select("*").eq('email', email).execute()
                        user_data = res.data[0] if res.data else update_data
                        self._respond(200, {"success": True, "user": user_data})
                    except Exception as e:
                        print(f"[Supabase Error] {e}")
                        self._respond(500, {"error": "Database error"})
                else:
                     self._respond(400, {"error": "No data to update"})

            # 6. Search Users
            elif action == 'search-users':
                query = data.get('query')
                if not query:
                    self._respond(400, {"error": "Query required"})
                    return

                if supabase:
                    try:
                        # Search by username or email (limit 5)
                        # Note: Supabase Python SDK syntax might vary slightly based on version
                        # using 'ilike' for case-insensitive search
                        res = supabase.table('profiles').select("*").or_(f"username.ilike.%{query}%,email.ilike.%{query}%").limit(5).execute()
                        
                        self._respond(200, {"success": True, "results": res.data})
                    except Exception as e:
                        print(f"[Supabase Search Error] {e}")
                        self._respond(500, {"error": "Search failed"})
                else:
                    self._respond(500, {"error": "Database not connected"})

            # 7. Add Points (Internal/Game Use)
            elif action == 'add-points':
                token = data.get('token')
                amount = data.get('amount', 0)
                reason = data.get('reason', 'game')

                try:
                    decoded = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
                    email = decoded['email']
                except:
                    self._respond(401, {"error": "Invalid token"})
                    return

                if amount == 0:
                    self._respond(400, {"error": "Amount required"})
                    return

                if supabase:
                    try:
                        # 1. Get current points
                        res = supabase.table('profiles').select('points').eq('email', email).execute()
                        current_points = res.data[0]['points'] if res.data else 0
                        
                        # 2. Update points
                        new_points = current_points + amount
                        supabase.table('profiles').update({'points': new_points}).eq('email', email).execute()
                        
                        # 3. Log transaction (Optional, create a 'point_logs' table if needed)
                        print(f"[Points] {email} +{amount} ({reason})")

                        self._respond(200, {"success": True, "points": new_points})
                    except Exception as e:
                        print(f"[Supabase Points Error] {e}")
                        self._respond(500, {"error": "Database error"})
                else:
                    self._respond(500, {"error": "DB not connected"})

            # 8. Get Profile (Refresh)
            elif action == 'get-profile':
                token = data.get('token')
                try:
                    decoded = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
                    email = decoded['email']
                except:
                    self._respond(401, {"error": "Invalid token"})
                    return

                if supabase:
                    try:
                        res = supabase.table('profiles').select("*").eq('email', email).execute()
                        if res.data:
                            self._respond(200, {"success": True, "user": res.data[0]})
                        else:
                            self._respond(404, {"error": "User not found"})
                    except Exception as e:
                        print(f"[Supabase Get Error] {e}")
                        self._respond(500, {"error": "Database error"})
                else:
                    self._respond(500, {"error": "DB not connected"})

            else:
                self._respond(400, {"error": "Invalid action"})

        except Exception as e:
            print(f"[Auth Exception] {e}")
            self._respond(500, {"error": str(e)})

    def _issue_token(self, email, user_data):
        payload = {
            "email": email,
            "username": user_data.get('username'),
            "role": "user",
            "exp": datetime.datetime.utcnow() + datetime.timedelta(days=30),
            "iat": datetime.datetime.utcnow()
        }
        return jwt.encode(payload, SECRET_KEY, algorithm="HS256")

    def _respond(self, code, data):
        self.send_response(code)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

if __name__ == '__main__':
    print(f"[Aurora Auth] Running on port {PORT}")
    HTTPServer((HOST, PORT), AuthHandler).serve_forever()
