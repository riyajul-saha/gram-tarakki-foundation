import os
import uuid
import re
from datetime import datetime
from flask import render_template, request, jsonify, send_file, abort
from werkzeug.utils import secure_filename
from core.email_sender import send_email_async
from core.db import get_db_connection, init_db
import mysql.connector

# ==============================================================================
# Initialization
# ==============================================================================
def init_routes(app):
    """
    Initializes all core application routes.
    """

    # ==========================================================================
    # PUBLIC PAGE ROUTES
    # Routes for rendering static/informational pages
    # ==========================================================================
    
    @app.route("/")
    def home():
        """Render the home page."""
        return render_template('index.html')

    @app.route("/about")
    def about():
        """Render the about us page."""
        return render_template('about.html')

    @app.route("/programs")
    def programs():
        """Render the main programs page."""
        return render_template('programs.html')

    @app.route("/gallery")
    def gallery():
        """Render the gallery page."""
        return render_template('gallery.html')

    @app.route("/volunteer")
    def volunteer():
        """Render the volunteer information page."""
        return render_template('volunteer.html')

    @app.route("/partners")
    def partners():
        """Render the partners information page."""
        return render_template('partners.html')

    # ==========================================================================
    # PROGRAM SPECIFIC ROUTES
    # Routes for individual program details
    # ==========================================================================

    @app.route("/karate")
    def karate():
        """Render the Karate program page."""
        return render_template('programs/programs-karate.html')

    @app.route("/yoga")
    def yoga():
        """Render the Yoga program page."""
        return render_template('programs/programs-yoga.html')

    @app.route("/internship")
    def internship():
        """Render the Internship program page."""
        return render_template('programs/programs-internship.html')

    # ==========================================================================
    # REGISTRATION AND JOINING ROUTES
    # Handling form submissions for students, volunteers, and partners
    # ==========================================================================

    @app.route("/join", methods=["GET", "POST"])
    def join():
        """
        Handle student enrollment requests.
        GET: Renders the join form.
        POST: Processes the form submission, saves to database, and sends confirmation email.
        """
        if request.method == "POST":
            # Extract form data
            fullname = request.form.get("fullname")
            email = request.form.get("email")
            age = request.form.get("age")
            gender = request.form.get("gender")
            school = request.form.get("school")
            parent_name = request.form.get("parentName")
            parent_contact = request.form.get("parentContact")
            phone = request.form.get("phone")
            address = request.form.get("address")
            
            # Combine multiple program selections into a comma-separated string
            programs_list = request.form.getlist("program")
            program = ", ".join(programs_list) if programs_list else ""
            
            experience = request.form.get("experience")
            medical = request.form.get("medical")

            # Handle student image upload
            image_path = ""
            if 'image' in request.files:
                file = request.files['image']
                if file and file.filename != '':
                    filename = secure_filename(file.filename)
                    # Validate file extension
                    allowed_ext = {'jpg', 'jpeg', 'png', 'webp'}
                    ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''
                    if ext in allowed_ext:
                        unique_filename = f"{uuid.uuid4().hex}_{filename}"
                        os.makedirs(app.config['STUDENT_IMAGE_FOLDER'], exist_ok=True)
                        file_path = os.path.join(app.config['STUDENT_IMAGE_FOLDER'], unique_filename)
                        file.save(file_path)
                        image_path = f"/upload/student_image/{unique_filename}"

            # Helper to replace empty strings with "NaN" as expected by the DB schema
            def validate_opt(val):
                return val if (val and val.strip() != "") else "NaN"

            try:
                # Database connection
                conn = get_db_connection()
                if not conn:
                    init_db()  # Try to initialize if connection fails
                    conn = get_db_connection()
                    if not conn:
                        return jsonify({"status": "error", "message": "Database connection failed"}), 500

                cursor = conn.cursor()

                try:
                    # Check if student already exists
                    cursor.execute("SELECT id FROM join_student WHERE fullname = %s AND email = %s", (fullname, email))
                except mysql.connector.Error as err:
                    if err.errno == 1146: # Table doesn't exist
                        init_db()
                        # Get a fresh connection after initialization
                        cursor.close()
                        conn.close()
                        conn = get_db_connection()
                        if not conn:
                            return jsonify({"status": "error", "message": "Database connection failed after init"}), 500
                        cursor = conn.cursor()
                        cursor.execute("SELECT id FROM join_student WHERE fullname = %s AND email = %s", (fullname, email))
                    else:
                        raise

                if cursor.fetchone():
                    cursor.close()
                    conn.close()
                    return jsonify({"status": "exists", "message": "You already joined, for any help contact us"})

                # Insert new student record
                cursor.execute("""
                    INSERT INTO join_student (fullname, email, age, gender, school, parent_name, parent_contact, phone, address, program, experience, medical, image, status)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'pending')
                """, (
                    fullname, email, int(age) if age else None, gender,
                    validate_opt(school), validate_opt(parent_name), validate_opt(parent_contact),
                    validate_opt(phone), address, program, experience, validate_opt(medical),
                    image_path if image_path else None
                ))
                conn.commit()
                cursor.close()
                conn.close()

                # Send confirmation email
                if email:
                    try:
                        current_date = datetime.now().strftime("%d %B %Y")
                        if current_date.startswith("0"):
                            current_date = current_date[1:]

                        html_body = render_template('emails/student_join_mail.html', 
                                                    fullname=fullname, 
                                                    program=program, 
                                                    date=current_date)

                        send_email_async(email, html_body)
                    except Exception as e:
                        print(f"Failed to prepare or send confirmation email: {e}")

                return jsonify({"status": "success"})
            except Exception as e:
                print(f"Error handling join request: {e}")
                return jsonify({"status": "error", "message": "Failed to submit. Please try again later."}), 500

        # Render the join page on GET
        return render_template('join.html')

    @app.route("/volunteer_join", methods=["POST"])
    def volunteer_join():
        """
        Handle volunteer registration form submissions.
        """
        # Extract form data
        fullname = request.form.get("fullname")
        email = request.form.get("email")
        phone = request.form.get("phone")
        city = request.form.get("city")
        age = request.form.get("age")
        role = request.form.get("role")
        skills = request.form.get("skills")
        availability = request.form.get("availability")

        # Handle resume file upload
        resume_path = ""
        if 'resume' in request.files:
            file = request.files['resume']
            if file and file.filename != '':
                filename = secure_filename(file.filename)
                unique_filename = f"{uuid.uuid4().hex}_{filename}"
                os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
                file_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
                file.save(file_path)
                resume_path = f"/upload/resume/{unique_filename}"

        # Handle profile photo upload
        profile_photo_path = ""
        if 'profile_photo' in request.files:
            file = request.files['profile_photo']
            if file and file.filename != '':
                filename = secure_filename(file.filename)
                unique_filename = f"{uuid.uuid4().hex}_{filename}"
                volunteer_upload_dir = os.path.join(os.getcwd(), 'upload', 'voluteer')
                os.makedirs(volunteer_upload_dir, exist_ok=True)
                file_path = os.path.join(volunteer_upload_dir, unique_filename)
                file.save(file_path)
                profile_photo_path = f"/upload/voluteer/{unique_filename}"

        try:
            # Database connection
            conn = get_db_connection()
            if not conn:
                init_db()  # Try to initialize if connection fails
                conn = get_db_connection()
                if not conn:
                    return jsonify({"status": "error", "message": "Database connection failed"}), 500

            cursor = conn.cursor()

            try:
                # Ensure the table exists
                cursor.execute("SELECT id FROM join_volunteer WHERE email = %s", (email,))
                cursor.fetchall()
            except mysql.connector.Error as err:
                if err.errno == 1146: # Table doesn't exist
                    init_db()
                    cursor.close()
                    conn.close()
                    conn = get_db_connection()
                    if not conn:
                        return jsonify({"status": "error", "message": "Database connection failed after init"}), 500
                    cursor = conn.cursor()
                else:
                    raise

            # Insert new volunteer record
            cursor.execute("""
                INSERT INTO join_volunteer (fullname, email, phone, city, age, role, skills, availability, resume_path, profile_photo, status)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'pending')
            """, (
                fullname, email, phone, city,
                int(age) if age and str(age).strip() else None,
                role, skills, availability, resume_path, profile_photo_path
            ))
            conn.commit()
            cursor.close()
            conn.close()

            # Send confirmation email
            if email:
                try:
                    html_body = render_template('emails/email_to_volunteer.html', 
                                                fullname=fullname, 
                                                email=email,
                                                skills=skills,
                                                role=role)

                    send_email_async(email, html_body)
                except Exception as e:
                    print(f"Failed to prepare or send confirmation email: {e}")

            return jsonify({"status": "success", "message": "Your application has been submitted successfully. We will contact you soon."})
        except Exception as e:
            print(f"Error handling volunteer join request: {e}")
            return jsonify({"status": "error", "message": "Failed to submit. Please try again later."}), 500

    @app.route("/partner_join", methods=["POST"])
    def partner_join():
        """
        Handle partnership inquiries form submissions.
        """
        # Extract form data
        org_name = request.form.get("orgName")
        contact_person = request.form.get("contactPerson")
        email = request.form.get("email")
        phone = request.form.get("phone")
        city = request.form.get("city")
        partner_type = request.form.get("partnerType")
        
        # Handle "Other" partner type
        other_type = request.form.get("otherType")
        if partner_type == "Other" and other_type:
            partner_type = other_type

        support_type = request.form.get("supportType", "")
        message_content = request.form.get("message", "")

        # Handle partner logo upload
        logo_path = ""
        if 'logoUpload' in request.files:
            file = request.files['logoUpload']
            if file and file.filename != '':
                filename = secure_filename(file.filename)
                unique_filename = f"{uuid.uuid4().hex}_{filename}"
                os.makedirs(app.config['PARTNER_LOGO_FOLDER'], exist_ok=True)
                file_path = os.path.join(app.config['PARTNER_LOGO_FOLDER'], unique_filename)
                file.save(file_path)
                logo_path = f"/upload/partner_logo/{unique_filename}"

        try:
            # Database connection
            conn = get_db_connection()
            if not conn:
                init_db()
                conn = get_db_connection()
                if not conn:
                    return jsonify({"status": "error", "message": "Database connection failed"}), 500

            cursor = conn.cursor()

            try:
                # Ensure the table exists
                cursor.execute("SELECT id FROM join_partner LIMIT 1")
                cursor.fetchall()
            except mysql.connector.Error as err:
                if err.errno == 1146: # Table doesn't exist
                    init_db()
                    cursor.close()
                    conn.close()
                    conn = get_db_connection()
                    if not conn:
                        return jsonify({"status": "error", "message": "Database connection failed after init"}), 500
                    cursor = conn.cursor()
                else:
                    raise

            # Insert new partner record
            cursor.execute("""
                INSERT INTO join_partner (org_name, contact_person, email, phone, city, partner_type, support_type, message, logo_path, status)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, 'pending')
            """, (
                org_name, contact_person, email, phone, city,
                partner_type, support_type, message_content, logo_path
            ))
            conn.commit()
            cursor.close()
            conn.close()

            # Note: Confirmation email could be added here in the future

            return jsonify({"status": "success", "message": "Your partnership application has been submitted successfully. We will contact you soon."})
        except Exception as e:
            print(f"Error handling partnership request: {e}")
            return jsonify({"status": "error", "message": "Failed to submit. Please try again later."}), 500

    # ==========================================================================
    # CAREER AND JOB APPLICATION ROUTES
    # Handling job listings and applications
    # ==========================================================================

    @app.route("/carrier")
    def carrier():
        """Render the career page displaying available jobs."""
        return render_template('carrier.html')

    @app.route("/apply-job", methods=["POST"])
    def apply_job():
        """
        Handle job applications submitted from the career portal.
        """
        # Helper to sanitize inputs and prevent XSS
        def sanitize(text):
            if not text:
                return text
            text = re.sub(r'<[^>]*>', '', text)
            text = re.sub(r'(?i)(<script>|javascript:|onerror=|onload=)', '', text)
            return text.strip()

        # Extract and sanitize form data
        job_id = request.form.get("jobId")
        fullname = sanitize(request.form.get("fullname"))
        email = sanitize(request.form.get("email"))
        phone = sanitize(request.form.get("phone"))
        location = sanitize(request.form.get("location"))
        linkedin = sanitize(request.form.get("linkedin"))
        cover_letter = sanitize(request.form.get("cover_letter"))
        skills = sanitize(request.form.get("skills"))
        
        # Parse experience as integer
        experience_raw = request.form.get("experience", "0")
        try:
            experience = int(experience_raw)
            if experience < 0:
                experience = 0
        except (ValueError, TypeError):
            experience = 0

        # Validate required fields
        if not fullname or not email or not phone or not job_id:
            return jsonify({"status": "error", "message": "Missing required fields"}), 400

        # Handle resume upload (required)
        resume_path = ""
        if 'resume' in request.files:
            file = request.files['resume']
            if file and file.filename != '':
                filename = secure_filename(file.filename)
                unique_filename = f"{uuid.uuid4().hex}_{filename}"
                resume_upload_dir = os.path.join(os.getcwd(), 'upload', 'resume')
                os.makedirs(resume_upload_dir, exist_ok=True)
                file_path = os.path.join(resume_upload_dir, unique_filename)
                file.save(file_path)
                resume_path = f"/upload/resume/{unique_filename}"
        else:
            return jsonify({"status": "error", "message": "Resume is required"}), 400

        # Handle applicant photo upload (optional)
        photo_path = ""
        if 'photo' in request.files:
            file = request.files['photo']
            if file and file.filename != '':
                filename = secure_filename(file.filename)
                allowed_ext = {'jpg', 'jpeg', 'png', 'webp'}
                ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''
                if ext in allowed_ext:
                    unique_filename = f"{uuid.uuid4().hex}_{filename}"
                    photo_upload_dir = os.path.join(os.getcwd(), 'upload', 'staff_photo')
                    os.makedirs(photo_upload_dir, exist_ok=True)
                    file_path = os.path.join(photo_upload_dir, unique_filename)
                    file.save(file_path)
                    photo_path = f"/upload/staff_photo/{unique_filename}"

        try:
            # Database connection
            conn = get_db_connection()
            if not conn:
                init_db()
                conn = get_db_connection()
                if not conn:
                    return jsonify({"status": "error", "message": "Database error"}), 500

            cursor = conn.cursor()

            try:
                # Ensure the table exists
                cursor.execute("SELECT id FROM join_staff LIMIT 1")
                cursor.fetchall()
            except mysql.connector.Error as err:
                if err.errno == 1146: # Table doesn't exist
                    init_db()
                    cursor.close()
                    conn.close()
                    conn = get_db_connection()
                    if not conn:
                        return jsonify({"status": "error", "message": "Database error after init"}), 500
                    cursor = conn.cursor()
                else:
                    raise

            # Insert application record
            cursor.execute("""
                INSERT INTO join_staff (fullname, email, phone, location, linkedin, cover_letter, position, resume, photo, experience, skills, status)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'applied')
            """, (fullname, email, phone, location, linkedin, cover_letter, job_id, resume_path, photo_path, str(experience), skills))
            
            conn.commit()
            cursor.close()
            conn.close()

            return jsonify({"status": "success", "message": "Application submitted"})
        except Exception as e:
            print(f"Error handling job application: {e}")
            return jsonify({"status": "error", "message": "Failed to submit application"}), 500

    # ==========================================================================
    # DONATION ROUTES
    # Handling donation form UI and payment APIs
    # ==========================================================================

    @app.route("/donate")
    def donate():
        """Render the donation page."""
        return render_template('donate.html')

    @app.route("/api/donate/initiate", methods=["POST"])
    def initiate_donation():
        """
        Initiate a donation transaction.
        Creates a pending record in the database.
        """
        data = request.json
        if not data:
            return jsonify({"status": "error", "message": "No data provided"}), 400
            
        # Extract donation data
        fullname = data.get("fullname")
        email = data.get("email")
        phone = data.get("phone")
        city = data.get("city", "")
        pan = data.get("pan", "")
        message = data.get("message", "")
        amount = data.get("amount")
        payment_method = data.get("paymentMethod")
        
        # Validate required fields
        if not all([fullname, email, phone, amount, payment_method]):
            return jsonify({"status": "error", "message": "Missing required fields"}), 400
            
        try:
            # Database connection
            conn = get_db_connection()
            if not conn:
                init_db()
                conn = get_db_connection()
                if not conn:
                    return jsonify({"status": "error", "message": "Database error"}), 500
                    
            cursor = conn.cursor()
            
            # Ensure the table exists
            try:
                cursor.execute("SELECT id FROM donate LIMIT 1")
                cursor.fetchall()
            except mysql.connector.Error as err:
                if err.errno == 1146: # Table doesn't exist
                    init_db()
                    cursor.close()
                    conn.close()
                    conn = get_db_connection()
                    cursor = conn.cursor()
                else:
                    raise
            
            # Check for existing pending donation to avoid duplicates
            cursor.execute("""
                SELECT id FROM donate WHERE email = %s AND phone = %s AND amount = %s AND status = 'pending'
            """, (email, phone, amount))
            existing = cursor.fetchone()
            
            if existing:
                donation_id = existing[0]
            else:
                # Create new pending donation record
                cursor.execute("""
                    INSERT INTO donate (fullname, email, phone, city, pan, message, amount, payment_method, status)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'pending')
                """, (fullname, email, phone, city, pan, message, amount, payment_method))
                donation_id = cursor.lastrowid
                conn.commit()
                
            cursor.close()
            conn.close()
            
            return jsonify({"status": "success", "donation_id": donation_id})
            
        except Exception as e:
            print(f"Error initiating donation: {e}")
            return jsonify({"status": "error", "message": "Failed to initiate donation"}), 500

    @app.route("/api/donate/verify", methods=["POST"])
    def verify_donation():
        """
        Verify and complete a donation transaction.
        Updates the transaction status in the database.
        """
        data = request.json
        donation_id = data.get("donation_id")
        status = data.get("status")
        transaction_id = data.get("transaction_id", "")
        
        # Validate required fields
        if not donation_id or not status:
            return jsonify({"status": "error", "message": "Missing required fields"}), 400
            
        try:
            # Database connection
            conn = get_db_connection()
            if not conn:
                return jsonify({"status": "error", "message": "Database error"}), 500
                
            cursor = conn.cursor()
            
            # Update the donation status
            cursor.execute("""
                UPDATE donate SET status = %s, transaction_id = %s WHERE id = %s
            """, (status, transaction_id, donation_id))
            
            conn.commit()
            cursor.close()
            conn.close()
            
            return jsonify({"status": "success", "message": "Donation verified"})
            
        except Exception as e:
            print(f"Error verifying donation: {e}")
            return jsonify({"status": "error", "message": "Failed to verify donation"}), 500

    # ==========================================================================
    # UTILITY ROUTES
    # ==========================================================================

    @app.route("/api/data/<filename>")
    def serve_data_file(filename):
        """
        Serve JSON data files from the root data/ folder securely.
        (Ensures files are not publicly accessible via /static)
        """
        ALLOWED_FILES = {'carrier.json', 'program_info.json'}
        if filename not in ALLOWED_FILES:
            abort(404)
            
        file_path = os.path.join(app.root_path, 'data', filename)
        if not os.path.exists(file_path):
            abort(404)
            
        return send_file(file_path, mimetype='application/json')
