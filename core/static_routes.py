import os
from flask import send_from_directory

def init_static_routes(app):
    """
    Initializes routes for serving static root files like sitemap, robots.txt, etc.
    """
    # Base directory is one level up from core/
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

    @app.route('/40add09e418b4c4ea130cd8b453e3d74.txt')
    def bing_site_auth_txt():
        return send_from_directory(BASE_DIR, '40add09e418b4c4ea130cd8b453e3d74.txt')

    @app.route('/sitemap.xml')
    def sitemap():
        return send_from_directory(BASE_DIR, 'sitemap.xml')

    @app.route('/BingSiteAuth.xml')
    def bing_site_auth_xml():
        return send_from_directory(BASE_DIR, 'BingSiteAuth.xml')

    @app.route('/robots.txt')
    def robots():
        return send_from_directory(BASE_DIR, 'robots.txt')

    @app.route('/manifest.json')
    def manifest():
        return send_from_directory(BASE_DIR, 'manifest.json')

    @app.route('/sw.js')
    def service_worker():
        # Service workers must be served with the correct MIME type
        return send_from_directory(BASE_DIR, 'sw.js', mimetype='application/javascript')
