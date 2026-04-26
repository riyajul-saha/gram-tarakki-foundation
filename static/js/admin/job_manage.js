// Mock Data -> Now fetched from API
let jobs = [];
let applicants = [];
let interviews = [];
let editingJobId = null; // Track which job is being edited

// Helper functions
function showToast(msg) {
    let toast = document.createElement('div'); toast.className = 'toast'; toast.innerHTML = `<i class="fas fa-check-circle" style="color:#22c55e"></i> ${msg}`;
    document.body.appendChild(toast); setTimeout(() => toast.remove(), 3000);
}

// Fetch data
async function loadData() {
    try {
        const jobsRes = await fetch('/admin/api/jobs');
        if (jobsRes.ok) jobs = await jobsRes.json();

        const appsRes = await fetch('/admin/api/applicants');
        if (appsRes.ok) applicants = await appsRes.json();

        // Map db columns to UI expectations
        applicants = applicants.map(a => ({
            ...a,
            name: a.fullname,
            jobId: a.position,
            stage: a.status.charAt(0).toUpperCase() + a.status.slice(1)
        }));

        updateStats();
        renderJobs();
        renderApplicants();
        renderPipeline();
        updateTabBadges();
    } catch (e) {
        console.error("Error loading data:", e);
        showToast("Error loading data");
    }
}

function updateTabBadges() {
    const jobsTab = document.querySelector('.tab-btn[data-tab="jobs"]');
    const applicantsTab = document.querySelector('.tab-btn[data-tab="applicants"]');
    const pipelineTab = document.querySelector('.tab-btn[data-tab="pipeline"]');
    if (jobsTab) jobsTab.innerHTML = `<i class="fas fa-briefcase"></i> Job Posts <span class="tab-badge">${jobs.length}</span>`;
    if (applicantsTab) applicantsTab.innerHTML = `<i class="fas fa-users"></i> Applicants <span class="tab-badge">${applicants.length}</span>`;
    if (pipelineTab) pipelineTab.innerHTML = `<i class="fas fa-columns"></i> Pipeline <span class="tab-badge">${applicants.length}</span>`;
}

function updateStats() {
    const totalJobs = jobs.length;
    const activeJobs = jobs.filter(j => j.status === 'active').length;
    const totalApplicants = applicants.length;
    const interviewStage = applicants.filter(a => a.status === 'interview').length;
    const selected = applicants.filter(a => a.status === 'selected').length;
    const rejected = applicants.filter(a => a.status === 'rejected').length;
    document.getElementById('statsContainer').innerHTML = `
    <div class="stat-card"><div class="stat-icon" style="color:#2563eb"><i class="fas fa-briefcase"></i></div><div class="stat-number">${totalJobs}</div><div class="stat-label">Total Jobs</div></div>
    <div class="stat-card"><div class="stat-icon" style="color:#22c55e"><i class="fas fa-check-circle"></i></div><div class="stat-number">${activeJobs}</div><div class="stat-label">Active Jobs</div></div>
    <div class="stat-card"><div class="stat-icon" style="color:#8b5cf6"><i class="fas fa-users"></i></div><div class="stat-number">${totalApplicants}</div><div class="stat-label">Total Applicants</div></div>
    <div class="stat-card"><div class="stat-icon" style="color:#f59e0b"><i class="fas fa-video"></i></div><div class="stat-number">${interviewStage}</div><div class="stat-label">Interview Stage</div></div>
    <div class="stat-card"><div class="stat-icon" style="color:#10b981"><i class="fas fa-user-check"></i></div><div class="stat-number">${selected}</div><div class="stat-label">Selected</div></div>
    <div class="stat-card"><div class="stat-icon" style="color:#ef4444"><i class="fas fa-user-times"></i></div><div class="stat-number">${rejected}</div><div class="stat-label">Rejected</div></div>
    `;
}

