from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
import random
import string
from datetime import datetime, timedelta

def verify_admin_login(email, password):
    from core.db import get_db_connection
    
    try:
        conn = get_db_connection()
        if not conn:
            return {"status": "error", "message": "Database connection failed", "code": 500}

        cursor = conn.cursor(dictionary=True)
        # Check by email only
        cursor.execute("SELECT * FROM admin WHERE email = %s", (email,))
        admin_user = cursor.fetchone()
        
        if not admin_user:
            cursor.close()
            conn.close()
            return {"status": "error", "message": "Invalid credentials", "code": 401}

        if admin_user.get('status') == 'block':
            cursor.close()
            conn.close()
            return {"status": "error", "message": "Your account has been permanently blocked. Please contact another admin.", "code": 403}

        locked_until = admin_user.get('locked_until')
        if locked_until and datetime.now() < locked_until:
            wait_mins = int((locked_until - datetime.now()).total_seconds() / 60) + 1
            cursor.close()
            conn.close()
            return {"status": "error", "message": f"Your account is temporarily locked. Please try again in {wait_mins} minutes.", "code": 403}

        ph = PasswordHasher()
        try:
            # Verify password against hash
            ph.verify(admin_user['password'], password)
            # Success, reset failed attempts
            cursor.execute("UPDATE admin SET failed_attempts = 0 WHERE id = %s", (admin_user['id'],))
            conn.commit()
            cursor.close()
            conn.close()
            return {"status": "success", "admin_id": admin_user['id'], "admin_name": admin_user.get('fullname', 'Admin'), "admin_email": admin_user.get('email', '')}
        except VerifyMismatchError:
            failed_attempts = admin_user.get('failed_attempts', 0) + 1
            if failed_attempts >= 5:
                lock_time = datetime.now() + timedelta(minutes=15)
                cursor.execute("UPDATE admin SET failed_attempts = %s, locked_until = %s WHERE id = %s", (failed_attempts, lock_time, admin_user['id']))
                conn.commit()
                cursor.close()
                conn.close()
                return {"status": "error", "message": "Your account has been temporarily locked due to multiple failed login attempts. Please try again in 15 minutes.", "code": 403}
            else:
                cursor.execute("UPDATE admin SET failed_attempts = %s WHERE id = %s", (failed_attempts, admin_user['id']))
                conn.commit()
                cursor.close()
                conn.close()
                return {"status": "error", "message": f"Invalid credentials. You have {5 - failed_attempts} attempts left.", "code": 401}
            
    except Exception as e:
        print(f"Error during login: {e}")
        return {"status": "error", "message": "An error occurred during login", "code": 500}


def generate_otp(length=6):
    """Generate a secure random numeric OTP."""
    return ''.join(random.choices(string.digits, k=length))


def send_otp_email(app, admin_email, admin_name, otp_code, expiry_minutes=5):
    """Render the OTP email template and send it."""
    from flask import render_template
    from core.email_sender import send_email_async

    with app.app_context():
        html_body = render_template('emails/otp_verification.html',
                                    admin_name=admin_name,
                                    admin_email=admin_email,
                                    otp_code=otp_code,
                                    expiry_minutes=expiry_minutes)
        
        subject = "🔐 Admin Login Verification Code – Gram Tarakki Foundation"
        send_email_async(admin_email, html_body, subject=subject)
