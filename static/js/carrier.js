let jobs = [];

// Fetch job data from JSON file
fetch('/static/data/carrier.json')
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
    document.getElementById('applyJobTitle').innerText = jobTitle;
    document.getElementById('applyJobId').value = jobId;
    document.getElementById('applyModal').classList.add('active');
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

// File upload listeners — show file name after selection
document.getElementById('resume')?.addEventListener('change', function () {
    const area = document.getElementById('resumeUploadArea');
    const label = document.getElementById('resumeFileName');
    if (this.files && this.files.length > 0) {
        label.innerHTML = `<i class="fas fa-check-circle"></i> ${this.files[0].name} — Uploaded`;
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
        label.innerHTML = `<i class="fas fa-check-circle"></i> ${this.files[0].name} — Uploaded`;
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