function renderJobs() {
    let html = `<div class="filter-bar"><div class="filter-left"><div class="search-input"><i class="fas fa-search"></i><input id="jobSearch" placeholder="Search job..."></div><select id="jobStatusFilter" class="filter-select"><option value="">All Status</option><option value="active">Active</option><option value="closed">Closed</option><option value="draft">Draft</option></select></div></div><div class="jobs-grid" id="jobsGrid"></div>`;
    document.getElementById('tabJobs').innerHTML = html;
    const grid = document.getElementById('jobsGrid');
    function filterJobs() {
        const search = document.getElementById('jobSearch').value.toLowerCase();
        const status = document.getElementById('jobStatusFilter').value;
        let filtered = jobs.filter(j => (j.title.toLowerCase().includes(search) || j.department.toLowerCase().includes(search)) && (!status || j.status === status));
        if (filtered.length === 0) {
            grid.innerHTML = `<div class="empty-state"><i class="fas fa-folder-open"></i><h3>No jobs found</h3><p>Try adjusting your search or filters, or create a new job post.</p></div>`;
            return;
        }
        grid.innerHTML = filtered.map(j => {
            const jc = j.created || j.posted || "N/A";
            const d = j.deadline || "N/A";
            const appCount = applicants.filter(a => String(a.jobId) === String(j.id)).length;
            const statusClass = j.status === 'closed' ? 'closed' : j.status === 'draft' ? 'draft' : '';
            const statusBadge = j.status === 'active' ? '<span class="job-status-badge active"><i class="fas fa-circle"></i> Active</span>' :
                j.status === 'closed' ? '<span class="job-status-badge closed"><i class="fas fa-circle"></i> Closed</span>' :
                    '<span class="job-status-badge draft"><i class="fas fa-circle"></i> Draft</span>';
            return `<div class="job-card ${statusClass}">
                <div class="job-card-header">
                    <div class="job-title">${j.title}</div>
                    ${statusBadge}
                </div>
                <div class="job-dept"><i class="fas fa-building"></i> ${j.department || 'General'}</div>
                <div class="job-meta">
                    <span><i class="fas fa-map-marker-alt"></i> ${j.location}</span>
                    <span><i class="fas fa-clock"></i> ${j.type}</span>
                    <span><i class="fas fa-money-bill-wave"></i> ${j.salary || 'N/A'}</span>
                </div>
                <div class="job-stats">
                    <div class="job-stat-item"><i class="fas fa-file-alt"></i><span>${appCount}</span><small>Applicants</small></div>
                    <div class="job-stat-item"><i class="fas fa-calendar-plus"></i><span>${jc}</span><small>Posted</small></div>
                    <div class="job-stat-item"><i class="fas fa-calendar-times"></i><span>${d}</span><small>Deadline</small></div>
                </div>
                <div class="job-actions">
                    <button class="btn-action btn-view" onclick="viewApplicantsByJob(${j.id})" title="View Applicants"><i class="fas fa-users"></i> Applicants</button>
                    <button class="btn-action btn-edit" onclick="editJob(${j.id})" title="Edit Job"><i class="fas fa-pen"></i> Edit</button>
                    <button class="btn-action ${j.status === 'active' ? 'btn-close-job' : 'btn-activate'}" onclick="toggleJobStatus(${j.id}, '${j.status}')" title="${j.status === 'active' ? 'Close Job' : 'Activate'}"><i class="fas ${j.status === 'active' ? 'fa-times-circle' : 'fa-play-circle'}"></i> ${j.status === 'active' ? 'Close' : 'Activate'}</button>
                    <button class="btn-action btn-delete" onclick="deleteJob(${j.id})" title="Permanently Delete"><i class="fas fa-trash-alt"></i> Delete</button>
                </div>
            </div>`;
        }).join('');
    }
    document.getElementById('jobSearch').addEventListener('input', filterJobs);
    document.getElementById('jobStatusFilter').addEventListener('change', filterJobs);
    filterJobs();
}

function viewApplicantsByJob(jobId) {
    document.querySelector('.tab-btn[data-tab="applicants"]').click();
    setTimeout(() => {
        const filter = document.getElementById('jobFilter');
        if (filter) {
            filter.value = jobId;
            filter.dispatchEvent(new Event('change'));
        }
    }, 100);
}

