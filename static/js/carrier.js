let jobs = [];

// Fetch job data from JSON file
fetch('/api/data/carrier.json')
    .then(response => response.json())
    .then(data => {
        jobs = data;
        renderJobs();
    })
    .catch(error => console.error('Error fetching jobs data:', error));

// Render jobs based on filters
function renderJobs() {
    const search = document.getElementById('searchInput').value.toLowerCase();
    const dept = document.getElementById('deptFilter').value;
    const type = document.getElementById('typeFilter').value;
    const loc = document.getElementById('locationFilter').value;

    const filtered = jobs.filter(job => {
        const matchSearch = job.title.toLowerCase().includes(search) || job.desc.toLowerCase().includes(search);
        const matchDept = dept === 'all' || job.department === dept;
        const matchType = type === 'all' || job.type === type;
        const matchLoc = loc === 'all' || job.location === loc;
        return matchSearch && matchDept && matchType && matchLoc;
    });

    const container = document.getElementById('jobsContainer');
    if (filtered.length === 0) {
        container.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">No jobs match your criteria.</p>';
        return;
    }
    let html = '';
    filtered.forEach(job => {
        html += `
                    <div class="job-card">
                        <div class="job-tags">
                            ${job.tags.map(t => `<span class="tag">${t}</span>`).join('')}
                        </div>
                        <h3 class="job-title">${job.title}</h3>
                        <div class="job-meta">
                            <span><i class="fas fa-map-marker-alt"></i> ${job.location}</span>
                            <span><i class="fas fa-briefcase"></i> ${job.type}</span>
                            <span><i class="fas fa-rupee-sign"></i> ${job.salary}</span>
                        </div>
                        <div class="job-desc">${job.desc}</div>
                        <div class="job-buttons">
                            <button class="btn btn-outline" onclick="showJobDetails(${job.id})">View Details</button>
                            <button class="btn" onclick="openApplyModal(${job.id}, '${job.title.replace(/'/g, "\\'")}')">Apply Now</button>
                        </div>
                    </div>
                `;
    });
    container.innerHTML = html;
}

// Job details modal
function showJobDetails(id) {
    const job = jobs.find(j => j.id === id);
    if (!job) return;
    const modal = document.getElementById('jobModal');
    const content = document.getElementById('jobModalContent');
    content.innerHTML = `
                <h2>${job.title}</h2>
                <p><strong>Location:</strong> ${job.location}</p>
                <p><strong>Department:</strong> ${job.department}</p>
                <p><strong>Job Type:</strong> ${job.type}</p>
                <p><strong>Salary:</strong> ${job.salary}</p>
                <p><strong>Posted:</strong> ${job.posted}</p>
                <h3>About Role</h3>
                <p>${job.desc}</p>
                <h3>Responsibilities</h3>
                <ul>
                    ${job.responsibilities ? job.responsibilities.map(r => `<li>${r}</li>`).join('') : ''}
                </ul>
                <h3>Requirements</h3>
                <ul>
                    ${job.requirements ? job.requirements.map(r => `<li>${r}</li>`).join('') : ''}
                </ul>
                <button class="btn" onclick="openApplyModal(${job.id}, '${job.title.replace(/'/g, "\\'")}')">Apply Now</button>
            `;
    modal.classList.add('active');
}

function closeJobModal() {
    document.getElementById('jobModal').classList.remove('active');
}

// Apply modal
function openApplyModal(jobId, jobTitle) {
    // Check if the job is closed before opening apply form
    const job = jobs.find(j => j.id === jobId);
    if (job && job.status === 'closed') {
        showJobClosedPopup(jobTitle);
        return;
    }

    document.getElementById('applyJobTitle').innerText = jobTitle;
    document.getElementById('applyJobId').value = jobId;
    document.getElementById('applyModal').classList.add('active');
}

