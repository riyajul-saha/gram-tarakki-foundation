from flask import render_template, request, jsonify, redirect, url_for, session, make_response
import mysql.connector
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
        join_student_count = 0
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
                cursor.execute("SELECT COUNT(*) as count FROM join_student")
                result = cursor.fetchone()
                if result:
                    join_student_count = result.get('count', 0)

                # Fetch latest 3 join requests
                cursor.execute("SELECT id, fullname, email, address as location, DATE_FORMAT(created_at, '%e %b %Y') as date, status FROM join_student ORDER BY created_at DESC LIMIT 3")
                recent_requests = cursor.fetchall()
                    
                cursor.close()
                conn.close()
        except Exception as e:
            print(f"Error fetching dashboard data: {e}")

        response = make_response(render_template('admin/dashboard.html', 
                                              volunteer_count=volunteer_count, 
                                              join_requests_count=join_student_count,
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
                cursor.execute("UPDATE join_student SET status = %s WHERE id = %s", (new_status, request_id))
                conn.commit()
                cursor.close()
                conn.close()
                return jsonify({"status": "success", "message": f"Request {new_status}ed successfully"})
        except Exception as e:
            print(f"Error updating request status: {e}")
            return jsonify({"status": "error", "message": str(e)}), 500
            
        return jsonify({"status": "error", "message": "Database connection failed"}), 500

    @app.route("/admin/add-student", methods=["POST"])
    def add_student():
        if not session.get('admin_logged_in'):
            return jsonify({"status": "error", "message": "Unauthorized"}), 401
        
        fullname = request.form.get('fullname', '').strip()
        email = request.form.get('email', '').strip()
        phone = request.form.get('phone', '').strip()
        age = request.form.get('age', '')
        program = request.form.get('program', '').strip()
        gender = request.form.get('gender', '').strip()
        school = request.form.get('school', '').strip()
        address = request.form.get('address', '').strip()
        medical = request.form.get('medical', '').strip()

        if not fullname or not email or not phone or not age:
            return jsonify({"status": "error", "message": "Name, email, phone and age are required"}), 400

        try:
            age = int(age)
        except ValueError:
            return jsonify({"status": "error", "message": "Age must be a valid number"}), 400

        image_path = ""
        if 'image' in request.files:
            file = request.files['image']
            if file and file.filename != '':
                from werkzeug.utils import secure_filename
                import uuid
                import os
                filename = secure_filename(file.filename)
                allowed_ext = {'jpg', 'jpeg', 'png', 'webp'}
                ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''
                if ext in allowed_ext:
                    unique_filename = f"{uuid.uuid4().hex}_{filename}"
                    file_path = os.path.join(app.config['STUDENT_IMAGE_FOLDER'], unique_filename)
                    file.save(file_path)
                    image_path = f"/upload/student_image/{unique_filename}"

        try:
            from core.db import get_db_connection
            conn = get_db_connection()
            if conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO join_student (fullname, email, phone, age, program, gender, school, address, medical, status, image)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, 'active', %s)
                """, (fullname, email, phone, age, program, gender or None, school or None, address, medical or None, image_path if image_path else None))
                conn.commit()
                cursor.close()
                conn.close()
                return jsonify({"status": "success", "message": "Student added successfully"})
        except Exception as e:
            print(f"Error adding student: {e}")
            if "Duplicate entry" in str(e):
                return jsonify({"status": "error", "message": "A student with this name and email already exists"}), 409
            return jsonify({"status": "error", "message": str(e)}), 500

        return jsonify({"status": "error", "message": "Database connection failed"}), 500

    @app.route("/admin/our-students")
    def our_students():
        if not session.get('admin_logged_in'):
            return redirect(url_for('login'))
            
        active_students = []
        pending_students = []
        rejected_students = []
        total_active = 0
        total_pending = 0
        approved_this_month = 0
        
        total_rejected = 0
        
        try:
            from core.db import get_db_connection
            conn = get_db_connection()
            if conn:
                cursor = conn.cursor(dictionary=True)
                
                # Active Students
                cursor.execute("SELECT id, fullname, email, phone, program, created_at, image, status, address, experience, medical, parent_name, parent_contact, school, age, gender FROM join_student WHERE status = 'active' ORDER BY created_at DESC")
                active_students = cursor.fetchall()
                total_active = len(active_students)
                for s in active_students:
                    s['date'] = s['created_at'].strftime('%d %b %Y') if s.get('created_at') else ''
                
                # Pending Students
                cursor.execute("SELECT id, fullname, email, phone, program, created_at, image, status, address, experience, medical, parent_name, parent_contact, school, age, gender FROM join_student WHERE status = 'pending' ORDER BY created_at DESC")
                pending_students = cursor.fetchall()
                total_pending = len(pending_students)
                for s in pending_students:
                    s['date'] = s['created_at'].strftime('%d %b %Y') if s.get('created_at') else ''
                
                # Rejected Students
                cursor.execute("SELECT id, fullname, email, phone, program, created_at, image, status, address, experience, medical, parent_name, parent_contact, school, age, gender FROM join_student WHERE status = 'rejected' ORDER BY created_at DESC")
                rejected_students = cursor.fetchall()
                total_rejected = len(rejected_students)
                for s in rejected_students:
                    s['date'] = s['created_at'].strftime('%d %b %Y') if s.get('created_at') else ''
                
                # Approved This Month
                cursor.execute("""
                    SELECT COUNT(*) as count FROM join_student 
                    WHERE status = 'active' 
                    AND YEAR(created_at) = YEAR(CURRENT_DATE()) 
                    AND MONTH(created_at) = MONTH(CURRENT_DATE())
                """)
                res = cursor.fetchone()
                if res:
                    approved_this_month = res.get('count', 0)
                
                cursor.close()
                conn.close()
        except Exception as e:
            print(f"Error fetching student data: {e}")

        return render_template('admin/student.html', 
                               active_students=active_students,
                               pending_students=pending_students,
                               rejected_students=rejected_students,
                               total_active=total_active,
                               total_pending=total_pending,
                               total_rejected=total_rejected,
                               approved_this_month=approved_this_month)

    @app.route("/admin/api/jobs", methods=["GET", "POST"])
    def api_jobs():
        if not session.get('admin_logged_in'):
            return jsonify({"status": "error", "message": "Unauthorized"}), 401
            
        import json
        import os
        json_path = os.path.join(app.root_path, 'data', 'carrier.json')
        
        if request.method == "GET":
            if os.path.exists(json_path):
                with open(json_path, 'r', encoding='utf-8') as f:
                    try:
                        jobs = json.load(f)
                        return jsonify(jobs)
                    except json.JSONDecodeError:
                        return jsonify([])
            return jsonify([])
            
        if request.method == "POST":
            try:
                data = request.json
                if not data:
                    return jsonify({"status": "error", "message": "Invalid request data"}), 400
                    
                action = data.get('action') # 'create', 'update', 'status'
                job_data = data.get('job')
                
                if action == 'create' and not job_data:
                    return jsonify({"status": "error", "message": "Job data is required"}), 400
                
                jobs = []
                if os.path.exists(json_path):
                    with open(json_path, 'r', encoding='utf-8') as f:
                        try:
                            jobs = json.load(f)
                        except json.JSONDecodeError:
                            pass
                            
                if action == 'create':
                    new_id = max([j.get('id', 0) for j in jobs], default=0) + 1
                    job_data['id'] = new_id
                    # Map requirements and responsibilities correctly
                    if isinstance(job_data.get('requirements'), str):
                        job_data['requirements'] = [r.strip() for r in job_data['requirements'].split('\n') if r.strip()]
                    if 'responsibilities' not in job_data:
                        job_data['responsibilities'] = []
                    if 'tags' not in job_data:
                        job_data['tags'] = []
                    jobs.append(job_data)
                elif action == 'update':
                    job_id = job_data.get('id')
                    for i, j in enumerate(jobs):
                        if j.get('id') == job_id:
                            if isinstance(job_data.get('requirements'), str):
                                job_data['requirements'] = [r.strip() for r in job_data['requirements'].split('\n') if r.strip()]
                            jobs[i].update(job_data)
                            break
                elif action == 'status':
                    job_id = data.get('id')
                    new_status = data.get('status')
                    for i, j in enumerate(jobs):
                        if j.get('id') == job_id:
                            jobs[i]['status'] = new_status
                            break
                elif action == 'delete':
                    job_id = data.get('id')
                    jobs = [j for j in jobs if j.get('id') != job_id]
                else:
                    return jsonify({"status": "error", "message": f"Unknown action: {action}"}), 400
                
                with open(json_path, 'w', encoding='utf-8') as f:
                    json.dump(jobs, f, indent=4)
                    
                return jsonify({"status": "success", "jobs": jobs})
            except Exception as e:
                print(f"Error in api_jobs POST: {e}")
                return jsonify({"status": "error", "message": str(e)}), 500

    @app.route("/admin/api/applicants", methods=["GET", "POST"])
    def api_applicants():
        if not session.get('admin_logged_in'):
            return jsonify({"status": "error", "message": "Unauthorized"}), 401
            
        try:
            from core.db import get_db_connection
            conn = get_db_connection()
            if conn:
                cursor = conn.cursor(dictionary=True)
                
                if request.method == "GET":
                    try:
                        cursor.execute("SELECT * FROM join_staff ORDER BY created_at DESC")
                        applicants = cursor.fetchall()
                        for a in applicants:
                            if 'created_at' in a and a['created_at']:
                                a['created_at'] = a['created_at'].strftime('%Y-%m-%d')
                        return jsonify(applicants)
                    except mysql.connector.Error as err:
                        if err.errno == 1146: # Table doesn't exist
                            return jsonify([])
                        raise
                        
                elif request.method == "POST":
                    data = request.json
                    applicant_id = data.get('id')
                    new_status = data.get('status')
                    if applicant_id and new_status:
                        cursor.execute("UPDATE join_staff SET status = %s WHERE id = %s", (new_status, applicant_id))
                        conn.commit()
                        return jsonify({"status": "success"})
                    return jsonify({"status": "error", "message": "Missing parameters"}), 400
                    
                cursor.close()
                conn.close()
        except Exception as e:
            print(f"Error handling applicants API: {e}")
            return jsonify({"status": "error", "message": str(e)}), 500
            
        return jsonify({"status": "error", "message": "Database error"}), 500

    @app.route("/admin/api/schedule_interview", methods=["POST"])
    def api_schedule_interview():
        if not session.get('admin_logged_in'):
            return jsonify({"status": "error", "message": "Unauthorized"}), 401
            
        data = request.json
        if not data:
            return jsonify({"status": "error", "message": "Missing request data"}), 400
            
        applicant_id = data.get('id')
        name = data.get('name')
        email = data.get('email')
        job_title = data.get('jobTitle')
        i_type = data.get('type')
        date = data.get('date')
        time = data.get('time')
        link_or_address = data.get('link_or_address')
        message = data.get('message')
        
        if not all([applicant_id, email, i_type, date, time]):
            return jsonify({"status": "error", "message": "Missing required fields"}), 400
            
        try:
            from core.db import get_db_connection
            conn = get_db_connection()
            if conn:
                cursor = conn.cursor()
                cursor.execute("UPDATE join_staff SET status = 'interview' WHERE id = %s", (applicant_id,))
                conn.commit()
                cursor.close()
                conn.close()
                
                # Send Email
                from core.email_sender import send_email_async
                html_body = render_template('email/interview_invite.html', 
                                            name=name, 
                                            job_title=job_title, 
                                            type=i_type, 
                                            date=date, 
                                            time=time, 
                                            link_or_address=link_or_address, 
                                            message=message)
                
                subject = f"Interview Invitation: {job_title} at Gram Tarakki Foundation"
                send_email_async(email, html_body, subject=subject)
                
                return jsonify({"status": "success"})
        except Exception as e:
            print(f"Error scheduling interview: {e}")
            return jsonify({"status": "error", "message": str(e)}), 500
            
        return jsonify({"status": "error", "message": "Database error"}), 500

    @app.route("/admin/job-management")
    def job_management():
        if not session.get('admin_logged_in'):
            return redirect(url_for('login'))
        return render_template('admin/job_manage.html')

    @app.route("/admin/our-team")
    def our_team():
        if not session.get('admin_logged_in'):
            return redirect(url_for('login'))
        return render_template('admin/team.html')

    @app.route("/logout")
    def logout():
        session.clear()
        return redirect(url_for('login'))
