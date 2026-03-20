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

    @app.route("/admin/dashboard")
    def dashboard():
        if not session.get('admin_logged_in'):
            return redirect(url_for('login'))

        volunteer_count = 0
        join_requests_count = 0
        recent_requests = []
        try:
            from core.db import get_db_connection
            conn = get_db_connection()
            if conn:
                cursor = conn.cursor(dictionary=True)
                
                # Fetch volunteer count
                cursor.execute("SELECT COUNT(*) as count FROM join_volunteer WHERE status IN ('approve', 'approved')")
                result = cursor.fetchone()
                if result:
                    volunteer_count = result.get('count', 0)
                
                # Fetch join requests count
                cursor.execute("SELECT COUNT(*) as count FROM join_requests")
                result = cursor.fetchone()
                if result:
                    join_requests_count = result.get('count', 0)

                # Fetch latest 3 join requests
                cursor.execute("SELECT id, fullname, email, address as location, DATE_FORMAT(created_at, '%e %b %Y') as date, status FROM join_requests ORDER BY created_at DESC LIMIT 3")
                recent_requests = cursor.fetchall()
                    
                cursor.close()
                conn.close()
        except Exception as e:
            print(f"Error fetching dashboard data: {e}")

        response = make_response(render_template('admin/dashboard.html', 
                                              volunteer_count=volunteer_count, 
                                              join_requests_count=join_requests_count,
                                              recent_requests=recent_requests))
        response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
        response.headers['Pragma'] = 'no-cache'
        response.headers['Expires'] = '0'
        return response

    @app.route("/admin/update-request-status", methods=["POST"])
    def update_request_status():
        if not session.get('admin_logged_in'):
            return jsonify({"status": "error", "message": "Unauthorized"}), 401
        
        data = request.get_json()
        request_id = data.get('id')
        new_status = data.get('status')
        
        if not request_id or not new_status:
            return jsonify({"status": "error", "message": "Missing ID or status"}), 400
            
        try:
            from core.db import get_db_connection
            conn = get_db_connection()
            if conn:
                cursor = conn.cursor()
                cursor.execute("UPDATE join_requests SET status = %s WHERE id = %s", (new_status, request_id))
                conn.commit()
                cursor.close()
                conn.close()
                return jsonify({"status": "success", "message": f"Request {new_status}ed successfully"})
        except Exception as e:
            print(f"Error updating request status: {e}")
            return jsonify({"status": "error", "message": str(e)}), 500
            
        return jsonify({"status": "error", "message": "Database connection failed"}), 500

    @app.route("/admin/our-students")
    def our_students():
        if not session.get('admin_logged_in'):
            return redirect(url_for('login'))
        return render_template('admin/student.html')

    @app.route("/admin/our-team")
    def our_team():
        if not session.get('admin_logged_in'):
            return redirect(url_for('login'))
        return render_template('admin/team.html')

    @app.route("/logout")
    def logout():
        session.clear()
        return redirect(url_for('login'))
