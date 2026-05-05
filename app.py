import os
from datetime import timedelta
from flask import Flask
from dotenv import load_dotenv

# Load environment variables from .env file (if it exists)
# In production platforms (like Render/Railway), variables are usually 
# set in the platform's dashboard, so .env won't exist.
if os.path.exists(".env"):
    load_dotenv()

app = Flask(__name__)

import secrets
app.secret_key = os.getenv("SECRET_KEY")
if not app.secret_key:
    _is_debug = os.getenv("FLASK_DEBUG", "False").lower() in ("true", "1", "t")
    if not _is_debug:
        raise ValueError("No SECRET_KEY set for Flask application in production!")
    app.secret_key = secrets.token_hex(32)
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(minutes=5)

# Set up upload folder for resumes and partner logos
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'upload', 'resume')
PARTNER_LOGO_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'upload', 'partner_logo')
STUDENT_IMAGE_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'upload', 'student_image')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(PARTNER_LOGO_FOLDER, exist_ok=True)
os.makedirs(STUDENT_IMAGE_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['PARTNER_LOGO_FOLDER'] = PARTNER_LOGO_FOLDER
app.config['STUDENT_IMAGE_FOLDER'] = STUDENT_IMAGE_FOLDER

from core.db import init_db
init_db()

# Serve uploaded files (student images, resumes, logos, etc.)
from flask import send_from_directory
UPLOAD_BASE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'upload')

@app.route('/upload/<path:filename>')
def serve_upload(filename):
    return send_from_directory(UPLOAD_BASE, filename)


@app.route('/sitemap.xml')
def sitemap():
    return send_from_directory(os.path.dirname(os.path.abspath(__file__)), 'sitemap.xml')

@app.route('/robots.txt')
def robots():
    return send_from_directory(os.path.dirname(os.path.abspath(__file__)), 'robots.txt')

from flask import request, jsonify

@app.before_request
def csrf_protect():
    if request.method == "POST" and request.path.startswith('/admin/'):
        origin = request.headers.get('Origin')
        referer = request.headers.get('Referer')
        host_url = request.host_url.rstrip('/')
        
        if origin:
            if origin != host_url and not origin.startswith(host_url):
                return jsonify({"status": "error", "message": "CSRF verification failed (Origin mismatch)"}), 403
        elif referer:
            if not referer.startswith(host_url):
                return jsonify({"status": "error", "message": "CSRF verification failed (Referer mismatch)"}), 403
        else:
            return jsonify({"status": "error", "message": "CSRF verification failed (Missing Origin/Referer)"}), 403

# Import routes from core and admin modules
import core.routes
import admin.routes
core.routes.init_routes(app)
admin.routes.init_routes(app)

if __name__ == "__main__":
    # Check if we should run in debug mode
    debug_mode = os.getenv("FLASK_DEBUG", "False").lower() in ("true", "1", "t")
    
    port = int(os.getenv("PORT", 3000))

    if debug_mode:
        print(f"Running in Development Mode on port {port}")
        app.run(host="0.0.0.0", port=port, debug=True)
    else:
        print(f"Running in Production Mode (Waitress) on port {port}")
        from waitress import serve
        serve(app, host="0.0.0.0", port=port)
