import json
import random
import time
from http.server import BaseHTTPRequestHandler, HTTPServer
import urllib.parse
from datetime import datetime
import requests # Need: pip install requests
import jwt # Need: pip install pyjwt

# ==============================================================================
# Aurora AI Toolkit - Local Inference Server (VPS) v2.1
# ==============================================================================
# Features:
# 1. /analyze - Sentiment Analysis & Spam Check
# 2. /chat    - Aurora Character Chat (Protected by JWT)
# ==============================================================================

PORT = 9092
HOST = '0.0.0.0'
SECRET_KEY = "aurora_secret_key_change_this_in_production" # Must match Auth Server

# Configure Local LLM (Ollama or vLLM)
# Default Ollama port is 11434. Ensure Ollama is running: `ollama serve`
LOCAL_LLM_URL = "http://127.0.0.1:11434/api/generate"
MODEL_NAME = "deepseek-r1:7b" # Change this to your installed model

# Aurora Character System Prompt
SYSTEM_PROMPT = """
你现在扮演一个叫“舒苒(Aurora)”的角色。
设定：18岁，富家千金，珠宝设计师，性格温柔坚韧，有些许傲娇。
喜好：青苹果、扇子、宝石。
说话风格：优雅、礼貌，偶尔会用“本小姐”自称，对熟悉的人很体贴。
请用简短的中文回答，不要长篇大论。
"""

# --- Text Processing Utils ---
def analyze_sentiment(text):
    # Simple heuristic for demo
    positive_words = ['开心', '喜欢', '棒', 'lol', 'good', 'love', 'nice']
    negative_words = ['难过', '讨厌', '差', 'bad', 'hate', 'sad']
    score = 0.0
    for word in positive_words:
        if word in text: score += 0.2
    for word in negative_words:
        if word in text: score -= 0.3
    return max(min(score, 1.0), -1.0)

def extract_keywords(text):
    stop_words = ['的', '了', '是', '在', '我', '有']
    words = text.split()
    keywords = [w for w in words if len(w) > 1 and w not in stop_words]
    return keywords[:3]

def check_spam(text):
    blocked_words = ['加群', '兼职', '卖片', 'http', '赌博']
    for word in blocked_words:
        if word in text:
            return True, "Keyword Filter"
    if len(text) > 300:
        return True, "Length Limit"
    return False, "OK"

# --- HTTP Server Handler ---
class AIServerHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        # 1. /chat Endpoint (Protected)
        if self.path == '/chat':
            # Check Authorization Header
            auth_header = self.headers.get('Authorization')
            if not auth_header or not auth_header.startswith('Bearer '):
                self.send_response(401)
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Login required"}).encode('utf-8'))
                return

            token = auth_header.split(' ')[1]
            try:
                # Verify JWT locally
                jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            except Exception as e:
                self.send_response(401)
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Invalid token"}).encode('utf-8'))
                return

            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            try:
                data = json.loads(post_data.decode('utf-8'))
                user_text = data.get('text', '')
                print(f"[Chat] User: {user_text}")

                # Call Local LLM
                try:
                    payload = {
                        "model": MODEL_NAME,
                        "prompt": user_text,
                        "system": SYSTEM_PROMPT,
                        "stream": False
                    }
                    resp = requests.post(LOCAL_LLM_URL, json=payload, timeout=60)
                    
                    if resp.status_code == 200:
                        ai_reply = resp.json().get('response', '')
                    else:
                        print(f"[LLM Error] {resp.text}")
                        ai_reply = "(舒苒正在发呆... 大脑连接断开)"
                except Exception as e:
                    print(f"[LLM Exception] {e}")
                    ai_reply = "(系统错误: 无法连接到本地 Ollama)"

                response = {"reply": ai_reply}
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(response).encode('utf-8'))

            except Exception as e:
                self.send_response(500)
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))

        # 2. /analyze Endpoint
        elif self.path == '/analyze':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            try:
                data = json.loads(post_data.decode('utf-8'))
                text = data.get('text', '')
                is_spam, reason = check_spam(text)
                sentiment = analyze_sentiment(text)
                response = {
                    "status": "ok",
                    "sentiment": sentiment,
                    "is_spam": is_spam,
                    "timestamp": datetime.now().isoformat()
                }
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(response).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
        
        else:
            self.send_response(404)
            self.end_headers()

    def do_GET(self):
        if self.path == '/status':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"status": "running", "uptime": "ok"}).encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()

if __name__ == '__main__':
    server = HTTPServer((HOST, PORT), AIServerHandler)
    print(f"[Aurora AI] Server running on {HOST}:{PORT}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    server.server_close()
