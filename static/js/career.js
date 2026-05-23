/* ═══════════════════════════════════════════════════════════
   CAREER PAGE — Premium JS
   ═══════════════════════════════════════════════════════════ */

let jobs = [];

// ── Fetch job data ──────────────────────────────────────────
fetch('/api/data/career.json')
    .then(response => response.json())
    .then(data => {
        jobs = data;
        renderJobs();
        initScrollAnimations();
    })
    .catch(error => console.error('Error fetching jobs data:', error));

// ── Department icon map ─────────────────────────────────────
const DEPT_ICONS = {
    'Tech': 'fas fa-laptop-code',
    'Education': 'fas fa-graduation-cap',
    'Marketing': 'fas fa-bullhorn',
    'Operations': 'fas fa-cogs',
    'default': 'fas fa-briefcase'
};

function getDeptIcon(dept) {
    return DEPT_ICONS[dept] || DEPT_ICONS['default'];
}

// ── Tag color helper ────────────────────────────────────────
function getTagClass(tag, job) {
    const t = tag.toLowerCase();
    if (t === job.department?.toLowerCase()) return 'tag-dept';
    if (t === job.type?.toLowerCase()) return 'tag-type';
    if (t === job.location?.toLowerCase()) return 'tag-location';
    return 'tag-default';
}

// ── Date formatting helpers ─────────────────────────────────
function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getRelativeDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    const now = new Date();
    const diffMs = now - d;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return formatDate(dateStr);
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return formatDate(dateStr);
}

function getDaysUntil(dateStr) {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d)) return null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    d.setHours(0, 0, 0, 0);
    return Math.ceil((d - now) / (1000 * 60 * 60 * 24));
}

// ══════════════════════════════════════════════════════════
// RENDER JOB CARDS
// ══════════════════════════════════════════════════════════
function renderJobs() {
    const search = document.getElementById('searchInput').value.toLowerCase();
    const dept = document.getElementById('deptFilter').value;
    const type = document.getElementById('typeFilter').value;
    const loc = document.getElementById('locationFilter').value;

    const filtered = jobs.filter(job => {
        if (job.status === 'draft') return false;
        const titleMatch = (job.title || '').toLowerCase().includes(search);
        const descMatch = (job.desc || '').toLowerCase().includes(search);
        const matchSearch = titleMatch || descMatch;
        const matchDept = dept === 'all' || job.department === dept;
        const matchType = type === 'all' || job.type === type;
        const matchLoc = loc === 'all' || job.location === loc;
        return matchSearch && matchDept && matchType && matchLoc;
    });

    const container = document.getElementById('jobsContainer');

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="no-jobs-message">
                <i class="fas fa-search"></i>
                <h3>No positions found</h3>
                <p>Try adjusting your filters or check back later for new openings.</p>
            </div>
        `;
        return;
    }

    let html = '';
    filtered.forEach((job, index) => {
        const deptIcon = getDeptIcon(job.department);
        const daysLeft = getDaysUntil(job.deadline);
        const isClosed = job.status === 'closed';

        // Build tags — use department, type, and location as auto-tags if tags array is empty
        let tagsHtml = '';
        if (job.tags && job.tags.length > 0) {
            tagsHtml = job.tags.map(t => `<span class="tag ${getTagClass(t, job)}">${t}</span>`).join('');
        } else {
            // Auto-generate tags from department, type, location
            const autoTags = [];
            if (job.department) autoTags.push(`<span class="tag tag-dept">${job.department}</span>`);
            if (job.type) autoTags.push(`<span class="tag tag-type">${job.type}</span>`);
            if (job.location) autoTags.push(`<span class="tag tag-location">${job.location}</span>`);
            tagsHtml = autoTags.join('');
        }

        // Deadline display
        let deadlineHtml = '';
        if (job.deadline) {
            if (isClosed) {
                deadlineHtml = `<span class="job-deadline"><i class="fas fa-lock"></i> Closed</span>`;
            } else if (daysLeft !== null && daysLeft >= 0) {
                deadlineHtml = `<span class="job-deadline"><i class="fas fa-clock"></i> ${daysLeft === 0 ? 'Last day!' : daysLeft + ' days left'}</span>`;
            } else if (daysLeft !== null && daysLeft < 0) {
                deadlineHtml = `<span class="job-deadline"><i class="fas fa-calendar-check"></i> Deadline passed</span>`;
            }
        }
        if (job.posted) {
            deadlineHtml += `<span class="job-deadline"><i class="fas fa-calendar-plus"></i> Posted ${getRelativeDate(job.posted)}</span>`;
        }

        html += `
            <div class="job-card animate-on-scroll" style="transition-delay: ${index * 0.08}s">
                <div class="job-card-header">
                    <div class="job-icon">
                        <i class="${deptIcon}"></i>
                    </div>
                    <div class="job-card-header-text">
                        <div class="job-tags">${tagsHtml}</div>
                        <h3 class="job-title">${job.title}</h3>
                    </div>
                </div>
                <div class="job-meta">
                    <span><i class="fas fa-map-marker-alt"></i> ${job.location}</span>
                    <span><i class="fas fa-briefcase"></i> ${job.type}</span>
                    <span><i class="fas fa-rupee-sign"></i> ${job.salary}</span>
                </div>
                <div class="job-desc">${job.desc}</div>
                <div class="job-card-footer">
                    <div>${deadlineHtml}</div>
                    <div class="job-buttons">
                        <button class="btn btn-outline" onclick="showJobDetails(${job.id})">
                            <i class="fas fa-eye"></i> View Details
                        </button>
                        <button class="btn" onclick="openApplyModal(${job.id}, '${job.title.replace(/'/g, "\\'")}')">
                            <i class="fas fa-paper-plane"></i> Apply
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;

    // Re-trigger scroll animation for newly rendered cards
    initScrollAnimations();
}

