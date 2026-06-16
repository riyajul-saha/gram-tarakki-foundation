import os
import mysql.connector
from mysql.connector import pooling

_connection_pool = None

def init_db():
    try:
        connection = mysql.connector.connect(
            host=os.getenv("DB_HOST", "localhost"),
            port=int(os.getenv("DB_PORT", 3306)),
            user=os.getenv("DB_USER", "root"),
            password=os.getenv("DB_PASSWORD", "")
        )
        cursor = connection.cursor()
        db_name = os.getenv("DB_NAME", "gram_tarakki")
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS {db_name}")
        cursor.execute(f"USE {db_name}")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS join_student (
                id INT AUTO_INCREMENT PRIMARY KEY,
                fullname VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                age INT,
                gender VARCHAR(50),
                school VARCHAR(255),
                parent_name VARCHAR(255),
                parent_contact VARCHAR(50),
                phone VARCHAR(50),
                address TEXT NOT NULL,
                program VARCHAR(100) NOT NULL,
                experience VARCHAR(10),
                medical TEXT,
                image VARCHAR(255),
                status VARCHAR(50) DEFAULT 'pending',
                student_id VARCHAR(20) DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(fullname, email)
            )
        """)
        try:
            cursor.execute("ALTER TABLE join_student ADD COLUMN student_id VARCHAR(20) DEFAULT NULL AFTER status")
        except mysql.connector.Error:
            pass
        try:
            cursor.execute("ALTER TABLE join_student ADD UNIQUE(fullname, email)")
        except mysql.connector.Error:
            pass
        try:
            cursor.execute("ALTER TABLE join_student ADD COLUMN email VARCHAR(255) NOT NULL DEFAULT '' AFTER fullname")
        except mysql.connector.Error:
            pass
        try:
            cursor.execute("ALTER TABLE join_student MODIFY phone VARCHAR(50) NULL")
        except mysql.connector.Error:
            pass
        try:
            cursor.execute("ALTER TABLE join_student ADD COLUMN status VARCHAR(50) DEFAULT 'pending' AFTER medical")
        except mysql.connector.Error:
            pass
        try:
            cursor.execute("ALTER TABLE join_student ADD COLUMN image VARCHAR(255) AFTER medical")
        except mysql.connector.Error:
            pass

        # Create admin table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS admin (
                id VARCHAR(255) PRIMARY KEY,
                email VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL
            )
        """)
        try:
            cursor.execute("ALTER TABLE admin ADD COLUMN fullname VARCHAR(255)")
        except mysql.connector.Error:
            pass
        try:
            cursor.execute("ALTER TABLE admin ADD COLUMN phone VARCHAR(50)")
        except mysql.connector.Error:
            pass
        try:
            cursor.execute("ALTER TABLE admin ADD COLUMN address VARCHAR(255)")
        except mysql.connector.Error:
            pass
        try:
            cursor.execute("ALTER TABLE admin ADD COLUMN image VARCHAR(255)")
        except mysql.connector.Error:
            pass
        try:
            cursor.execute("ALTER TABLE admin ADD COLUMN status VARCHAR(20) DEFAULT 'active'")
        except mysql.connector.Error:
            pass
        try:
            cursor.execute("ALTER TABLE admin ADD COLUMN failed_attempts INT DEFAULT 0")
        except mysql.connector.Error:
            pass
        try:
            cursor.execute("ALTER TABLE admin ADD COLUMN locked_until TIMESTAMP NULL")
        except mysql.connector.Error:
            pass
        
        # Create join_volunteer table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS join_volunteer (
                id INT AUTO_INCREMENT PRIMARY KEY,
                fullname VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                phone VARCHAR(50),
                city VARCHAR(100),
                age INT,
                role VARCHAR(100),
                skills TEXT,
                availability VARCHAR(50),
                resume_path VARCHAR(255),
                profile_photo VARCHAR(255),
                status VARCHAR(50) DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        try:
            cursor.execute("ALTER TABLE join_volunteer ADD COLUMN profile_photo VARCHAR(255) AFTER resume_path")
        except mysql.connector.Error:
            pass
        
        # Create join_partner table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS join_partner (
                id INT AUTO_INCREMENT PRIMARY KEY,
                org_name VARCHAR(255) NOT NULL,
                contact_person VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                phone VARCHAR(50) NOT NULL,
                city VARCHAR(100) NOT NULL,
                partner_type VARCHAR(100) NOT NULL,
                support_type TEXT,
                message TEXT,
                logo_path VARCHAR(255),
                status VARCHAR(50) DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Create donate table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS donate (
                id INT AUTO_INCREMENT PRIMARY KEY,
                fullname VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                phone VARCHAR(50) NOT NULL,
                city VARCHAR(100),
                pan VARCHAR(50),
                message TEXT,
                amount DECIMAL(10, 2) NOT NULL,
                payment_method VARCHAR(50) NOT NULL,
                status VARCHAR(50) DEFAULT 'pending',
                transaction_id VARCHAR(255) DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Create join_staff table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS join_staff (
                id INT AUTO_INCREMENT PRIMARY KEY,
                fullname VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                phone VARCHAR(50),
                location VARCHAR(255),
                linkedin VARCHAR(255),
                cover_letter TEXT,
                position VARCHAR(50),
                experience VARCHAR(255),
                resume VARCHAR(255),
                photo VARCHAR(255),
                skills TEXT,
                notes TEXT,
                status VARCHAR(50) DEFAULT 'applied',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Create our_staff table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS our_staff (
                id INT AUTO_INCREMENT PRIMARY KEY,
                fullname VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                phone VARCHAR(50),
                city VARCHAR(100),
                location VARCHAR(255),
                age INT,
                role VARCHAR(100),
                position VARCHAR(50),
                skills TEXT,
                availability VARCHAR(50),
                linkedin VARCHAR(255),
                cover_letter TEXT,
                experience VARCHAR(255),
                resume VARCHAR(255),
                photo VARCHAR(255),
                notes TEXT,
                job_type VARCHAR(50),
                status VARCHAR(50) DEFAULT 'active',
                staff_id VARCHAR(20) DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        try:
            cursor.execute("ALTER TABLE our_staff ADD COLUMN staff_id VARCHAR(20) DEFAULT NULL AFTER status")
        except mysql.connector.Error:
            pass
            
        # Create our_intern table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS our_intern (
                id INT AUTO_INCREMENT PRIMARY KEY,
                fullname VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                phone VARCHAR(50),
                address TEXT,
                field VARCHAR(100),
                duration VARCHAR(50),
                start_date DATE,
                end_date DATE,
                status VARCHAR(50) DEFAULT 'active',
                cert_approved BOOLEAN DEFAULT FALSE,
                intern_id VARCHAR(50),
                photo VARCHAR(255),
                resume VARCHAR(255),
                college VARCHAR(255),
                skills TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        try:
            cursor.execute("ALTER TABLE our_intern ADD COLUMN skills TEXT")
        except mysql.connector.Error:
            pass
        
        # Create career_details table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS career_details (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                department VARCHAR(255),
                job_type VARCHAR(100),
                location VARCHAR(255),
                salary VARCHAR(100),
                description TEXT,
                responsibilities TEXT,
                requirements TEXT,
                tags TEXT,
                status VARCHAR(50) DEFAULT 'active',
                deadline DATE,
                posted DATE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Add Indexes to frequently queried columns
        indexes = [
            ("join_student", "idx_status", "status"),
            ("join_student", "idx_created_at", "created_at"),
            ("join_student", "idx_student_id", "student_id"),
            ("join_volunteer", "idx_status", "status"),
            ("join_volunteer", "idx_created_at", "created_at"),
            ("join_volunteer", "idx_email", "email"),
            ("join_staff", "idx_status", "status"),
            ("join_staff", "idx_created_at", "created_at"),
            ("join_partner", "idx_status", "status"),
            ("donate", "idx_status", "status"),
            ("donate", "idx_email_phone", "email(100), phone(20)"),
            ("our_staff", "idx_status", "status"),
            ("our_staff", "idx_staff_id", "staff_id"),
            ("our_intern", "idx_status", "status"),
            ("our_intern", "idx_intern_id", "intern_id"),
            ("career_details", "idx_status", "status"),
        ]
        
        for table, idx_name, cols in indexes:
            try:
                cursor.execute(f"CREATE INDEX {idx_name} ON {table} ({cols})")
            except mysql.connector.Error:
                pass
                
        connection.commit()
        cursor.close()
        connection.close()
    except mysql.connector.Error as err:
        print(f"Error initializing DB: {err}")

def get_db_connection():
    global _connection_pool
    try:
        if _connection_pool is None:
            dbconfig = {
                "host": os.getenv("DB_HOST", "localhost"),
                "port": int(os.getenv("DB_PORT", 3306)),
                "user": os.getenv("DB_USER", "root"),
                "password": os.getenv("DB_PASSWORD", ""),
                "database": os.getenv("DB_NAME", "gram_tarakki")
            }
            _connection_pool = pooling.MySQLConnectionPool(
                pool_name="gtf_pool",
                pool_size=10,
                pool_reset_session=True,
                **dbconfig
            )
        return _connection_pool.get_connection()
    except mysql.connector.Error as err:
        print(f"Error connecting to database via pool: {err}")
        return None
