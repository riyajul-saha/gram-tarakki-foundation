from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

def verify_admin_login(username, password):
    from core.db import get_db_connection
    
    try:
        conn = get_db_connection()
        if not conn:
            return {"status": "error", "message": "Database connection failed", "code": 500}

        cursor = conn.cursor(dictionary=True)
        # Check by id (userid) or email
        cursor.execute("SELECT * FROM admin WHERE id = %s OR email = %s", (username, username))
        admin_user = cursor.fetchone()
        
        if not admin_user:
            cursor.close()
            conn.close()
            return {"status": "error", "message": "Invalid credentials", "code": 401}

        from datetime import datetime, timedelta

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
            return {"status": "success", "admin_id": admin_user['id']}
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