// ══════════════════════════════════════════════════════════
// VIEW DETAILS MODAL — Premium Popup
// ══════════════════════════════════════════════════════════
function showJobDetails(id) {
    const job = jobs.find(j => j.id === id);
    if (!job) return;

    const modal = document.getElementById('jobModal');
    const content = document.getElementById('jobModalContent');

    const isClosed = job.status === 'closed';
    const daysLeft = getDaysUntil(job.deadline);

    // Build status badges
    let statusBadges = '';
    if (isClosed) {
        statusBadges += `<span class="status-badge status-closed"><i class="fas fa-lock"></i> Closed</span>`;
    } else {
        statusBadges += `<span class="status-badge status-active">Actively Hiring</span>`;
    }
    if (job.deadline) {
        if (daysLeft !== null && daysLeft >= 0 && !isClosed) {
            statusBadges += `<span class="status-badge status-deadline"><i class="fas fa-clock"></i> ${daysLeft === 0 ? 'Last day to apply!' : daysLeft + ' days left'}</span>`;
        }
    }
    if (job.posted) {
        statusBadges += `<span class="status-badge" style="background:#f0f4f1;color:#5a6b5c;"><i class="fas fa-calendar-plus"></i> Posted ${formatDate(job.posted)}</span>`;
    }

    // Build responsibilities
    let responsibilitiesHtml = '';
    if (job.responsibilities && job.responsibilities.length > 0) {
        responsibilitiesHtml = `
            <h4 class="modal-section-title">
                <i class="fas fa-tasks"></i> Responsibilities
            </h4>
            <ul class="modal-list">
                ${job.responsibilities.map(r => `<li>${r}</li>`).join('')}
            </ul>
        `;
    }

    // Build requirements
    let requirementsHtml = '';
    if (job.requirements && job.requirements.length > 0) {
        requirementsHtml = `
            <h4 class="modal-section-title">
                <i class="fas fa-check-circle"></i> Requirements
            </h4>
            <ul class="modal-list">
                ${job.requirements.map(r => `<li>${r}</li>`).join('')}
            </ul>
        `;
    }

    content.innerHTML = `
        <!-- Modal Header / Banner -->
        <div class="modal-job-header">
            <h2 class="modal-job-title">${job.title}</h2>
            <div class="modal-job-meta">
                <span class="modal-meta-item"><i class="fas fa-map-marker-alt"></i> ${job.location}</span>
                <span class="modal-meta-item"><i class="fas fa-building"></i> ${job.department}</span>
                <span class="modal-meta-item"><i class="fas fa-briefcase"></i> ${job.type}</span>
                <span class="modal-meta-item"><i class="fas fa-rupee-sign"></i> ${job.salary}</span>
            </div>
        </div>

        <!-- Modal Body -->
        <div class="modal-job-body">
            <!-- Status Badges -->
            <div class="modal-status-row">
                ${statusBadges}
            </div>

            <!-- About Role -->
            <h4 class="modal-section-title">
                <i class="fas fa-info-circle"></i> About This Role
            </h4>
            <div class="modal-about-text">${job.desc}</div>

            ${responsibilitiesHtml}
            ${requirementsHtml}
        </div>

        <!-- Modal Footer -->
        <div class="modal-job-footer">
            <button class="btn" onclick="openApplyModal(${job.id}, '${job.title.replace(/'/g, "\\'")}')">
                <i class="fas fa-paper-plane"></i> Apply for This Role
            </button>
            <button class="btn btn-outline" onclick="closeJobModal()">
                <i class="fas fa-arrow-left"></i> Back
            </button>
            <button class="modal-share-btn" onclick="shareJob(${job.id})" title="Copy link">
                <i class="fas fa-share-alt"></i>
            </button>
        </div>
    `;

    modal.classList.add('active');

    // Prevent body scrolling when modal is open
    document.body.style.overflow = 'hidden';
}