function editJob(id) {
    const job = jobs.find(j => j.id === id);
    if (!job) return;

    editingJobId = id;

    // Update modal title & button text
    document.getElementById('jobModalTitle').innerText = 'Edit Job Details';
    const submitBtn = document.querySelector('#jobForm button[type="submit"]');
    if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-save"></i> Save Changes';

    // Pre-fill the form fields
    document.getElementById('jobTitle').value = job.title || '';
    document.getElementById('jobDept').value = job.department || '';
    document.getElementById('jobType').value = job.type || 'Full-time';
    document.getElementById('jobLocation').value = job.location || '';
    document.getElementById('jobSalary').value = job.salary || '';
    document.getElementById('jobDesc').value = job.desc || '';
    // requirements may be an array – join with newlines for textarea
    const reqVal = Array.isArray(job.requirements) ? job.requirements.join('\n') : (job.requirements || '');
    document.getElementById('jobReq').value = reqVal;
    document.getElementById('jobDeadline').value = job.deadline || '';

    // Open modal
    document.getElementById('jobModal').classList.add('active');
}

function deleteJob(id) {
    const job = jobs.find(j => j.id === id);
    if (!job) return;

    // Build and show a custom confirmation modal
    let overlay = document.getElementById('deleteConfirmModal');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'deleteConfirmModal';
        overlay.className = 'modal';
        document.body.appendChild(overlay);
    }
    overlay.innerHTML = `
        <div class="modal-content delete-confirm-content">
            <div class="delete-confirm-icon"><i class="fas fa-exclamation-triangle"></i></div>
            <h2>Delete Job Permanently?</h2>
            <p>Are you sure you want to permanently delete <strong>${job.title}</strong>? This action cannot be undone and all data associated with this job will be removed.</p>
            <div class="delete-confirm-actions">
                <button class="btn btn-outline" onclick="cancelDeleteJob()"><i class="fas fa-arrow-left"></i> Cancel</button>
                <button class="btn btn-danger" onclick="confirmDeleteJob(${id})"><i class="fas fa-trash-alt"></i> Yes, Delete</button>
            </div>
        </div>`;
    overlay.classList.add('active');
}

function cancelDeleteJob() {
    const modal = document.getElementById('deleteConfirmModal');
    if (modal) modal.classList.remove('active');
}

async function confirmDeleteJob(id) {
    cancelDeleteJob();
    try {
        const res = await fetch('/admin/api/jobs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'delete', id: id })
        });
        const data = await res.json();
        if (res.ok) {
            jobs = data.jobs || [];
            showToast('Job deleted permanently');
            updateStats();
            renderJobs();
            updateTabBadges();
        } else {
            showToast(data.message || 'Failed to delete job');
        }
    } catch (e) {
        console.error('Error deleting job:', e);
        showToast('Network error — please try again');
    }
}

async function toggleJobStatus(id, currentStatus) {
    const newStatus = currentStatus === 'active' ? 'closed' : 'active';
    try {
        const res = await fetch('/admin/api/jobs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'status', id: id, status: newStatus })
        });
        if (res.ok) {
            let job = jobs.find(j => j.id === id);
            if (job) job.status = newStatus;
            showToast(`Job ${newStatus === 'active' ? 'activated' : 'closed'}`);
            renderJobs();
            updateStats();
            updateTabBadges();
        }
    } catch (e) {
        showToast("Error updating job status");
    }
}

