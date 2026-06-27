<p align="center">
  <img src="https://gramtarakkifoundation.org/static/images/home/logo.webp" alt="Gram Tarakki Foundation Logo" width="120" />
</p>

<h1 align="center">🌾 Gram Tarakki Foundation</h1>

<p align="center">
  <strong>Empowering Rural Communities Through Education, Healthcare & Sustainable Livelihood</strong>
</p>

<p align="center">
  <a href="https://gramtarakkifoundation.org">
    <img src="https://img.shields.io/badge/🌐_Live-gramtarakkifoundation.org-0d6efd?style=for-the-badge" alt="Live Website" />
  </a>
  <img src="https://img.shields.io/badge/python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python" />
  <img src="https://img.shields.io/badge/Flask-3.x-000000?style=for-the-badge&logo=flask&logoColor=white" alt="Flask" />
  <img src="https://img.shields.io/badge/MySQL-Aiven_Cloud-4479A1?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL" />
  <img src="https://img.shields.io/badge/PWA-Ready-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white" alt="PWA" />
  <img src="https://img.shields.io/badge/License-Proprietary-red?style=for-the-badge" alt="License" />
</p>

<p align="center">
  <a href="https://www.youtube.com/gramtarakki"><img src="https://img.shields.io/badge/YouTube-FF0000?style=flat-square&logo=youtube&logoColor=white" alt="YouTube" /></a>
  <a href="https://www.facebook.com/share/1AkacWAsBC/"><img src="https://img.shields.io/badge/Facebook-1877F2?style=flat-square&logo=facebook&logoColor=white" alt="Facebook" /></a>
  <a href="https://www.instagram.com/gramtarakki"><img src="https://img.shields.io/badge/Instagram-E4405F?style=flat-square&logo=instagram&logoColor=white" alt="Instagram" /></a>
</p>

---

## 📖 About

**Gram Tarakki Foundation** is a registered non-profit organization (**CIN: U88900WB2026NPL286268 | ROC: Kolkata**) dedicated to uplifting rural communities across **West Bengal, India**. We deliver impactful programs in education, physical wellness, career development, and community partnership — all powered by this full-stack web platform.

> *"Gram Tarakki" (গ্রাম তরক্কি) translates to **"Village Progress"** — our core mission in two words.*

---

## ✨ Key Features

<table>
<tr>
<td width="50%">

### 🎓 Student Enrollment
- Online registration with image upload
- Multi-program selection (Karate, Yoga, etc.)
- Automated confirmation emails
- Unique Student ID generation

</td>
<td width="50%">

### 🤝 Volunteer & Partner Management
- Volunteer registration with resume upload
- Partner/organization onboarding with logo upload
- Support type & availability tracking
- Automated email notifications

</td>
</tr>
<tr>
<td width="50%">

### 💼 Career Portal
- Dynamic job listings from database
- Full application pipeline (apply → review → interview)
- Resume & photo upload support
- Interview invitation emails

</td>
<td width="50%">

### 💰 Donation System
- Secure donation initiation & verification
- Multiple payment methods
- PAN card collection for tax receipts
- Transaction tracking & status management

</td>
</tr>
<tr>
<td width="50%">

### 📜 Certificate Verification
- Public certificate verification portal
- Auto-generated intern certificates (JPG)
- Shareable certificate pages (LinkedIn-ready)
- Unique Certificate ID system

</td>
<td width="50%">

### 🛡️ Admin Dashboard
- Secure login with account lockout protection
- Student, Intern, Staff & Job management
- Team management with role assignments
- OTP-based verification system

</td>
</tr>
</table>

---

## 🏗️ Architecture

