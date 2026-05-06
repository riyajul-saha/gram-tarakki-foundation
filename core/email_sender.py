import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import os
import requests
import json

def _send_via_google_script(email, subject, html_body):
    script_url = os.getenv("GOOGLE_SCRIPT_URL")
    if not script_url:
        print("GOOGLE_SCRIPT_URL not found in environment variables.", flush=True)
        return
    
    try:
        print(f"Attempting to send email via Google Script to {email}...", flush=True)
        payload = {
            "email": email,
            "subject": subject,
            "message": "Please view this email in a client that supports HTML.",
            "htmlMessage": html_body,
            "token": os.getenv("GOOGLE_SCRIPT_SECURE_TOKEN") # Add this in .env to secure the webhook
        }
        
        headers = {'Content-Type': 'application/json; charset=utf-8'}
        payload_bytes = json.dumps(payload, ensure_ascii=False).encode('utf-8')
        
        # Try sending as UTF-8 explicitly; using timeout=15
        response = requests.post(script_url, data=payload_bytes, headers=headers, timeout=15)
        
        if response.status_code in (200, 201):
            try:
                resp_data = response.json()
                if resp_data.get("status") == "success":
                    print(f"Email sent successfully via Google Script to {email}", flush=True)
                else:
                    print(f"Google Script returned an error: {resp_data.get('message')}", flush=True)
            except ValueError:
                print(f"Email sent via Google Script to {email} (unrecognized response format)", flush=True)
        else:
            print(f"Failed to send via Google Script. Status: {response.status_code}, Response: {response.text}", flush=True)
    except Exception as e:
        print(f"Exception during Google Script email fallback: {e}", flush=True)

def send_email_async(email, html_body, subject="Application Received – Gram Tarakki Foundation"):
    try:
        print(f"Starting to send email to {email}...", flush=True)
        gmail_user = os.getenv("GMAIL")
        gmail_password = os.getenv("GMAIL_PASSWOR")
        
        if gmail_user and gmail_password:
            gmail_user = gmail_user.strip()
            gmail_password = gmail_password.strip()
            
            msg = MIMEMultipart()
            msg['From'] = gmail_user
            msg['To'] = email
            msg['Subject'] = subject
            
            msg.attach(MIMEText(html_body, 'html'))
            
            # Using SMTP_SSL on port 465 provides immediate encryption, preventing STARTTLS stripping
            server = smtplib.SMTP_SSL('smtp.gmail.com', 465, timeout=10)
            server.set_debuglevel(1)  # View SMTP logs in Render
            server.login(gmail_user, gmail_password)
            server.send_message(msg)
            server.quit()
            print(f"Email sent successfully to {email}", flush=True)
        else:
            print("Gmail credentials not found in environment variables. Falling back to Google Script...", flush=True)
            _send_via_google_script(email, subject, html_body)
    except Exception as e:
        print(f"SMTP failed or timed out ({e}). Falling back to Google Script...", flush=True)
        _send_via_google_script(email, subject, html_body)
