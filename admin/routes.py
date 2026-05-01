from flask import render_template, request, jsonify, redirect, url_for, session, make_response
import mysql.connector
from admin.login import verify_admin_login

# ==============================================================================
# Initialization
# ==============================================================================
def init_routes(app):
    """
    Initializes all admin-facing routes.
    """

    # ==========================================================================
    # AUTHENTICATION ROUTES
    # Handles admin login and logout functionality
    # ==========================================================================

    @app.route("/login", methods=["GET", "POST"])
    def login():
        """
        Admin Login Page and API.
        GET: Renders login page if not logged in.
        POST: Verifies credentials and sets up session.
        """
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

        # Redirect to dashboard if already logged in
        if session.get('admin_logged_in'):
            return redirect(url_for("dashboard"))

        return render_template('admin/login.html')

    @app.route("/logout")
    def logout():
        """
        Logs out the admin by clearing the session.
        """
        session.clear()
        return redirect(url_for('login'))

    # ==========================================================================
    # DASHBOARD ROUTES
    # Main admin panel views and summaries
    # ==========================================================================

    @app.route("/admin/dashboard")
    def dashboard():
        """
        Admin Dashboard.
        Displays summary metrics (e.g., total volunteers, student requests) and recent activity.
        """
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

        # Disable caching for the dashboard page
        response = make_response(render_template('admin/dashboard.html', 
                                              volunteer_count=volunteer_count, 
                                              join_requests_count=join_student_count,
                                              recent_requests=recent_requests))
        response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
        response.headers['Pragma'] = 'no-cache'
        response.headers['Expires'] = '0'
        return response

    # ==========================================================================
    # STUDENT MANAGEMENT ROUTES
    # Handles listing, adding, and updating student application statuses
    # ==========================================================================

    @app.route("/admin/our-students")
    def our_students():
        """
        Students Management Page.
        Displays active, pending, and rejected students.
        """
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

    @app.route("/admin/add-student", methods=["POST"])
    def add_student():
        """
        API to manually add a new student from the admin dashboard.
        """
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

    @app.route("/admin/update-request-status", methods=["POST"])
    def update_request_status():
        """
        API to update the status of a student joining request (e.g., pending -> active/rejected).
        """
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

    # ==========================================================================
    # JOB & APPLICANT MANAGEMENT ROUTES
    # Handles creating jobs, viewing applicants, and scheduling interviews
    # ==========================================================================

    @app.route("/admin/job-management")
    def job_management():
        """Render the job management page for managing job listings and applicants."""
        if not session.get('admin_logged_in'):
            return redirect(url_for('login'))
        return render_template('admin/job_manage.html')

    @app.route("/admin/api/jobs", methods=["GET", "POST"])
    def api_jobs():
        """
        API for Job Management.
        GET: Returns a list of all jobs from carrier.json.
        POST: Handles creating, updating, changing status, or deleting jobs.
        """
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
                    
                action = data.get('action') # 'create', 'update', 'status', 'delete'
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
                    # Map requirements properly
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
        """
        API for Applicant Management.
        GET: Retrieve a list of all job applicants.
        POST: Update an applicant's status.
        """
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
                    action = data.get('action')
                    
                    if action == 'delete' and applicant_id:
                        cursor.execute("DELETE FROM join_staff WHERE id = %s", (applicant_id,))
                        conn.commit()
                        return jsonify({"status": "success"})
                        
                    new_status = data.get('status')
                    if applicant_id and new_status:
                        cursor.execute("UPDATE join_staff SET status = %s WHERE id = %s", (new_status, applicant_id))
                        if new_status in ['active', 'approved', 'selected']:
                            cursor.execute("SELECT * FROM join_staff WHERE id = %s", (applicant_id,))
                            member = cursor.fetchone()
                            if member:
                                job_type = 'staff'
                                pos = str(member.get('position', ''))
                                import json, os
                                from flask import current_app
                                json_path = os.path.join(current_app.root_path, 'data', 'carrier.json')
                                job_title = pos
                                if os.path.exists(json_path):
                                    with open(json_path, 'r', encoding='utf-8') as f:
                                        try:
                                            jobs = json.load(f)
                                            for j in jobs:
                                                if str(j.get('id', '')) == pos:
                                                    job_title = j.get('title', '')
                                                    # Check the explicit job type from carrier.json
                                                    c_type = j.get('type', '').lower()
                                                    if 'intern' in c_type or 'intern' in job_title.lower():
                                                        job_type = 'internship'
                                                    elif 'volunteer' in c_type or 'volunteer' in job_title.lower():
                                                        job_type = 'volunteer'
                                                    else:
                                                        job_type = 'staff'
                                                    break
                                        except: pass
                                cursor.execute("""
                                    INSERT INTO our_staff (fullname, email, phone, location, linkedin, cover_letter, position, experience, resume, photo, skills, notes, job_type, status)
                                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'active')
                                """, (member.get('fullname'), member.get('email'), member.get('phone'), member.get('location'), member.get('linkedin'), member.get('cover_letter'), member.get('position'), member.get('experience'), member.get('resume'), member.get('photo'), member.get('skills'), member.get('notes'), job_type))
                        
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
        """
        API to schedule an interview with a job applicant.
        Updates their status to 'interview' and sends an invitation email.
        """
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

    # ==========================================================================
    # TEAM MANAGEMENT ROUTES
    # Handles viewing and managing the organization's team members
    # ==========================================================================

    @app.route("/admin/our-team")
    def our_team():
        """Render the team management page."""
        if not session.get('admin_logged_in'):
            return redirect(url_for('login'))
        return render_template('admin/team.html')

    @app.route("/admin/api/team", methods=["GET", "POST"])
    def api_team():
        """
        API for Team Management.
        GET: Retrieves a combined list of volunteers and staff members.
        POST: Updates team member status or removes them.
        """
        if not session.get('admin_logged_in'):
            return jsonify({"status": "error", "message": "Unauthorized"}), 401
            
        try:
            from core.db import get_db_connection
            conn = get_db_connection()
            if not conn:
                return jsonify({"status": "error", "message": "Database error"}), 500

            cursor = conn.cursor(dictionary=True)

            if request.method == "POST":
                # Check for form data vs JSON
                if request.form and request.form.get('action') in ('add_staff', 'edit_staff'):
                    data = request.form
                    action = data.get('action')
                else:
                    data = request.json
                    action = data.get('action') if data else None

                if action == 'add_staff':
                    staff_type = data.get('type')
                    name = data.get('name')
                    email = data.get('email')
                    phone = data.get('phone')
                    address = data.get('address')
                    
                    import os
                    import uuid
                    from werkzeug.utils import secure_filename
                    
                    # Handle Photo
                    photo_path = ""
                    if 'photo' in request.files:
                        file = request.files['photo']
                        if file and file.filename != '':
                            filename = secure_filename(file.filename)
                            ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''
                            if ext in {'jpg', 'jpeg', 'png', 'webp'}:
                                unique_filename = f"{uuid.uuid4().hex}_{filename}"
                                folder_name = 'admin_photo' if staff_type == 'Admin' else 'staff_photo'
                                upload_dir = os.path.join(os.getcwd(), 'upload', folder_name)
                                os.makedirs(upload_dir, exist_ok=True)
                                file.save(os.path.join(upload_dir, unique_filename))
                                photo_path = f"/upload/{folder_name}/{unique_filename}"
                    
                    # Handle Documents
                    resume_path = ""
                    if staff_type != 'Admin' and 'documents' in request.files:
                        file = request.files['documents']
                        if file and file.filename != '':
                            filename = secure_filename(file.filename)
                            ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''
                            if ext in {'pdf', 'doc', 'docx'}:
                                unique_filename = f"{uuid.uuid4().hex}_{filename}"
                                upload_dir = os.path.join(os.getcwd(), 'upload', 'resume')
                                os.makedirs(upload_dir, exist_ok=True)
                                file.save(os.path.join(upload_dir, unique_filename))
                                resume_path = f"/upload/resume/{unique_filename}"

                    if staff_type == 'Admin':
                        password = data.get('password')
                        if not password:
                            return jsonify({"status": "error", "message": "Password is required for Admin"}), 400
                        from argon2 import PasswordHasher
                        ph = PasswordHasher()
                        hashed_password = ph.hash(password)
                        
                        try:
                            # id is auto incremented
                            cursor.execute("INSERT INTO admin (fullname, email, password, phone, address, image) VALUES (%s, %s, %s, %s, %s, %s)", (name, email, hashed_password, phone, address, photo_path))
                            conn.commit()
                            return jsonify({"status": "success"})
                        except Exception as e:
                            print(f"Error adding admin: {e}")
                            if "Duplicate entry" in str(e):
                                return jsonify({"status": "error", "message": "An admin with this email or ID already exists"}), 400
                            return jsonify({"status": "error", "message": str(e)}), 500

                    elif staff_type == 'Volunteer':
                        service_type = data.get('serviceType')
                        availability = data.get('availability')
                        try:
                            cursor.execute("""
                                INSERT INTO our_staff (fullname, email, phone, location, role, availability, job_type, status, photo, resume)
                                VALUES (%s, %s, %s, %s, %s, %s, 'volunteer', 'active', %s, %s)
                            """, (name, email, phone, address, service_type, availability, photo_path, resume_path))
                            conn.commit()
                            return jsonify({"status": "success"})
                        except Exception as e:
                            print(f"Error adding volunteer: {e}")
                            return jsonify({"status": "error", "message": str(e)}), 500

                    elif staff_type == 'Other Staff':
                        role_of_staff = data.get('roleOfStaff')
                        try:
                            cursor.execute("""
                                INSERT INTO our_staff (fullname, email, phone, location, role, job_type, status, photo, resume)
                                VALUES (%s, %s, %s, %s, %s, 'staff', 'active', %s, %s)
                            """, (name, email, phone, address, role_of_staff, photo_path, resume_path))
                            conn.commit()
                            return jsonify({"status": "success"})
                        except Exception as e:
                            print(f"Error adding other staff: {e}")
                            return jsonify({"status": "error", "message": str(e)}), 500

                    return jsonify({"status": "error", "message": "Invalid type"}), 400

                elif action == 'edit_staff':
                    edit_id = data.get('id')
                    edit_source = data.get('source')
                    edit_name = data.get('name', '').strip()
                    edit_phone = data.get('phone', '').strip()
                    edit_role = data.get('role', '').strip()
                    edit_status = data.get('status', '').strip()
                    edit_address = data.get('address', '').strip()

                    if not edit_id or not edit_source or not edit_name:
                        return jsonify({"status": "error", "message": "Missing required fields"}), 400

                    import os, uuid
                    from werkzeug.utils import secure_filename

                    # Handle optional photo upload
                    photo_path = None
                    if 'photo' in request.files:
                        file = request.files['photo']
                        if file and file.filename != '':
                            filename = secure_filename(file.filename)
                            ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''
                            if ext in {'jpg', 'jpeg', 'png', 'webp'}:
                                unique_filename = f"{uuid.uuid4().hex}_{filename}"
                                folder_name = 'admin_photo' if edit_source == 'admin' else 'staff_photo'
                                upload_dir = os.path.join(os.getcwd(), 'upload', folder_name)
                                os.makedirs(upload_dir, exist_ok=True)
                                file.save(os.path.join(upload_dir, unique_filename))
                                photo_path = f"/upload/{folder_name}/{unique_filename}"

                    try:
                        if edit_source == 'admin':
                            if photo_path:
                                cursor.execute("UPDATE admin SET fullname = %s, phone = %s, address = %s, image = %s WHERE id = %s",
                                    (edit_name, edit_phone, edit_address, photo_path, edit_id))
                            else:
                                cursor.execute("UPDATE admin SET fullname = %s, phone = %s, address = %s WHERE id = %s",
                                    (edit_name, edit_phone, edit_address, edit_id))
                        elif edit_source == 'our_staff':
                            if photo_path:
                                cursor.execute("UPDATE our_staff SET fullname = %s, phone = %s, location = %s, role = %s, status = %s, photo = %s WHERE id = %s",
                                    (edit_name, edit_phone, edit_address, edit_role, edit_status, photo_path, edit_id))
                            else:
                                cursor.execute("UPDATE our_staff SET fullname = %s, phone = %s, location = %s, role = %s, status = %s WHERE id = %s",
                                    (edit_name, edit_phone, edit_address, edit_role, edit_status, edit_id))
                        elif edit_source == 'volunteer':
                            if photo_path:
                                cursor.execute("UPDATE join_volunteer SET fullname = %s, phone = %s, city = %s, role = %s, status = %s, profile_photo = %s WHERE id = %s",
                                    (edit_name, edit_phone, edit_address, edit_role, edit_status, photo_path, edit_id))
                            else:
                                cursor.execute("UPDATE join_volunteer SET fullname = %s, phone = %s, city = %s, role = %s, status = %s WHERE id = %s",
                                    (edit_name, edit_phone, edit_address, edit_role, edit_status, edit_id))
                        else:
                            return jsonify({"status": "error", "message": "Unknown source"}), 400

                        conn.commit()
                        return jsonify({"status": "success"})
                    except Exception as e:
                        print(f"Error editing staff: {e}")
                        return jsonify({"status": "error", "message": str(e)}), 500

                # Existing logic for update_status or remove
                member_id = data.get('id') if data else None
                source = data.get('source') if data else None
                new_status = data.get('status') if data else None

                if not member_id or not source:
                    cursor.close()
                    conn.close()
                    return jsonify({"status": "error", "message": "Missing parameters"}), 400

                table = 'our_staff' if source == 'our_staff' else ('join_volunteer' if source == 'volunteer' else 'join_staff')

                if action == 'remove':
                    cursor.execute(f"DELETE FROM {table} WHERE id = %s", (member_id,))
                else:
                    if not new_status:
                        cursor.close()
                        conn.close()
                        return jsonify({"status": "error", "message": "Missing status"}), 400
                    
                    # Update status in the current table
                    cursor.execute(f"UPDATE {table} SET status = %s WHERE id = %s", (new_status, member_id))

                    # If approving a pending member from join_volunteer or join_staff, copy to our_staff
                    if new_status in ['active', 'approved', 'selected'] and source != 'our_staff':
                        cursor.execute(f"SELECT * FROM {table} WHERE id = %s", (member_id,))
                        member = cursor.fetchone()
                        if member:
                            if source == 'volunteer':
                                job_type = 'volunteer'
                                role_lower = str(member.get('role', '')).lower()
                                if 'intern' in role_lower:
                                    job_type = 'internship'
                                cursor.execute("""
                                    INSERT INTO our_staff (fullname, email, phone, city, age, role, skills, availability, resume, photo, job_type, status)
                                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'active')
                                """, (member.get('fullname'), member.get('email'), member.get('phone'), member.get('city'), member.get('age'), member.get('role'), member.get('skills'), member.get('availability'), member.get('resume_path'), member.get('profile_photo'), job_type))
                            elif source == 'staff':
                                job_type = 'staff'
                                pos = str(member.get('position', ''))
                                import json, os
                                from flask import current_app
                                json_path = os.path.join(current_app.root_path, 'data', 'carrier.json')
                                job_title = pos
                                if os.path.exists(json_path):
                                    with open(json_path, 'r', encoding='utf-8') as f:
                                        try:
                                            jobs = json.load(f)
                                            for j in jobs:
                                                if str(j.get('id', '')) == pos:
                                                    job_title = j.get('title', '')
                                                    # Check the explicit job type from carrier.json
                                                    c_type = j.get('type', '').lower()
                                                    if 'intern' in c_type or 'intern' in job_title.lower():
                                                        job_type = 'internship'
                                                    elif 'volunteer' in c_type or 'volunteer' in job_title.lower():
                                                        job_type = 'volunteer'
                                                    else:
                                                        job_type = 'staff'
                                                    break
                                        except: pass
                                cursor.execute("""
                                    INSERT INTO our_staff (fullname, email, phone, location, linkedin, cover_letter, position, experience, resume, photo, skills, notes, job_type, status)
                                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'active')
                                """, (member.get('fullname'), member.get('email'), member.get('phone'), member.get('location'), member.get('linkedin'), member.get('cover_letter'), member.get('position'), member.get('experience'), member.get('resume'), member.get('photo'), member.get('skills'), member.get('notes'), job_type))

                conn.commit()
                cursor.close()
                conn.close()
                return jsonify({"status": "success"})
                
            # GET request - fetch all team data
            team = []
            
            import json, os
            from flask import current_app
            json_path = os.path.join(current_app.root_path, 'data', 'carrier.json')
            job_map = {}
            if os.path.exists(json_path):
                with open(json_path, 'r', encoding='utf-8') as f:
                    try:
                        jobs = json.load(f)
                        job_map = {str(j.get('id', '')): j.get('title', '') for j in jobs}
                    except json.JSONDecodeError:
                        pass
            
            # Fetch from join_volunteer (only pending)
            try:
                cursor.execute("SELECT id, fullname as name, email, phone, city as address, role, profile_photo as photo, status, created_at as appliedDate, resume_path FROM join_volunteer WHERE status = 'pending'")
                volunteers = cursor.fetchall()
                for v in volunteers:
                    v['source'] = 'volunteer'
                    v['photo'] = v['photo'] or 'https://ui-avatars.com/api/?name=' + v['name'].replace(' ', '+')
                    v['appliedDate'] = v['appliedDate'].strftime('%Y-%m-%d') if v.get('appliedDate') else ''
                    v['documents'] = []
                    if v.get('resume_path'):
                        v['documents'].append('Resume')
                    team.append(v)
            except mysql.connector.Error as err:
                if err.errno != 1146: # ignore if table doesn't exist
                    print(f"Error fetching join_volunteer: {err}")
                    
            # removed join_staff fetch for team page

            # Fetch from our_staff
            try:
                cursor.execute("SELECT id, fullname as name, email, phone, COALESCE(location, city) as address, COALESCE(role, position) as role, photo, status, created_at as appliedDate, resume, job_type FROM our_staff")
                our_staff = cursor.fetchall()
                
                for o in our_staff:
                    o['source'] = 'our_staff'
                    o['photo'] = o['photo'] or 'https://ui-avatars.com/api/?name=' + o['name'].replace(' ', '+')
                    o['appliedDate'] = o['appliedDate'].strftime('%Y-%m-%d') if o.get('appliedDate') else ''
                    o['documents'] = []
                    if o.get('resume'):
                        o['documents'].append('Resume')
                    role_id = str(o.get('role', ''))
                    o['role'] = job_map.get(role_id, o['role'])
                    o['job_type'] = o.get('job_type', 'staff')
                    team.append(o)
            except mysql.connector.Error as err:
                if err.errno != 1146:
                    print(f"Error fetching our_staff: {err}")
            
            # Fetch from admin
            try:
                cursor.execute("SELECT id, fullname as name, email, phone, address, image as photo, created_at as appliedDate FROM admin")
                admins = cursor.fetchall()
                for a in admins:
                    a['source'] = 'admin'
                    a['photo'] = a['photo'] or 'https://ui-avatars.com/api/?name=' + str(a.get('name', 'Admin') or 'Admin').replace(' ', '+')
                    a['appliedDate'] = a['appliedDate'].strftime('%Y-%m-%d') if a.get('appliedDate') else ''
                    a['documents'] = []
                    a['role'] = 'Admin'
                    a['job_type'] = 'staff'
                    a['status'] = 'active' # admin is always considered active
                    team.append(a)
            except mysql.connector.Error as err:
                if err.errno != 1146:
                    print(f"Error fetching admin: {err}")

            cursor.close()
            conn.close()
            return jsonify({"status": "success", "team": team})
        except Exception as e:
            print(f"Error in team API: {e}")
            return jsonify({"status": "error", "message": str(e)}), 500