```
gram-tarakki-foundation/
│
├── 📄 app.py                    # Flask application entry point
├── 📄 requirements.txt          # Python dependencies
├── 📄 manifest.json             # PWA manifest
├── 📄 sw.js                     # Service Worker (offline support)
├── 📄 sitemap.xml               # SEO sitemap
├── 📄 robots.txt                # Search engine directives
│
├── 📁 core/                     # Core application logic
│   ├── routes.py                # Public-facing routes & APIs
│   ├── db.py                    # Database initialization & connection pooling
│   ├── email_sender.py          # Async email delivery (Gmail API / Google Workspace)
│   ├── security.py              # Rate limiting, file validation (magic bytes)
│   ├── certificate_generate.py  # Auto-generate intern certificates
│   └── static_routes.py         # Static file serving (sitemap, robots, etc.)
│
├── 📁 admin/                    # Admin panel module
│   ├── routes.py                # Admin dashboard routes & CRUD operations
│   └── login.py                 # Admin authentication with lockout
│
├── 📁 templates/                # Jinja2 HTML templates
│   ├── base.html                # Base layout (nav, footer, SEO, structured data)
│   ├── index.html               # Homepage
│   ├── about.html               # About page
│   ├── programs.html            # Programs overview
│   ├── join.html                # Student enrollment form
│   ├── volunteer.html           # Volunteer registration
│   ├── partners.html            # Partnership portal
│   ├── career.html              # Career/jobs page
│   ├── donate.html              # Donation page
│   ├── gallery.html             # Photo gallery
│   ├── certificate.html         # Certificate verification
│   ├── view_certificate.html    # Individual certificate display
│   ├── 404.html                 # Custom error page
│   ├── 📁 programs/             # Individual program pages
│   ├── 📁 admin/                # Admin panel templates
│   └── 📁 emails/               # HTML email templates
│
├── 📁 static/
│   ├── 📁 css/                  # Stylesheets (per-page CSS architecture)
│   ├── 📁 js/                   # Client-side JavaScript (per-page)
│   └── 📁 images/               # Images organized by section
│
├── 📁 data/                     # JSON data files (program info, certificates)
├── 📁 upload/                   # User uploads (resumes, photos, logos)
└── 📁 certificate/              # Generated certificate images
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|:---|:---|
| **Backend** | Python 3.10+, Flask 3.x |
| **Database** | MySQL (Aiven Cloud) with Connection Pooling |
| **Frontend** | HTML5, CSS3 (Vanilla), JavaScript (Vanilla) |
| **Fonts** | Poppins, Inter (Google Fonts) |
| **Icons** | Font Awesome 6.5 |
| **Email** | Google Workspace API (Delegated Email) |
| **Deployment** | Render / Railway (with Waitress WSGI in production) |
| **PWA** | Service Worker + Web App Manifest |
| **SEO** | JSON-LD Structured Data, Open Graph, Twitter Cards |
| **Security** | CSRF protection, Rate limiting, Magic byte file validation, XSS prevention, HSTS, Secure cookies |

---

## 🔒 Security Features

- **CSRF Protection** — Origin/Referer header validation on all POST requests
- **Rate Limiting** — In-memory IP-based rate limiter (5 requests/hour per endpoint)
- **File Validation** — Magic byte verification for images (JPG, PNG, WebP) and PDFs
- **SVG Blocking** — SVG uploads are blocked to prevent stored XSS attacks
- **Security Headers** — `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Strict-Transport-Security`
- **Secure Sessions** — HTTPOnly, SameSite=Lax, Secure flag (in production), 15-minute expiry
- **Account Lockout** — Admin login with failed-attempt tracking and temporary lockout
- **Path Traversal Protection** — Safe file serving with `is_relative_to()` validation
- **Upload Size Limits** — 5 MB global max, 100 KB for photos, 1 MB for resumes

---

## 🚀 Getting Started

### Prerequisites

- **Python** 3.10 or higher
- **MySQL** 8.0+ (or an Aiven Cloud MySQL instance)
- **Git**

### 1. Clone the Repository

```bash
git clone https://github.com/riyajul-saha/gram-tarakki-foundation.git
cd gram-tarakki-foundation
```

### 2. Create a Virtual Environment

```bash
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS / Linux
source .venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables

Create a `.env` file in the project root:

```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=gram_tarakki
DB_PORT=3306

# Email (Google Workspace)
GMAIL=your_email@gmail.com
GMAIL_PASSWORD=your_app_password
DELEGATED_EMAIL=info@yourdomain.com
GOOGLE_APPLICATION_CREDENTIALS=gtf_key.json

# Flask
FLASK_DEBUG=True
SECRET_KEY=your_secret_key_here

# Google Apps Script (optional)
GOOGLE_SCRIPT_URL=your_script_url
GOOGLE_SCRIPT_SECURE_TOKEN=your_secure_token
```

> [!IMPORTANT]
> Never commit the `.env` file. It is already included in `.gitignore`.

### 5. Initialize the Database

The database and all tables are **automatically created** on first run via `core/db.py`. No manual migration is needed.

### 6. Run the Application

```bash
python app.py
```

The app will start on **http://localhost:3000** in development mode.

---

## 🌐 Deployment

