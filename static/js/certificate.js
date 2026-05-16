// ===== Certificate Verification Page JS =====

// --- Mock certificate database (UI demo only - will be replaced by backend) ---
const MOCK_CERTS = {
  "GTFIN26001": {
    name: "Ariana Gantait",
    certId: "GTFIN26001",
    role: "Intern",
    department: "Web Development",
    duration: "2/01/2026 – 26/05/2026",
    issueDate: "2026-05-26",
    certType: "Internship Certificate",
    status: "Active",
    skills: ["HTML/CSS", "JavaScript", "Python", "Flask"]
  },
  "GTFVOL26001": {
    name: "Amit Das",
    certId: "GTFVOL26001",
    role: "Volunteer",
    department: "Community Outreach",
    duration: "10/01/2026 – 10/07/2026",
    issueDate: "2026-07-10",
    certType: "Volunteer Certificate",
    status: "Active",
    skills: ["Leadership", "Event Planning", "Communication"]
  },
  "GTFSTD26001": {
    name: "Priya Mondal",
    certId: "GTFSTD26001",
    role: "Student",
    department: "Karate Training",
    duration: "20/12/2025 – 20/12/2026",
    issueDate: "2026-12-20",
    certType: "Course Completion Certificate",
    status: "Active",
    skills: ["Karate", "Self-Defense", "Discipline", "Fitness"]
  }
};

// --- DOM Elements ---
const certInput = document.getElementById('certInput');
const verifyBtn = document.getElementById('verifyBtn');
const resultArea = document.getElementById('resultArea');

// --- Verify certificate ---
function verifyCertificate() {
  const id = certInput.value.trim().toUpperCase();
  if (!id) {
    certInput.classList.add('shake');
    setTimeout(() => certInput.classList.remove('shake'), 500);
    return;
  }

  // Loading state
  verifyBtn.classList.add('loading');
  resultArea.innerHTML = '';

  // Simulate API call
  setTimeout(() => {
    verifyBtn.classList.remove('loading');
    const cert = MOCK_CERTS[id];
    if (cert) {
      renderCertCard(cert);
    } else {
      renderError();
      certInput.classList.add('shake');
      setTimeout(() => certInput.classList.remove('shake'), 500);
    }

    // Scroll to result
    resultArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 1200);
}

// --- Render certificate card ---
function renderCertCard(cert) {
  const formattedDate = new Date(cert.issueDate).toLocaleDateString('en-IN', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  const skillsHtml = cert.skills.map(s => `<span class="skill-tag">${s}</span>`).join('');

  resultArea.innerHTML = `
    <div class="cert-result-card">
      <!-- Verified Banner -->
      <div class="card-verified-banner">
        <div class="banner-left">
          <img src="/static/images/home/logo.webp" alt="GTF Logo">
          <div>
            <div class="banner-org-name">Gram Tarakki Foundation</div>
            <div class="banner-org-sub">Official ${cert.certType}</div>
          </div>
        </div>
        <div class="verified-badge">
          <i class="fas fa-check-circle"></i>
          <span>Verified</span>
        </div>
      </div>

      <!-- Card Body: Image + Details -->
      <div class="card-body-content">
        <!-- Certificate Image -->
        <div class="cert-image-side">
          <div class="cert-image-label">Certificate Preview</div>
          <div class="cert-image-wrap" onclick="openCertImage()">
            <img src="/static/images/internship/demo_certificate.png" alt="Certificate of ${cert.name}">
            <div class="cert-image-overlay">
              <i class="fas fa-search-plus"></i> Click to view full size
            </div>
          </div>
          <a href="/static/images/internship/demo_certificate.png" download class="cert-download-link">
            <i class="fas fa-download"></i> Download Certificate
          </a>
        </div>

        <!-- Details -->
        <div class="cert-details-side">
          <div class="details-heading">
            <i class="fas fa-user-graduate"></i> Certificate Details
          </div>
          <div class="details-grid">
            <div class="detail-item">
              <span class="detail-label"><i class="fas fa-user"></i> Full Name</span>
              <span class="detail-value">${cert.name}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label"><i class="fas fa-id-card"></i> Certificate ID</span>
              <span class="detail-value" style="font-family:monospace;letter-spacing:0.5px;">${cert.certId}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label"><i class="fas fa-briefcase"></i> Role</span>
              <span class="detail-value">${cert.role}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label"><i class="fas fa-certificate"></i> Type</span>
              <span class="detail-value">${cert.certType}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label"><i class="fas fa-building"></i> Department</span>
              <span class="detail-value">${cert.department}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label"><i class="fas fa-signal"></i> Status</span>
              <div class="status-badge"><span class="status-dot"></span>${cert.status}</div>
            </div>
            <div class="detail-item">
              <span class="detail-label"><i class="fas fa-clock"></i> Duration</span>
              <span class="detail-value">${cert.duration}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label"><i class="fas fa-calendar-alt"></i> Issue Date</span>
              <span class="detail-value">${formattedDate}</span>
            </div>
            <div class="detail-item" style="grid-column: 1 / -1;">
              <span class="detail-label"><i class="fas fa-cogs"></i> Skills</span>
              <div class="skills-wrap">${skillsHtml}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// --- Open certificate image in new tab ---
function openCertImage() {
  window.open('/static/images/internship/demo_certificate.png', '_blank');
}

// --- Render error ---
function renderError() {
  resultArea.innerHTML = `
    <div class="error-card">
      <div class="error-icon">
        <i class="fas fa-exclamation-triangle"></i>
      </div>
      <h3>Certificate Not Found</h3>
      <p>Please check the Certificate ID and try again.</p>
    </div>
  `;
}

// --- Fill sample ID on click ---
function fillSample(id) {
  certInput.value = id;
  certInput.focus();
}

// --- Events ---
verifyBtn.addEventListener('click', verifyCertificate);
certInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') verifyCertificate();
});