function renderApplicants() {
    let html = `<div class="filter-bar"><div class="filter-left"><div class="search-input"><i class="fas fa-search"></i><input id="applicantSearch" placeholder="Search..."></div><select id="statusFilter" class="filter-select"><option value="">All Status</option><option>applied</option><option>shortlisted</option><option>interview</option><option>selected</option><option>rejected</option></select><select id="jobFilter" class="filter-select"><option value="">All Jobs</option>${jobs.map(j => `<option value="${j.id}">${j.title}</option>`).join('')}</select></div><div><button class="btn-sm btn-outline" id="bulkReject">Bulk Reject</button><button class="btn-sm" id="bulkShortlist">Bulk Shortlist</button></div></div><div class="table-wrapper"><table><thead><tr><th><input type="checkbox" id="selectAll"></th><th>Photo</th><th>Name/Email</th><th>Phone</th><th>Applied For</th><th>Experience</th><th>Resume</th><th>Status</th><th>Actions</th></tr></thead><tbody id="applicantsTable"></tbody></table></div>`;
    document.getElementById('tabApplicants').innerHTML = html;
    function filterApplicants() {
        let search = document.getElementById('applicantSearch').value.toLowerCase();
        let status = document.getElementById('statusFilter').value;
        let jobId = document.getElementById('jobFilter').value;
        let filtered = applicants.filter(a => (a.name.toLowerCase().includes(search) || a.email.includes(search)) && (!status || a.status === status) && (!jobId || String(a.jobId) === String(jobId)));
        let tbody = document.getElementById('applicantsTable');
        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="9" class="empty-table"><i class="fas fa-inbox"></i><p>No applicants found</p></td></tr>`;
            attachBulkEvents();
            return;
        }
        tbody.innerHTML = filtered.map(a => {
            const matchedJob = jobs.find(j => String(j.id) === String(a.jobId));
            const jTitle = matchedJob ? matchedJob.title : a.jobId;
            const internBadge = (matchedJob && matchedJob.type === 'Internship') ? ' <span style="background:#8b5cf6;color:#fff;font-size:10px;padding:2px 6px;border-radius:4px;font-weight:600">Intern</span>' : '';
            const appliedForDisplay = jTitle + internBadge;
            const photoTd = a.photo ? `<img src="${a.photo}" width="36" height="36" style="border-radius:50%;object-fit:cover">` : `<i class="fas fa-user-circle fa-2x"></i>`;
            // After interview is scheduled, show Accept button instead of Shortlist
            // Once selected, hide both Shortlist/Accept and Interview buttons
            let shortlistOrAcceptBtn = '';
            let interviewBtn = '';
            if (a.status === 'selected') {
                // No shortlist/accept or interview actions needed
                shortlistOrAcceptBtn = '';
                interviewBtn = '';
            } else if (a.status === 'interview') {
                shortlistOrAcceptBtn = `<button class="icon-btn-sm" onclick="updateApplicantStatus(${a.id}, 'selected')" title="Accept" style="color:#10b981"><i class="fas fa-check-circle"></i></button>`;
                interviewBtn = `<button class="icon-btn-sm" onclick="openInterviewModal(${a.id})" title="Schedule Interview"><i class="fas fa-calendar"></i></button>`;
            } else {
                shortlistOrAcceptBtn = `<button class="icon-btn-sm" onclick="updateApplicantStatus(${a.id}, 'shortlisted')" title="Shortlist"><i class="fas fa-star"></i></button>`;
                interviewBtn = `<button class="icon-btn-sm" onclick="openInterviewModal(${a.id})" title="Schedule Interview"><i class="fas fa-calendar"></i></button>`;
            }
            return `<tr><td><input type="checkbox" class="applicantCheck" data-id="${a.id}"></td><td>${photoTd}</td><td>${a.name}<br><small>${a.email}</small></td><td>${a.phone}</td><td>${appliedForDisplay}</td><td>${a.experience || '--'}</td><td><button class="icon-btn-sm" onclick="viewResume('${a.resume}')"><i class="fas fa-file-pdf"></i></button></td><td><span class="status-badge status-${a.status}">${a.status}</span></td><td><div class="action-btns"><button class="icon-btn-sm" onclick="viewApplicant(${a.id})" title="View"><i class="fas fa-eye"></i></button>${shortlistOrAcceptBtn}<button class="icon-btn-sm" onclick="updateApplicantStatus(${a.id}, 'rejected')" title="Reject"><i class="fas fa-times"></i></button>${interviewBtn}</div></td></tr>`;
        }).join('');
        attachBulkEvents();
    }
    function attachBulkEvents() {
        const selectAll = document.getElementById('selectAll');
        if (selectAll) selectAll.onclick = (e) => document.querySelectorAll('.applicantCheck').forEach(cb => cb.checked = e.target.checked);
        document.getElementById('bulkReject').onclick = () => { document.querySelectorAll('.applicantCheck:checked').forEach(cb => updateApplicantStatus(parseInt(cb.dataset.id), 'rejected')); };
        document.getElementById('bulkShortlist').onclick = () => { document.querySelectorAll('.applicantCheck:checked').forEach(cb => updateApplicantStatus(parseInt(cb.dataset.id), 'shortlisted')); };
    }
    document.getElementById('applicantSearch').addEventListener('input', filterApplicants);
    document.getElementById('statusFilter').addEventListener('change', filterApplicants);
    document.getElementById('jobFilter').addEventListener('change', filterApplicants);
    filterApplicants();
}

function viewApplicant(id) {
    let a = applicants.find(a => a.id === id);
    const matchedJobDetail = jobs.find(j => String(j.id) === String(a.jobId));
    let jobTitle = matchedJobDetail ? matchedJobDetail.title : a.jobId;
    if (matchedJobDetail && matchedJobDetail.type === 'Internship') jobTitle += ' (Intern)';
    const detailPhoto = a.photo ? `<img src="${a.photo}" width="80" style="border-radius:50%;object-fit:cover">` : `<i class="fas fa-user-circle" style="font-size:80px;color:#94a3b8"></i>`;
    // Show Accept button if interview scheduled, hide actions if already selected
    let primaryBtn = '';
    if (a.status === 'selected') {
        // Already selected — no further action needed
        primaryBtn = '';
    } else if (a.status === 'interview') {
        primaryBtn = `<button class="btn-sm" style="background:#10b981" onclick="updateApplicantStatus(${a.id}, 'selected');closeModals()"><i class="fas fa-check-circle"></i> Accept</button>`;
    } else {
        primaryBtn = `<button class="btn-sm" onclick="openInterviewModal(${a.id})">Send Interview</button>`;
    }
    document.getElementById('applicantDetail').innerHTML = `${detailPhoto}<h3>${a.name}</h3><p>Email: ${a.email}<br>Phone: ${a.phone}<br>Job: ${jobTitle}<br>Experience: ${a.experience || '--'}<br>Skills: ${a.skills || '--'}<br>Notes: ${a.notes || '--'}</p>${primaryBtn} <button class="btn-sm btn-danger" onclick="updateApplicantStatus(${a.id}, 'rejected')">Reject</button>`;
    document.getElementById('applicantModal').classList.add('active');
}

async function updateApplicantStatus(id, newStatus) {
    try {
        const res = await fetch('/admin/api/applicants', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id, status: newStatus })
        });
        if (res.ok) {
            let a = applicants.find(a => a.id === id);
            if (a) a.status = newStatus;
            showToast(`Status updated to ${newStatus}`);
            renderApplicants();
            updateStats();
            renderPipeline();
            updateTabBadges();
        } else {
            showToast("Failed to update status");
        }
    } catch (e) {
        showToast("Error updating status");
    }
}

function openInterviewModal(id) {
    document.getElementById('interviewApplicantId').value = id;
    document.getElementById('interviewModal').classList.add('active');
}

document.getElementById('interviewType')?.addEventListener('change', (e) => {
    const label = document.getElementById('interviewLinkLabel');
    if (label) {
        label.innerText = e.target.value === 'Online' ? 'Meeting Link' : 'Location / Address';
    }
});

document.getElementById('interviewForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    let id = parseInt(document.getElementById('interviewApplicantId').value);

    let applicant = applicants.find(a => a.id === id);
    if (!applicant) return;

    let jobTitle = jobs.find(j => String(j.id) === String(applicant.jobId))?.title || applicant.jobId;

    const payload = {
        id: id,
        name: applicant.name,
        email: applicant.email,
        jobTitle: jobTitle,
        type: document.getElementById('interviewType').value,
        date: document.getElementById('interviewDate').value,
        time: document.getElementById('interviewTime').value,
        link_or_address: document.getElementById('interviewLink').value,
        message: document.getElementById('interviewMsg').value
    };

    try {
        const res = await fetch('/admin/api/schedule_interview', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            // Update status to 'interview' — this re-renders the table
            // so the Shortlist button becomes an Accept button
            await updateApplicantStatus(id, 'interview');
            showToast('Interview invitation sent — you can now Accept the candidate');
            closeModals();
        } else {
            const data = await res.json();
            showToast(data.message || 'Failed to send invite');
        }
    } catch (e) {
        console.error('Error sending interview invite:', e);
        showToast('Network error while sending invite');
    }
});

function viewResume(resume) {
    if (resume && resume !== 'null') {
        window.open(resume, '_blank');
    } else {
        alert("No resume available");
    }
}

function renderPipeline() {
    let stages = ['applied', 'shortlisted', 'interview', 'selected', 'rejected'];
    let stageIcons = { applied: 'fa-inbox', shortlisted: 'fa-star', interview: 'fa-video', selected: 'fa-user-check', rejected: 'fa-user-times' };
    let stageColors = { applied: '#0369a1', shortlisted: '#b45309', interview: '#1e40af', selected: '#065f46', rejected: '#b91c1c' };
    let html = `<div class="kanban-board" id="kanbanBoard">`;
    stages.forEach(stage => {
        let candidates = applicants.filter(a => a.status === stage);
        html += `<div class="kanban-column" data-stage="${stage}">
            <div class="column-header">
                <span><i class="fas ${stageIcons[stage]}" style="color:${stageColors[stage]}"></i> ${stage.toUpperCase()}</span>
                <span class="column-count">${candidates.length}</span>
            </div>
            <div class="column-cards">`;
        candidates.forEach(c => {
            html += `<div class="kanban-card" draggable="true" data-id="${c.id}"><strong>${c.name}</strong><br><small>${jobs.find(j => String(j.id) === String(c.jobId))?.title || c.jobId}</small><br><small>${c.experience || ''}</small></div>`;
        });
        html += `</div></div>`;
    });
    html += `</div>`;
    document.getElementById('tabPipeline').innerHTML = html;
    attachDragDrop();
}

function attachDragDrop() {
    let cards = document.querySelectorAll('.kanban-card');
    cards.forEach(card => {
        card.addEventListener('dragstart', (e) => { e.dataTransfer.setData('text/plain', card.dataset.id); });
    });
    let columns = document.querySelectorAll('.kanban-column');
    columns.forEach(col => {
        col.addEventListener('dragover', (e) => e.preventDefault());
        col.addEventListener('drop', (e) => {
            e.preventDefault();
            let id = parseInt(e.dataTransfer.getData('text/plain'));
            let newStage = col.dataset.stage;
            let applicant = applicants.find(a => a.id === id);
            if (applicant && applicant.status !== newStage) {
                updateApplicantStatus(id, newStage);
            }
        });
    });
}

// Create / Edit Job Modal
const jobModal = document.getElementById('jobModal');

document.getElementById('createJobBtn').onclick = () => {
    editingJobId = null;
    document.getElementById('jobModalTitle').innerText = 'Create Job';
    const submitBtn = document.querySelector('#jobForm button[type="submit"]');
    if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Publish';
    document.getElementById('jobForm').reset();
    jobModal.classList.add('active');
};

document.getElementById('jobForm').onsubmit = async (e) => {
    e.preventDefault();

    const jobPayload = {
        title: document.getElementById('jobTitle').value,
        department: document.getElementById('jobDept').value,
        type: document.getElementById('jobType').value,
        location: document.getElementById('jobLocation').value,
        salary: document.getElementById('jobSalary').value,
        desc: document.getElementById('jobDesc').value,
        requirements: document.getElementById('jobReq').value,
        deadline: document.getElementById('jobDeadline').value,
    };

    let bodyPayload;

    if (editingJobId !== null) {
        // Update existing job
        jobPayload.id = editingJobId;
        bodyPayload = { action: 'update', job: jobPayload };
    } else {
        // Create new job
        jobPayload.status = 'active';
        jobPayload.posted = new Date().toISOString().slice(0, 10);
        bodyPayload = { action: 'create', job: jobPayload };
    }

    try {
        const res = await fetch('/admin/api/jobs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyPayload)
        });
        const data = await res.json();
        if (res.ok) {
            jobs = data.jobs || [];
            const msg = editingJobId !== null ? 'Job updated successfully!' : 'Job published successfully!';
            showToast(msg);
            editingJobId = null;
            updateStats();
            renderJobs();
            updateTabBadges();
            closeModals();
        } else {
            const errMsg = data.message || 'Failed to save job';
            console.error('Save job failed:', res.status, errMsg);
            showToast(errMsg);
        }
    } catch (e) {
        console.error('Error saving job:', e);
        showToast('Network error — please try again');
    }
};

document.getElementById('saveDraftBtn')?.addEventListener('click', () => {
    alert('Save draft not implemented');
});

function closeModals() {
    document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
    editingJobId = null;
}

document.querySelectorAll('.close-modal').forEach(btn => btn.onclick = closeModals);

// Tab switching
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.querySelectorAll('.tab-pane').forEach(p => p.style.display = 'none');
        if (btn.dataset.tab === 'jobs') { document.getElementById('tabJobs').style.display = 'block'; renderJobs(); }
        else if (btn.dataset.tab === 'applicants') { document.getElementById('tabApplicants').style.display = 'block'; renderApplicants(); }
        else if (btn.dataset.tab === 'pipeline') { document.getElementById('tabPipeline').style.display = 'block'; renderPipeline(); }
    });
});

// Initialize
loadData();
