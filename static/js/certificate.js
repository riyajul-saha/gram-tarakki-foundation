// ===== Certificate Verification Page JS =====

// --- DOM Elements ---
const certInput = document.getElementById('certInput');
const verifyBtn = document.getElementById('verifyBtn');
const resultArea = document.getElementById('resultArea');

// --- Verify certificate ---
async function verifyCertificate() {
  const id = certInput.value.trim().toUpperCase();
  if (!id) {
    certInput.classList.add('shake');
    setTimeout(() => certInput.classList.remove('shake'), 500);
    return;
  }

  // Loading state
  verifyBtn.classList.add('loading');
  resultArea.innerHTML = '';

  try {
    const response = await fetch('/api/verify_certificate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ certId: id })
    });

    const result = await response.json();
    verifyBtn.classList.remove('loading');

    if (result.status === 'success' && result.certificate) {
      renderCertCard(result.certificate);
    } else {
      renderError();
      certInput.classList.add('shake');
      setTimeout(() => certInput.classList.remove('shake'), 500);
    }
  } catch (error) {
    console.error('Error verifying certificate:', error);
    verifyBtn.classList.remove('loading');
    renderError();
    certInput.classList.add('shake');
    setTimeout(() => certInput.classList.remove('shake'), 500);
  }

  // Scroll to result
  resultArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
          <div class="cert-image-wrap" onclick="window.open('${cert.file_path || ''}', '_blank')">
            <img src="${cert.file_path || ''}" alt="Certificate of ${cert.name}" 
                 onerror="this.onerror=null; this.style.display='none'; this.parentElement.innerHTML='<div style=\'padding:3rem;text-align:center;color:#6c757d;\'><i class=\'fas fa-image\' style=\'font-size:3rem;margin-bottom:1rem;opacity:0.4\'></i><p>Certificate image is not available or still generating.</p></div>';">
            <div class="cert-image-overlay">
              <i class="fas fa-search-plus"></i> Click to view full size
            </div>
          </div>
          <a href="${cert.file_path || '#'}" download class="cert-download-link">
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
              <span class="detail-value">${cert.duration || 'N/A'}</span>
            </div>
            ${cert.startDate ? `
            <div class="detail-item">
              <span class="detail-label"><i class="fas fa-calendar-check"></i> Start Date</span>
              <span class="detail-value">${new Date(cert.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>` : ''}
            <div class="detail-item">
              <span class="detail-label"><i class="fas fa-calendar-alt"></i> End Date</span>
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