function closeJobModal() {
    document.getElementById('jobModal').classList.remove('active');
    document.body.style.overflow = '';
}

// ── Share job ───────────────────────────────────────────────
function shareJob(id) {
    const job = jobs.find(j => j.id === id);
    if (!job) return;

    const url = window.location.origin + '/career#open-positions';
    const text = `Check out this ${job.type} position: ${job.title} at Gram Tarakki Foundation — ${url}`;

    if (navigator.share) {
        navigator.share({ title: job.title, text: text, url: url })
            .catch(() => fallbackCopy(url));
    } else {
        fallbackCopy(url);
    }
}

function fallbackCopy(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('Link copied to clipboard!');
    }).catch(() => {
        showToast('Could not copy link');
    });
}

// ── Toast notification ──────────────────────────────────────
function showToast(message) {
    const existing = document.querySelector('.toast-notification');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.style.cssText = `
        position: fixed;
        bottom: 30px;
        left: 50%;
        transform: translateX(-50%) translateY(20px);
        background: #1a2e1d;
        color: white;
        padding: 12px 28px;
        border-radius: 14px;
        font-size: 0.9rem;
        font-weight: 600;
        z-index: 3000;
        box-shadow: 0 8px 30px rgba(0,0,0,0.2);
        opacity: 0;
        transition: all 0.35s cubic-bezier(.4,0,.2,1);
        font-family: 'Inter', sans-serif;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(-50%) translateY(0)';
    });

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(20px)';
        setTimeout(() => toast.remove(), 350);
    }, 2500);
}

// ══════════════════════════════════════════════════════════
// APPLY MODAL
// ══════════════════════════════════════════════════════════
function openApplyModal(jobId, jobTitle) {
    const job = jobs.find(j => j.id === jobId);
    if (job && job.status === 'closed') {
        showJobClosedPopup(jobTitle);
        return;
    }

    // Close job details modal first if open
    closeJobModal();

    document.getElementById('applyJobTitle').innerText = jobTitle;
    document.getElementById('applyJobId').value = jobId;
    document.getElementById('applyModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function showJobClosedPopup(jobTitle) {
    const existing = document.getElementById('jobClosedOverlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'jobClosedOverlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(15,23,20,0.6);z-index:2000;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);animation:fadeIn .3s ease;padding:20px';

    const popup = document.createElement('div');
    popup.style.cssText = 'background:white;border-radius:24px;padding:44px 36px;text-align:center;max-width:460px;width:100%;box-shadow:0 30px 80px rgba(0,0,0,0.2);animation:modalSlideIn .45s cubic-bezier(.4,0,.2,1)';
    popup.innerHTML = `
        <div style="width:76px;height:76px;border-radius:20px;background:linear-gradient(135deg,#fef2f2,#fee2e2);display:flex;align-items:center;justify-content:center;margin:0 auto 22px;animation:pulseIcon 1.8s ease infinite">
            <i class="fas fa-lock" style="font-size:1.8rem;color:#dc2626;"></i>
        </div>
        <h3 style="font-size:1.45rem;margin-bottom:8px;color:#1a2e1d;font-weight:700;font-family:'Poppins',sans-serif;">Position Closed</h3>
        <p style="color:#5a6b5c;margin-bottom:6px;font-size:0.95rem;line-height:1.7;">
            Sorry, the position <strong style="color:#1a2e1d;">${jobTitle}</strong> is currently not accepting applications.
        </p>
        <p style="color:#94a396;font-size:0.88rem;line-height:1.6;margin-bottom:28px;">
            This role may re-open soon. Please explore other openings or check back in a few days.
        </p>
        <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
            <button onclick="document.getElementById('jobClosedOverlay').remove()" class="btn btn-outline" style="padding:11px 28px;border-radius:14px;font-weight:600;">
                <i class="fas fa-arrow-left"></i> Go Back
            </button>
            <button onclick="document.getElementById('jobClosedOverlay').remove();window.scrollTo({top:document.getElementById('jobsContainer').offsetTop-100,behavior:'smooth'})" class="btn" style="padding:11px 28px;border-radius:14px;font-weight:600;">
                <i class="fas fa-search"></i> Browse Jobs
            </button>
        </div>
    `;

    overlay.appendChild(popup);
    document.body.appendChild(overlay);

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
        `;
        document.head.appendChild(style);
    }
}

