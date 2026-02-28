import os
import mysql.connector
from dotenv import load_dotenv
from flask import Flask, render_template, request, jsonify

# Load environment variables from .env file (if it exists)
# In production platforms (like Render/Railway), variables are usually 
# set in the platform's dashboard, so .env won't exist.
if os.path.exists(".env"):
    load_dotenv()

app = Flask(__name__)
# Use a secret key from environment for session management/security
app.secret_key = os.getenv("SECRET_KEY", "fallback_dev_secret_key_change_in_prod")

def init_db():
    try:
        connection = mysql.connector.connect(
            host=os.getenv("DB_HOST", "localhost"),
            # WARNING: In production, do NOT use the 'root' user.
            # Create a user with limited privileges.
            port=int(os.getenv("DB_PORT", 3306)),
            user=os.getenv("DB_USER", "root"),
            password=os.getenv("DB_PASSWORD", "")
        )
        cursor = connection.cursor()
        db_name = os.getenv("DB_NAME", "gram_tarakki")
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS {db_name}")
        cursor.execute(f"USE {db_name}")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS join_requests (
                id INT AUTO_INCREMENT PRIMARY KEY,
                fullname VARCHAR(255) NOT NULL,
                age INT,
                gender VARCHAR(50),
                school VARCHAR(255),
                parent_name VARCHAR(255),
                parent_contact VARCHAR(50),
                phone VARCHAR(50) NOT NULL,
                address TEXT NOT NULL,
                program VARCHAR(100) NOT NULL,
                experience VARCHAR(10),
                medical TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        connection.commit()
        cursor.close()
        connection.close()
    except mysql.connector.Error as err:
        print(f"Error initializing DB: {err}")

init_db()

def get_db_connection():
    try:
        connection = mysql.connector.connect(
            host=os.getenv("DB_HOST", "localhost"),
            port=int(os.getenv("DB_PORT", 3306)),
            user=os.getenv("DB_USER", "root"),
            password=os.getenv("DB_PASSWORD", ""),
            database=os.getenv("DB_NAME", "gram_tarakki")
        )
        return connection
    except mysql.connector.Error as err:
        print(f"Error connecting to database: {err}")
        return None


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
    age = request.form.get("age")
    gender = request.form.get("gender")
    school = request.form.get("school")
    parent_name = request.form.get("parentName")
    parent_contact = request.form.get("parentContact")
    phone = request.form.get("phone")
    address = request.form.get("address")
    program = request.form.get("program")
    experience = request.form.get("experience")
    medical = request.form.get("medical")

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
            cursor.execute("SELECT id FROM join_requests WHERE fullname = %s AND phone = %s", (fullname, phone))
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
                cursor.execute("SELECT id FROM join_requests WHERE fullname = %s AND phone = %s", (fullname, phone))
            else:
                raise

        if cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({"status": "exists", "message": "You already joined, for any help contact us"})
        
        # Insert (save optional fields as NaN if they are empty string / None in Python, but DB schema expects string)
        # We will save string "NaN" for optional empty values as requested by user.
        cursor.execute("""
            INSERT INTO join_requests (fullname, age, gender, school, parent_name, parent_contact, phone, address, program, experience, medical)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            fullname,
            int(age) if age else None,
            gender,
            validate_opt(school),
            validate_opt(parent_name),
            validate_opt(parent_contact),
            phone,
            address,
            program,
            experience,
            validate_opt(medical)
        ))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"status": "success"})
    except Exception as e:
        print(f"Error handling join request: {e}")
        return jsonify({"status": "error", "message": "Failed to submit. Please try again later."}), 500

  return render_template('join.html')

@app.route("/karate")
def karate():
  return render_template('programs/programs-karate.html')

@app.route("/yoga")
def yoga():
  return render_template('programs/programs-yoga.html')

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

if __name__ == "__main__":
    # Check if we should run in debug mode
    debug_mode = os.getenv("FLASK_DEBUG", "True").lower() in ("true", "1", "t")
    
    port = int(os.getenv("PORT", 3000))

    if debug_mode:
        print(f"Running in Development Mode on port {port}")
        app.run(host="0.0.0.0", port=port, debug=True)
    else:
        print(f"Running in Production Mode (Waitress) on port {port}")
        from waitress import serve
        serve(app, host="0.0.0.0", port=port)
