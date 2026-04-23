import os
import uuid
from datetime import datetime
from flask import render_template, request, jsonify
from werkzeug.utils import secure_filename
from core.email_sender import send_email_async
from core.db import get_db_connection, init_db
import mysql.connector

def init_routes(app):
    @app.route("/")
    def home():
      return render_template('index.html')

    @app.route("/about")
    def about():
      return render_template('about.html')

    @app.route("/programs")
    def programs():
      return render_template('programs.html')

    @app.route("/join", methods=["GET", "POST"])
    def join():
      if request.method == "POST":
        fullname = request.form.get("fullname")
        email = request.form.get("email")
        age = request.form.get("age")
        gender = request.form.get("gender")
        school = request.form.get("school")
        parent_name = request.form.get("parentName")
        parent_contact = request.form.get("parentContact")
        phone = request.form.get("phone")
        address = request.form.get("address")
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
                # Validate extension
                allowed_ext = {'jpg', 'jpeg', 'png', 'webp'}
                ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''
                if ext in allowed_ext:
                    unique_filename = f"{uuid.uuid4().hex}_{filename}"
                    file_path = os.path.join(app.config['STUDENT_IMAGE_FOLDER'], unique_filename)
                    file.save(file_path)
                    image_path = f"/upload/student_image/{unique_filename}"

        def validate_opt(val):
            return val if (val and val.strip() != "") else "NaN"

        try:
            conn = get_db_connection()
            if not conn:
                init_db()  # Try to initialize if connection fails
                conn = get_db_connection()
                if not conn:
                    return jsonify({"status": "error", "message": "Database connection failed"}), 500

            cursor = conn.cursor()

            try:
                # Check if exists
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

            # Insert (save optional fields as NaN if they are empty string / None in Python, but DB schema expects string)
            # We will save string "NaN" for optional empty values as requested by user.
            cursor.execute("""
                INSERT INTO join_student (fullname, email, age, gender, school, parent_name, parent_contact, phone, address, program, experience, medical, image, status)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'pending')
            """, (
                fullname,
                email,
                int(age) if age else None,
                gender,
                validate_opt(school),
                validate_opt(parent_name),
                validate_opt(parent_contact),
                validate_opt(phone),
                address,
                program,
                experience,
                validate_opt(medical),
                image_path if image_path else None
            ))
            conn.commit()
            cursor.close()
            conn.close()

            # Send confirmation email synchronously
            if email:
                try:
                    current_date = datetime.now().strftime("%d %B %Y")
                    if current_date.startswith("0"):
                        current_date = current_date[1:]

                    html_body = render_template('emails/student_join_mail.html', 
                                                fullname=fullname, 
                                                program=program, 
                                                date=current_date)

                    send_email_sync(email, html_body)
                except Exception as e:
                    print(f"Failed to prepare or send confirmation email: {e}")

            return jsonify({"status": "success"})
        except Exception as e:
            print(f"Error handling join request: {e}")
            return jsonify({"status": "error", "message": "Failed to submit. Please try again later."}), 500

      return render_template('join.html')

    @app.route("/volunteer_join", methods=["POST"])
    def volunteer_join():
        fullname = request.form.get("fullname")
        email = request.form.get("email")
        phone = request.form.get("phone")
        city = request.form.get("city")
        age = request.form.get("age")
        role = request.form.get("role")
        skills = request.form.get("skills")
        availability = request.form.get("availability")

        resume_path = ""
        # Handle file upload
        if 'resume' in request.files:
            file = request.files['resume']
            if file and file.filename != '':
                filename = secure_filename(file.filename)
                unique_filename = f"{uuid.uuid4().hex}_{filename}"
                file_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
                file.save(file_path)
                # Store relative path for DB
                resume_path = f"/upload/resume/{unique_filename}"

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
            conn = get_db_connection()
            if not conn:
                init_db()  # Try to initialize if connection fails
                conn = get_db_connection()
                if not conn:
                    return jsonify({"status": "error", "message": "Database connection failed"}), 500

            cursor = conn.cursor()

            try:
                # Check if joining with same email already exists in volunteers
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
                    cursor.execute("SELECT id FROM join_volunteer WHERE email = %s", (email,))
                    cursor.fetchall()
                else:
                    raise

            # We can allow multiple registrations with same email or restrict. Here we allow or just check if same email + role
            # Let's say we don't block them entirely unless they submitted recently. For now no blockage block since user didn't ask.
            # It's better to just insert it.

            cursor.execute("""
                INSERT INTO join_volunteer (fullname, email, phone, city, age, role, skills, availability, resume_path, profile_photo, status)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'pending')
            """, (
                fullname,
                email,
                phone,
                city,
                int(age) if age and str(age).strip() else None,
                role,
                skills,
                availability,
                resume_path,
                profile_photo_path
            ))
            conn.commit()
            cursor.close()
            conn.close()

            # Send confirmation email synchronously
            if email:
                try:
                    html_body = render_template('emails/email_to_volunteer.html', 
                                                fullname=fullname, 
                                                email=email,
                                                skills=skills,
                                                role=role)

                    send_email_sync(email, html_body)
                except Exception as e:
                    print(f"Failed to prepare or send confirmation email: {e}")

            return jsonify({"status": "success", "message": "Your application has been submitted successfully. We will contact you soon."})
        except Exception as e:
            print(f"Error handling volunteer join request: {e}")
            return jsonify({"status": "error", "message": "Failed to submit. Please try again later."}), 500

    @app.route("/partner_join", methods=["POST"])
    def partner_join():
        org_name = request.form.get("orgName")
        contact_person = request.form.get("contactPerson")
        email = request.form.get("email")
        phone = request.form.get("phone")
        city = request.form.get("city")
        partner_type = request.form.get("partnerType")
        other_type = request.form.get("otherType")
        if partner_type == "Other" and other_type:
            partner_type = other_type

        support_type = request.form.get("supportType", "")
        message_content = request.form.get("message", "")

        logo_path = ""
        if 'logoUpload' in request.files:
            file = request.files['logoUpload']
            if file and file.filename != '':
                filename = secure_filename(file.filename)
                unique_filename = f"{uuid.uuid4().hex}_{filename}"
                file_path = os.path.join(app.config['PARTNER_LOGO_FOLDER'], unique_filename)
                file.save(file_path)
                logo_path = f"/upload/partner_logo/{unique_filename}"

        try:
            conn = get_db_connection()
            if not conn:
                init_db()
                conn = get_db_connection()
                if not conn:
                    return jsonify({"status": "error", "message": "Database connection failed"}), 500

            cursor = conn.cursor()

            try:
                cursor.execute("SELECT id FROM join_partner WHERE email = %s", (email,))
                cursor.fetchall()
            except mysql.connector.Error as err:
                if err.errno == 1146:
                    init_db()
                    cursor.close()
                    conn.close()
                    conn = get_db_connection()
                    if not conn:
                        return jsonify({"status": "error", "message": "Database connection failed after init"}), 500
                    cursor = conn.cursor()
                    cursor.execute("SELECT id FROM join_partner WHERE email = %s", (email,))
                    cursor.fetchall()
                else:
                    raise

            cursor.execute("""
                INSERT INTO join_partner (org_name, contact_person, email, phone, city, partner_type, support_type, message, logo_path, status)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, 'pending')
            """, (
                org_name,
                contact_person,
                email,
                phone,
                city,
                partner_type,
                support_type,
                message_content,
                logo_path
            ))
            conn.commit()
            cursor.close()
            conn.close()

            # Send confirmation email if required later

            return jsonify({"status": "success", "message": "Your partnership application has been submitted successfully. We will contact you soon."})
        except Exception as e:
            print(f"Error handling partnership request: {e}")
            return jsonify({"status": "error", "message": "Failed to submit. Please try again later."}), 500

    @app.route("/api/donate/initiate", methods=["POST"])
    def initiate_donation():
        data = request.json
        if not data:
            return jsonify({"status": "error", "message": "No data provided"}), 400
            
        fullname = data.get("fullname")
        email = data.get("email")
        phone = data.get("phone")
        city = data.get("city", "")
        pan = data.get("pan", "")
        message = data.get("message", "")
        amount = data.get("amount")
        payment_method = data.get("paymentMethod")
        
        if not all([fullname, email, phone, amount, payment_method]):
            return jsonify({"status": "error", "message": "Missing required fields"}), 400
            
        try:
            conn = get_db_connection()
            if not conn:
                init_db()
                conn = get_db_connection()
                if not conn:
                    return jsonify({"status": "error", "message": "Database error"}), 500
                    
            cursor = conn.cursor()
            
            # Ensure table exists
            try:
                cursor.execute("SELECT id FROM donate LIMIT 1")
                cursor.fetchall()
            except mysql.connector.Error as err:
                if err.errno == 1146:
                    init_db()
                    cursor.close()
                    conn.close()
                    conn = get_db_connection()
                    cursor = conn.cursor()
                else:
                    raise
            
            # Check if a pending donation with same email, phone, and amount already exists
            cursor.execute("""
                SELECT id FROM donate WHERE email = %s AND phone = %s AND amount = %s AND status = 'pending'
            """, (email, phone, amount))
            existing = cursor.fetchone()
            
            if existing:
                donation_id = existing[0]
            else:
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
        data = request.json
        donation_id = data.get("donation_id")
        status = data.get("status")
        transaction_id = data.get("transaction_id", "")
        
        if not donation_id or not status:
            return jsonify({"status": "error", "message": "Missing required fields"}), 400
            
        try:
            conn = get_db_connection()
            if not conn:
                return jsonify({"status": "error", "message": "Database error"}), 500
                
            cursor = conn.cursor()
            
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

    @app.route("/karate")
    def karate():
      return render_template('programs/programs-karate.html')

    @app.route("/yoga")
    def yoga():
      return render_template('programs/programs-yoga.html')

    @app.route("/internship")
    def internship():
      return render_template('programs/programs-internship.html')

    @app.route("/donate")
    def donate():
      return render_template('donate.html')

    @app.route("/gallery")
    def gallery():
      return render_template('gallery.html')

    @app.route("/volunteer")
    def volunteer():
      return render_template('volunteer.html')

    @app.route("/partners")
    def partners():
      return render_template('partners.html')

    @app.route("/carrier")
    def carrier():
      return render_template('carrier.html')