The application is production-ready with **Waitress** WSGI server:

```bash
# Set FLASK_DEBUG=False in .env for production
FLASK_DEBUG=False
```

In production mode, the app automatically switches from Flask's development server to **Waitress**, a production-grade WSGI server.

### Deploy on Render / Railway

1. Set all environment variables in the platform dashboard
2. Set the **Start Command** to: `python app.py`
3. The app auto-detects production mode and uses Waitress
4. The `ProxyFix` middleware handles reverse proxy headers correctly

---

## 📁 API Endpoints

| Method | Endpoint | Description |
|:---|:---|:---|
| `GET` | `/` | Homepage |
| `GET` | `/about` | About page |
| `GET` | `/programs` | Programs overview |
| `GET` | `/karate` | Karate program details |
| `GET` | `/yoga` | Yoga program details |
| `GET` | `/internship` | Internship program details |
| `GET/POST` | `/join` | Student enrollment |
| `POST` | `/volunteer_join` | Volunteer registration |
| `POST` | `/partner_join` | Partner registration |
| `GET` | `/career` | Career portal |
| `POST` | `/apply-job` | Job application |
| `GET` | `/donate` | Donation page |
| `POST` | `/api/donate/initiate` | Start a donation |
| `POST` | `/api/donate/verify` | Verify donation |
| `GET` | `/gallery` | Photo gallery |
| `GET` | `/certificate` | Certificate verification page |
| `POST` | `/api/verify_certificate` | Verify certificate by ID |
| `GET` | `/certificate/intern/<id>` | View individual certificate |
| `GET` | `/api/jobs` | List all job openings (JSON) |
| `GET` | `/api/data/<filename>` | Serve data files (program_info.json) |
| `GET` | `/partners` | Partners page |
| `GET` | `/volunteer` | Volunteer info page |

---

## 📧 Email System

The platform sends beautifully designed HTML emails for:

| Template | Trigger |
|:---|:---|
| `student_join_mail.html` | Student enrollment confirmation |
| `email_to_volunteer.html` | Volunteer registration confirmation |
| `interview_invite.html` | Job interview invitation |
| `otp_verification.html` | Admin OTP verification |

Emails are sent **asynchronously** via `core/email_sender.py` using Google Workspace API with delegated authentication.

---

## 🎯 Programs

| Program | Description |
|:---|:---|
| 🥋 **Karate** | Self-defense and discipline training for youth |
| 🧘 **Yoga** | Wellness and mindfulness programs |
| 💻 **Internship** | Hands-on experience for students with certificate generation |

---

## 📊 Database Schema

The application uses **8 MySQL tables** with automatic initialization:

| Table | Purpose |
|:---|:---|
| `join_student` | Student enrollment records |
| `join_volunteer` | Volunteer registrations |
| `join_partner` | Partner/organization applications |
| `join_staff` | Job applications |
| `donate` | Donation transactions |
| `admin` | Admin users with lockout tracking |
| `our_staff` | Approved staff members |
| `our_intern` | Intern records with certificate tracking |
| `career_details` | Job postings with JSON fields |

All tables include **database indexes** on frequently queried columns for optimized performance.

---

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

1. **Fork** the repository
2. **Create** your feature branch
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit** your changes
   ```bash
   git commit -m "Add amazing feature"
   ```
4. **Push** to the branch
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open** a Pull Request

> [!NOTE]
> Please ensure all new endpoints include rate limiting and input validation.

---

## 📞 Contact

<table>
<tr>
<td>📧 <strong>Email</strong></td>
<td><a href="mailto:info@gramtarakkifoundation.org">info@gramtarakkifoundation.org</a></td>
</tr>
<tr>
<td>📞 <strong>Phone</strong></td>
<td>+91 94753 21004</td>
</tr>
<tr>
<td>📍 <strong>Address</strong></td>
<td>MADHAKHALI BHUPATINAGAR, East Midnapore, West Bengal, India – 721425</td>
</tr>
<tr>
<td>🌐 <strong>Website</strong></td>
<td><a href="https://gramtarakkifoundation.org">gramtarakkifoundation.org</a></td>
</tr>
</table>

---

<p align="center">
  <strong>Made with ❤️ for Rural India</strong>
  <br />
  <sub>© 2026 Gram Tarakki Foundation. All Rights Reserved.</sub>
  <br />
  <sub>CIN: U88900WB2026NPL286268 | ROC: Kolkata</sub>
</p>
