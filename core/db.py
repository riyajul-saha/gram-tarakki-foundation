import os
import mysql.connector

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
            CREATE TABLE IF NOT EXISTS join_requests (
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
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(fullname, email)
            )
        """)
        try:
            cursor.execute("ALTER TABLE join_requests ADD UNIQUE(fullname, email)")
        except mysql.connector.Error:
            pass
        try:
            cursor.execute("ALTER TABLE join_requests ADD COLUMN email VARCHAR(255) NOT NULL DEFAULT '' AFTER fullname")
        except mysql.connector.Error:
            pass
        try:
            cursor.execute("ALTER TABLE join_requests MODIFY phone VARCHAR(50) NULL")
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
                status VARCHAR(50) DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
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
        
        connection.commit()
        cursor.close()
        connection.close()
    except mysql.connector.Error as err:
        print(f"Error initializing DB: {err}")

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
