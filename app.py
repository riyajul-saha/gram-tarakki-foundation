import os
from datetime import timedelta
from flask import Flask, render_template
from dotenv import load_dotenv

# Load environment variables from .env file (if it exists)
# In production platforms (like Render/Railway), variables are usually 
# set in the platform's dashboard, so .env won't exist.
if os.path.exists(".env"):
    load_dotenv()

app = Flask(__name__)

# Apply ProxyFix to correctly handle X-Forwarded-* headers in deployment environments
from werkzeug.middleware.proxy_fix import ProxyFix
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_prefix=1)

debug_mode = os.getenv("FLASK_DEBUG", "False").lower() in ("true", "1", "t")

app.secret_key = os.getenv("SECRET_KEY")
if not app.secret_key:
    raise ValueError("No SECRET_KEY set for Flask application!")
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(minutes=15) # After provided minutes admin will be logged out
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SECURE'] = not debug_mode       # Enable in production (HTTPS) only
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['MAX_CONTENT_LENGTH'] = 5 * 1024 * 1024  # 5 MB max

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
from flask import send_from_directory, abort
from pathlib import Path

UPLOAD_BASE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'upload')

@app.route('/upload/<path:filename>')
def serve_upload(filename):
    safe_path = Path(UPLOAD_BASE) / filename
    if not safe_path.resolve().is_relative_to(Path(UPLOAD_BASE).resolve()):
        abort(403)
    return send_from_directory(UPLOAD_BASE, filename)

CERT_BASE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'certificate')

@app.route('/certificate/<path:filename>')
def serve_certificate(filename):
    safe_path = Path(CERT_BASE) / filename
    if not safe_path.resolve().is_relative_to(Path(CERT_BASE).resolve()):
        abort(403)
    return send_from_directory(CERT_BASE, filename)

# Extra static file routes (e.g., sitemap.xml, robots.txt, Bing auth) 
# have been moved to a separate file: core/static_routes.py
from core.static_routes import init_static_routes
init_static_routes(app)

from flask import request, jsonify

@app.before_request
def csrf_protect():
    if request.method == "POST":
        origin = request.headers.get('Origin')
        referer = request.headers.get('Referer')
        host_url = request.host_url.rstrip('/')
        
        if origin:
            if origin != host_url and not origin.startswith(host_url):
                return jsonify({"status": "error", "message": "CSRF verification failed"}), 403
        elif referer:
            if not referer.startswith(host_url):
                return jsonify({"status": "error", "message": "CSRF verification failed"}), 403
        else:
            return jsonify({"status": "error", "message": "CSRF verification failed"}), 403

@app.after_request
def set_security_headers(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'SAMEORIGIN'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    return response

# Custom 404 error page for SEO and user experience
@app.errorhandler(404)
def page_not_found(e):
    return render_template('404.html'), 404

# Import routes from core and admin modules
import core.routes
import admin.routes
core.routes.init_routes(app)
admin.routes.init_routes(app)

if __name__ == "__main__":
    port = int(os.getenv("PORT", 3000))

    if debug_mode:
        print(f"Running in Development Mode on port {port}")
        app.run(host="0.0.0.0", port=port, debug=True)
    else:
        print(f"Running in Production Mode (Waitress) on port {port}")
        from waitress import serve
        # Allow proxy headers to reach ProxyFix by setting clear_untrusted_proxy_headers=False
        serve(app, host="0.0.0.0", port=port, clear_untrusted_proxy_headers=False)
