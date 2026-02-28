# Deployment Instructions

This document provides instructions on how to run the Gram Tarakki Foundation application both locally and in a production environment.

## 1. Running Locally (Development Mode)

1. **Install Dependencies:**
   Ensure you have all required packages installed.
   ```bash
   pip install -r requirements.txt
   ```

2. **Database Setup:**
   Ensure your local MySQL server is running. Create a database (e.g., `gram_tarakki`) if it doesn't exist (the app will try to create it automatically).

3. **Environment Setup:**
   - Copy `.env.example` to a new file named `.env`.
   - Update the variables in `.env` with your local database credentials:
     ```env
     DB_HOST=localhost
     DB_USER=root
     DB_PASSWORD=your_local_password
     DB_NAME=gram_tarakki
     FLASK_DEBUG=True
     SECRET_KEY=local_dev_secret
     ```

4. **Run the Application:**
   ```bash
   python app.py
   ```
   The application will start in development mode on `http://localhost:3000`.

---

## 2. Running in Production (Render, Railway, PythonAnywhere, etc.)

For production, the application is configured to use **Waitress** instead of the built-in Flask development server. This is more secure, robust, and performs better under load.

### Key Practices for Production:

1. **Environment Variables:**
   - Do **NOT** push your `.env` file to your production server or GitHub.
   - Instead, use your hosting provider's dashboard to set the environment variables:
     - `DB_HOST`: The endpoint of your production managed database.
     - `DB_USER`: The username for the database.
     - `DB_PASSWORD`: The strong password for the database.
     - `DB_NAME`: The name of the production database.
     - `FLASK_DEBUG`: `False` (This ensures Waitress is used).
     - `SECRET_KEY`: A long, random strings (e.g., generated via `python -c "import secrets; print(secrets.token_hex(16))"`).

2. **Database Security (CRITICAL):**
   - **Never use the `root` user in production.**
   - Create a dedicated MySQL user with limited privileges that only has access to the `gram_tarakki` database. 
   ```sql
   CREATE USER 'gram_user'@'%' IDENTIFIED BY 'StrongPassword123!';
   GRANT ALL PRIVILEGES ON gram_tarakki.* TO 'gram_user'@'%';
   FLUSH PRIVILEGES;
   ```

3. **Starting the App:**
   - On most PaaS providers like Render or Railway, you configure the "Start Command". 
   - Set your start command to:
     ```bash
     python app.py
     ```
   - Since `FLASK_DEBUG` is false, `app.py` will automatically use Waitress to serve the application on the port specified by the `$PORT` environment variable (which platforms like Render supply automatically).

### Platform Specific Notes

- **Render / Railway / Heroku:** The platform will automatically assign a `PORT` environment variable. The updated `app.py` script automatically listens on this dynamic port.
- **PythonAnywhere:** PythonAnywhere uses WSGI directly. You configure the Web tab to point the WSGI configuration file at your `app` object in `app.py` (e.g. `from app import app as application`). Waitress is not strictly needed there but the code logic won't conflict.
