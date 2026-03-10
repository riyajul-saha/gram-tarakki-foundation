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
        
        cursor.close()
        conn.close()

        if not admin_user:
            return {"status": "error", "message": "Invalid credentials", "code": 401}

        ph = PasswordHasher()
        try:
            # Verify password against hash
            ph.verify(admin_user['password'], password)
            # Success
            return {"status": "success", "admin_id": admin_user['id']}
        except VerifyMismatchError:
            return {"status": "error", "message": "Invalid credentials", "code": 401}
            
    except Exception as e:
        print(f"Error during login: {e}")
        return {"status": "error", "message": "An error occurred during login", "code": 500}
