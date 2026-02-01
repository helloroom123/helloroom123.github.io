import imaplib
import smtplib
from email.mime.text import MIMEText

# 配置信息
EMAIL = "admin@auroraproject.dpdns.org"
PASSWORD = "Aurora2024!"
IMAP_SERVER = "mail.auroraproject.dpdns.org"
IMAP_PORT = 993
SMTP_SERVER = "mail.auroraproject.dpdns.org"
SMTP_PORT = 587

def test_imap():
    print(f"[-] Testing IMAP connection {IMAP_SERVER}:{IMAP_PORT}...")
    try:
        mail = imaplib.IMAP4_SSL(IMAP_SERVER, IMAP_PORT)
        print("    Connection established! Logging in...")
        mail.login(EMAIL, PASSWORD)
        print("    [OK] IMAP Login Success!")
        mail.list()
        mail.logout()
        return True
    except Exception as e:
        print(f"    [ERROR] IMAP Failed: {e}")
        return False

def test_smtp():
    print(f"[-] Testing SMTP connection {SMTP_SERVER}:{SMTP_PORT}...")
    try:
        # SMTP 端口 587 通常使用 STARTTLS
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.ehlo()
        print("    Connection established! Starting TLS...")
        server.starttls()
        server.ehlo()
        print("    Logging in...")
        server.login(EMAIL, PASSWORD)
        print("    [OK] SMTP Login Success!")
        server.quit()
        return True
    except Exception as e:
        print(f"    [ERROR] SMTP Failed: {e}")
        return False

if __name__ == "__main__":
    print("=== Mail Server Configuration Test ===")
    imap_ok = test_imap()
    print("-" * 30)
    smtp_ok = test_smtp()
    
    if imap_ok and smtp_ok:
        print("\n[SUCCESS] Mail server is working correctly!")
    else:
        print("\n[WARNING] Issues detected.")