function showJobClosedPopup(jobTitle) {
    // Remove any existing popup
    const existing = document.getElementById('jobClosedOverlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'jobClosedOverlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(15,23,42,0.65);z-index:2000;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(6px);animation:fadeIn .3s ease;padding:20px';

    const popup = document.createElement('div');
    popup.style.cssText = 'background:white;border-radius:24px;padding:44px 36px;text-align:center;max-width:460px;width:100%;box-shadow:0 25px 60px rgba(0,0,0,0.2);animation:modalFadeIn .4s ease';
    popup.innerHTML = `
        <div style="width:76px;height:76px;border-radius:50%;background:linear-gradient(135deg,#fef2f2,#fee2e2);display:flex;align-items:center;justify-content:center;margin:0 auto 22px;animation:pulseIcon 1.8s ease infinite">
            <i class="fas fa-lock" style="font-size:1.8rem;color:#dc2626;"></i>
        </div>
        <h3 style="font-size:1.45rem;margin-bottom:8px;color:#1e293b;font-weight:700;">Position Closed</h3>
        <p style="color:#64748b;margin-bottom:6px;font-size:0.95rem;line-height:1.7;">
            Sorry, the position <strong style="color:#1e293b;">${jobTitle}</strong> is currently not accepting applications.
        </p>
        <p style="color:#94a3b8;font-size:0.88rem;line-height:1.6;margin-bottom:28px;">
            This role may re-open soon. Please explore other openings or check back in a few days.
        </p>
        <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
            <button onclick="document.getElementById('jobClosedOverlay').remove()" class="btn btn-outline" style="padding:11px 28px;border-radius:12px;font-weight:600;">
                <i class="fas fa-arrow-left"></i> Go Back
            </button>
            <button onclick="document.getElementById('jobClosedOverlay').remove();window.scrollTo({top:document.getElementById('jobsContainer').offsetTop-100,behavior:'smooth'})" class="btn" style="padding:11px 28px;border-radius:12px;font-weight:600;">
                <i class="fas fa-search"></i> Browse Jobs
            </button>
        </div>
    `;

    overlay.appendChild(popup);
    document.body.appendChild(overlay);

    // Close on overlay click
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

    // Inject keyframe if not already present
    if (!document.getElementById('jobClosedStyles')) {
        const style = document.createElement('style');
        style.id = 'jobClosedStyles';
        style.textContent = `
            @keyframes pulseIcon {
                0%, 100% { box-shadow: 0 0 0 0 rgba(220,38,38,0.15); }
                50% { box-shadow: 0 0 0 14px rgba(220,38,38,0); }
            }
            @keyframes fadeIn {
                from { opacity: 0; } to { opacity: 1; }
            }
            @keyframes modalFadeIn {
                from { opacity: 0; transform: translateY(20px) scale(0.96); }
                to { opacity: 1; transform: translateY(0) scale(1); }
            }
        `;
        document.head.appendChild(style);
    }
}

function closeApplyModal() {
    document.getElementById('applyModal').classList.remove('active');
    resetFileUploads();
}

function resetFileUploads() {
    // Reset resume upload area
    const resumeArea = document.getElementById('resumeUploadArea');
    if (resumeArea) {
        resumeArea.classList.remove('uploaded');
        document.getElementById('resumeFileName').innerHTML = 'Click to upload your resume';
    }
    // Reset photo upload area
    const photoArea = document.getElementById('photoUploadArea');
    if (photoArea) {
        photoArea.classList.remove('uploaded');
        document.getElementById('photoFileName').innerHTML = 'Click to upload your photo';
    }
}

// Allowed image types (SVG blocked to prevent XSS)
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_PHOTO_SIZE_KB = 100;   // 100 KB
const MAX_RESUME_SIZE_MB = 1;    // 1 MB

document.getElementById('resume')?.addEventListener('change', function () {
    const area = document.getElementById('resumeUploadArea');
    const label = document.getElementById('resumeFileName');
    if (this.files && this.files.length > 0) {
        const file = this.files[0];
        const fileSizeMB = file.size / (1024 * 1024);

        if (fileSizeMB > MAX_RESUME_SIZE_MB) {
            alert(`Resume must be under ${MAX_RESUME_SIZE_MB} MB. Your file is ${fileSizeMB.toFixed(2)} MB.`);
            this.value = '';
            label.innerHTML = 'Click to upload your resume';
            area.classList.remove('uploaded');
            return;
        }

        label.innerHTML = `<i class="fas fa-check-circle"></i> ${file.name} — Uploaded`;
        area.classList.add('uploaded');
    } else {
        label.innerHTML = 'Click to upload your resume';
        area.classList.remove('uploaded');
    }
});

document.getElementById('photo')?.addEventListener('change', function () {
    const area = document.getElementById('photoUploadArea');
    const label = document.getElementById('photoFileName');
    if (this.files && this.files.length > 0) {
        const file = this.files[0];
        const fileSizeKB = file.size / 1024;

        // Block SVG and non-allowed types
        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
            alert('Only JPG, PNG and WebP images are allowed. SVG files are not permitted for security reasons.');
            this.value = '';
            label.innerHTML = 'Click to upload your photo';
            area.classList.remove('uploaded');
            return;
        }

        if (fileSizeKB > MAX_PHOTO_SIZE_KB) {
            alert(`Photo must be under ${MAX_PHOTO_SIZE_KB} KB. Your file is ${fileSizeKB.toFixed(1)} KB.`);
            this.value = '';
            label.innerHTML = 'Click to upload your photo';
            area.classList.remove('uploaded');
            return;
        }

        label.innerHTML = `<i class="fas fa-check-circle"></i> ${file.name} — Uploaded`;
        area.classList.add('uploaded');
    } else {
        label.innerHTML = 'Click to upload your photo';
        area.classList.remove('uploaded');
    }
});

