from flask import render_template, request, jsonify, redirect, url_for, session, make_response
from admin.login import verify_admin_login

def init_routes(app):
    @app.route("/login", methods=["GET", "POST"])
    def login():
        if request.method == "POST":
            data = request.get_json() or {}
            username = data.get("username", "").strip()
            password = data.get("password", "").strip()

            if not username or not password:
                return jsonify({"status": "error", "message": "Username and password are required"}), 400

            result = verify_admin_login(username, password)

            if result["status"] == "success":
                session.permanent = True
                session['admin_logged_in'] = True
                session['admin_id'] = result['admin_id']
                return jsonify({"status": "success", "redirect": url_for("dashboard")})
            else:
                return jsonify({"status": result["status"], "message": result["message"]}), result.get("code", 401)

        if session.get('admin_logged_in'):
            return redirect(url_for("dashboard"))

        return render_template('admin/login.html')

    @app.route("/dashboard")
    def dashboard():
        if not session.get('admin_logged_in'):
            return redirect(url_for('login'))

        response = make_response(render_template('admin/dashboard.html'))
        response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
        response.headers['Pragma'] = 'no-cache'
        response.headers['Expires'] = '0'
        return response

    @app.route("/logout")
    def logout():
        session.clear()
        return redirect(url_for('login'))
