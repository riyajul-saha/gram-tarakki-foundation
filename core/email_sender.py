import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import os

def send_email_async(email, html_body):
    try:
        print(f"Starting to send email to {email}...", flush=True)
        gmail_user = os.getenv("GMAIL")
        gmail_password = os.getenv("GMAIL_PASSWORD")
        
        if gmail_user and gmail_password:
            gmail_user = gmail_user.strip()
            gmail_password = gmail_password.strip()
            
            msg = MIMEMultipart()
            msg['From'] = gmail_user
            msg['To'] = email
            msg['Subject'] = "Application Received – Gram Tarakki Foundation"
            
            msg.attach(MIMEText(html_body, 'html'))
            
            server = smtplib.SMTP('smtp.gmail.com', 587)
            server.set_debuglevel(1)  # View SMTP logs in Render
            server.starttls()
            server.login(gmail_user, gmail_password)
            server.send_message(msg)
            server.quit()
            print(f"Email sent successfully to {email}", flush=True)
        else:
            print("Gmail credentials not found in environment variables.", flush=True)
    except Exception as e:
        print(f"Failed to send confirmation email: {e}", flush=True)