async function handleApply(e) {
    e.preventDefault();
    const form = document.getElementById('applicationForm');
    const submitBtn = document.getElementById('applySubmitBtn');
    const originalHTML = submitBtn.innerHTML;

    // --- Pre-submit file validation ---
    const photoInput = document.getElementById('photo');
    if (photoInput && photoInput.files.length > 0) {
        const photo = photoInput.files[0];
        if (!ALLOWED_IMAGE_TYPES.includes(photo.type)) {
            alert('Only JPG, PNG and WebP images are allowed. SVG files are not permitted for security reasons.');
            return;
        }
        if (photo.size / 1024 > MAX_PHOTO_SIZE_KB) {
            alert(`Photo must be under ${MAX_PHOTO_SIZE_KB} KB.`);
            return;
        }
    }
    const resumeInput = document.getElementById('resume');
    if (resumeInput && resumeInput.files.length > 0) {
        if (resumeInput.files[0].size / (1024 * 1024) > MAX_RESUME_SIZE_MB) {
            alert(`Resume must be under ${MAX_RESUME_SIZE_MB} MB.`);
            return;
        }
    }
    // --- End pre-submit validation ---

    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
    submitBtn.disabled = true;

    try {
        const formData = new FormData(form);
        const res = await fetch('/apply-job', {
            method: 'POST',
            body: formData
        });
        
        const data = await res.json();
        if(res.ok && data.status === 'success') {
            closeApplyModal();
            form.reset();
            resetFileUploads();
            showSuccessPopup();
        } else {
            alert(data.message || 'Error submitting application.');
        }
    } catch(err) {
        console.error(err);
        alert('An error occurred. Please try again.');
    } finally {
        submitBtn.innerHTML = originalHTML;
        submitBtn.disabled = false;
    }
}

function showSuccessPopup() {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:2000;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);animation:fadeIn .3s ease';
    const popup = document.createElement('div');
    popup.style.cssText = 'background:white;border-radius:24px;padding:40px;text-align:center;max-width:420px;width:90%;animation:modalFadeIn .4s ease';
    popup.innerHTML = `
        <div style="width:70px;height:70px;border-radius:50%;background:#E8F5E9;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;">
            <i class="fas fa-check" style="font-size:2rem;color:#2E7D32;"></i>
        </div>
        <h3 style="font-size:1.5rem;margin-bottom:10px;color:#1a1a1a;">Application Sent!</h3>
        <p style="color:#666;margin-bottom:24px;line-height:1.6;">Your application has been submitted successfully.<br>We will review it and get back to you soon.</p>
        <button onclick="this.closest('div[style]').parentElement.remove()" class="btn" style="padding:12px 40px;">Got it!</button>
    `;
    overlay.appendChild(popup);
    document.body.appendChild(overlay);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
}

// FAQ toggle
function toggleFaq(element) {
    const item = element.closest('.faq-item');
    item.classList.toggle('active');
}

// Filter event listeners
document.getElementById('searchInput').addEventListener('input', renderJobs);
document.getElementById('deptFilter').addEventListener('change', renderJobs);
document.getElementById('typeFilter').addEventListener('change', renderJobs);
document.getElementById('locationFilter').addEventListener('change', renderJobs);

// Initial render
renderJobs();

// Close modals on outside click
window.addEventListener('click', function (e) {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
});