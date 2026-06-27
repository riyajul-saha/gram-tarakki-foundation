import smtplib
import base64
import threading
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.header import Header
import os
import requests
import json
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# Gmail API permission scope
SCOPES = ['https://www.googleapis.com/auth/gmail.send']

# def _send_via_google_script(email, subject, html_body):
#     script_url = os.getenv("GOOGLE_SCRIPT_URL")
#     if not script_url:
#         print("GOOGLE_SCRIPT_URL not found in environment variables.", flush=True)
#         return False
#     
#     try:
#         print(f"Attempting to send email via Google Script to {email}...", flush=True)
#         payload = {
#             "email": email,
#             "subject": subject,
#             "message": "Please view this email in a client that supports HTML.",
#             "htmlMessage": html_body,
#             "token": os.getenv("GOOGLE_SCRIPT_SECURE_TOKEN") # Add this in .env to secure the webhook
#         }
#         
#         headers = {'Content-Type': 'application/json; charset=utf-8'}
#         
#         # Use json=payload to let requests properly format the payload with ensure_ascii=True (default),
#         # which sends ASCII-escaped unicode that Google Apps Script's JSON.parse can natively understand,
#         # preventing charset corruption for emojis.
#         response = requests.post(script_url, json=payload, headers=headers, timeout=15)
#         
#         if response.status_code in (200, 201):
#             try:
#                 resp_data = response.json()
#                 if resp_data.get("status") == "success":
#                     print(f"Email sent successfully via Google Script to {email}", flush=True)
#                     return True
#                 else:
#                     print(f"Google Script returned an error: {resp_data.get('message')}", flush=True)
#                     return False
#             except ValueError:
#                 print(f"Email sent via Google Script to {email} (unrecognized response format)", flush=True)
#                 return True
#         else:
#             print(f"Failed to send via Google Script. Status: {response.status_code}, Response: {response.text}", flush=True)
#             return False
#     except Exception as e:
#         print(f"Exception during Google Script email fallback: {e}", flush=True)
#         return False
# 
# def _send_via_smtp(email, subject, html_body):
#     try:
#         print(f"Attempting to send email via SMTP to {email}...", flush=True)
#         gmail_user = os.getenv("GMAIL")
#         gmail_password = os.getenv("GMAIL_PASSWORD")
#         
#         if gmail_user and gmail_password:
#             gmail_user = gmail_user.strip()
#             gmail_password = gmail_password.strip()
#             
#             msg = MIMEMultipart()
#             msg['From'] = gmail_user
#             msg['To'] = email
#             msg['Subject'] = Header(subject, 'utf-8')
#             
#             msg.attach(MIMEText(html_body, 'html'))
#             
#             # Using SMTP_SSL on port 465 provides immediate encryption, preventing STARTTLS stripping
#             server = smtplib.SMTP_SSL('smtp.gmail.com', 465, timeout=10)
#             server.set_debuglevel(1)  # View SMTP logs in Render
#             server.login(gmail_user, gmail_password)
#             server.send_message(msg)
#             server.quit()
#             print(f"Email sent successfully via SMTP to {email}", flush=True)
#             return True
#         else:
#             print("Gmail credentials not found in environment variables for SMTP.", flush=True)
#             return False
#     except Exception as e:
#         print(f"SMTP failed or timed out: {e}", flush=True)
#         return False
# 
# def _send_via_gmail_api(email, subject, html_body):
#     try:
#         print(f"Attempting to send email to {email} via Gmail API...", flush=True)
#         
#         # Local e testing er jonno 'gtf_key.json', Render e secret file theke asbe
#         service_account_file = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "gtf_key.json")
#         delegated_email = os.getenv("DELEGATED_EMAIL", "info@gtfoundations.in")
#         
#         if not os.path.exists(service_account_file):
#             print(f"Error: JSON Key file not found at {service_account_file}", flush=True)
#             return False
# 
#         # 1. Service Account JSON diye authenticate kora ebang Domain-Wide Delegation apply kora
#         creds = service_account.Credentials.from_service_account_file(
#             service_account_file, scopes=SCOPES
#         )
#         delegated_creds = creds.with_subject(delegated_email)
# 
#         # 2. Gmail API service build kora
#         service = build('gmail', 'v1', credentials=delegated_creds)
# 
#         # 3. Email message toiri kora
#         msg = MIMEMultipart()
#         msg['To'] = email
#         msg['From'] = delegated_email
#         msg['Subject'] = Header(subject, 'utf-8')
#         
#         msg.attach(MIMEText(html_body, 'html'))
# 
#         # 4. Message take base64url format e encode kora (Gmail API er rules)
#         raw_message = base64.urlsafe_b64encode(msg.as_bytes()).decode('utf-8')
#         
#         # 5. Mail send kora
#         send_message = service.users().messages().send(
#             userId="me", 
#             body={'raw': raw_message}
#         ).execute()
#         
#         print(f"Email sent successfully via Gmail API to {email}. Message ID: {send_message['id']}", flush=True)
#         return True
# 
#     except HttpError as error:
#         print(f"Gmail API HTTP error occurred: {error}", flush=True)
#         return False
#     except Exception as e:
#         print(f"Unexpected error during Gmail API email sending: {e}", flush=True)
#         return False

def _send_via_resend(email, subject, html_body):
    try:
        print(f"Attempting to send email via Resend to {email}...", flush=True)
        
        # Fetching from .env as requested by user
        api_key = os.getenv("resend_api")
        sender_email = os.getenv("GMAIL")  
        
        if not api_key:
            print("Resend API key ('resend_api') not found in environment variables.", flush=True)
            return False
            
        if not sender_email:
            print("Sender email ('GMAIL') not found in environment variables.", flush=True)
            return False

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "from": f"Gram Tarakki Foundation <{sender_email}>",
            "to": [email],
            "subject": subject,
            "html": html_body
        }
        
        response = requests.post("https://api.resend.com/emails", json=payload, headers=headers, timeout=15)
        
        if response.status_code in (200, 201):
            print(f"Email sent successfully via Resend to {email}", flush=True)
            return True
        else:
            print(f"Failed to send via Resend. Status: {response.status_code}, Response: {response.text}", flush=True)
            return False
    except Exception as e:
        print(f"Exception during Resend email delivery: {e}", flush=True)
        return False

def _send_email_sync(email, html_body, subject):
    print(f"Starting email delivery process for {email}...", flush=True)
    
    # Use Resend API
    _send_via_resend(email, subject, html_body)

def send_email_async(email, html_body, subject="Application Received – Gram Tarakki Foundation"):
    """
    Sends an email in a background thread so the HTTP response isn't blocked.
    Daemon is set to True so it doesn't prevent the server from shutting down.
    """
    thread = threading.Thread(target=_send_email_sync, args=(email, html_body, subject))
    thread.daemon = True
    thread.start()
