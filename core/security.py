import time
from functools import wraps
from flask import request, jsonify, session
import secrets

# In-memory rate limiter dictionary: {ip_address: [timestamp1, timestamp2, ...]}
RATE_LIMIT_STORE = {}
# Config: limit to 5 requests per 1 hour (3600 seconds)
RATE_LIMIT_MAX = 5
RATE_LIMIT_WINDOW = 3600

def rate_limit(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        ip = request.remote_addr
        now = time.time()
        
        # Clean up old entries
        if ip in RATE_LIMIT_STORE:
            RATE_LIMIT_STORE[ip] = [t for t in RATE_LIMIT_STORE[ip] if now - t < RATE_LIMIT_WINDOW]
        else:
            RATE_LIMIT_STORE[ip] = []
            
        if len(RATE_LIMIT_STORE[ip]) >= RATE_LIMIT_MAX:
            return jsonify({"status": "error", "message": "Too many requests. Please try again later."}), 429
            
        RATE_LIMIT_STORE[ip].append(now)
        return f(*args, **kwargs)
    return decorated_function

def validate_image_file(file_stream):
    """
    Validates that a file is an actual image by reading its magic bytes.
    Supports JPG, PNG, WEBP.
    Returns True if valid, False otherwise.
    """
    header = file_stream.read(12)
    file_stream.seek(0)  # Reset stream position for saving
    
    if header.startswith(b'\xff\xd8\xff'):
        return True # JPEG
    elif header.startswith(b'\x89PNG\r\n\x1a\n'):
        return True # PNG
    elif header[8:12] == b'WEBP':
        return True # WEBP
        
    return False

def validate_pdf_file(file_stream):
    """
    Validates that a file is a PDF by reading its magic bytes.
    """
    header = file_stream.read(5)
    file_stream.seek(0)
    return header.startswith(b'%PDF-')