function closeApplyModal() {
    document.getElementById('applyModal').classList.remove('active');
    document.body.style.overflow = '';
    resetFileUploads();
}

function resetFileUploads() {
    const resumeArea = document.getElementById('resumeUploadArea');
    if (resumeArea) {
        resumeArea.classList.remove('uploaded');
        document.getElementById('resumeFileName').innerHTML = 'Click to upload your resume';
    }
    const photoArea = document.getElementById('photoUploadArea');
    if (photoArea) {
        photoArea.classList.remove('uploaded');
        document.getElementById('photoFileName').innerHTML = 'Click to upload your photo';
    }
}

// ══════════════════════════════════════════════════════════
// FILE UPLOAD VALIDATION
// ══════════════════════════════════════════════════════════
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_PHOTO_SIZE_KB = 100;
const MAX_RESUME_SIZE_MB = 1;

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

// ══════════════════════════════════════════════════════════
// FORM SUBMISSION
// ══════════════════════════════════════════════════════════
async function handleApply(e) {
    e.preventDefault();
    const form = document.getElementById('applicationForm');
    const submitBtn = document.getElementById('applySubmitBtn');
    const originalHTML = submitBtn.innerHTML;

    // Pre-submit file validation
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

    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
    submitBtn.disabled = true;

    try {
        const formData = new FormData(form);
        const res = await fetch('/apply-job', {
            method: 'POST',
            body: formData
        });

        const data = await res.json();
        if (res.ok && data.status === 'success') {
            closeApplyModal();
            form.reset();
            resetFileUploads();
            showSuccessPopup();
        } else {
            alert(data.message || 'Error submitting application.');
        }
    } catch (err) {
        console.error(err);
        alert('An error occurred. Please try again.');
    } finally {
        submitBtn.innerHTML = originalHTML;
        submitBtn.disabled = false;
    }
}

function showSuccessPopup() {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(15,23,20,0.6);z-index:2000;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);animation:fadeIn .3s ease;padding:20px';
    const popup = document.createElement('div');
    popup.style.cssText = 'background:white;border-radius:24px;padding:44px 36px;text-align:center;max-width:440px;width:90%;animation:modalSlideIn .45s cubic-bezier(.4,0,.2,1);box-shadow:0 30px 80px rgba(0,0,0,0.2)';
    popup.innerHTML = `
        <div style="width:76px;height:76px;border-radius:20px;background:linear-gradient(135deg,#E8F5E9,#C8E6C9);display:flex;align-items:center;justify-content:center;margin:0 auto 22px;">
            <i class="fas fa-check" style="font-size:2rem;color:#2E7D32;"></i>
        </div>
        <h3 style="font-size:1.5rem;margin-bottom:10px;color:#1a2e1d;font-family:'Poppins',sans-serif;font-weight:700;">Application Sent!</h3>
        <p style="color:#5a6b5c;margin-bottom:24px;line-height:1.7;font-size:0.95rem;">Your application has been submitted successfully.<br>We will review it and get back to you soon.</p>
        <button onclick="this.closest('div[style]').parentElement.remove()" class="btn" style="padding:13px 40px;border-radius:14px;">Got it!</button>
    `;
    overlay.appendChild(popup);
    document.body.appendChild(overlay);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
}

// ══════════════════════════════════════════════════════════
// FAQ TOGGLE
// ══════════════════════════════════════════════════════════
function toggleFaq(element) {
    const item = element.closest('.faq-item');
    // Close other open FAQs
    document.querySelectorAll('.faq-item.active').forEach(el => {
        if (el !== item) el.classList.remove('active');
    });
    item.classList.toggle('active');
}

// ══════════════════════════════════════════════════════════
// FILTER EVENT LISTENERS
// ══════════════════════════════════════════════════════════
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
        document.body.style.overflow = '';
    }
});

// Close modals on Escape key
window.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal.active').forEach(modal => {
            modal.classList.remove('active');
        });
        document.body.style.overflow = '';
        const closedOverlay = document.getElementById('jobClosedOverlay');
        if (closedOverlay) closedOverlay.remove();
    }
});

// ══════════════════════════════════════════════════════════
// SCROLL ANIMATIONS (Intersection Observer)
// ══════════════════════════════════════════════════════════
function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.animate-on-scroll').forEach(el => {
        if (!el.classList.contains('is-visible')) {
            observer.observe(el);
        }
    });
}

// Initialize animations on page load
document.addEventListener('DOMContentLoaded', initScrollAnimations);
