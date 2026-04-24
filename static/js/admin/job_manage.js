// Mock Data -> Now fetched from API
let jobs = [];
let applicants = [];
let interviews = [];

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
    } catch (e) {
        console.error("Error loading data:", e);
        showToast("Error loading data");
    }
}

function updateStats() {
    const totalJobs = jobs.length;
    const activeJobs = jobs.filter(j => j.status === 'active').length;
    const totalApplicants = applicants.length;
    const interviewStage = applicants.filter(a => a.status === 'interview').length;
    const selected = applicants.filter(a => a.status === 'selected').length;
    const rejected = applicants.filter(a => a.status === 'rejected').length;
    document.getElementById('statsContainer').innerHTML = `
    <div class="stat-card"><div class="stat-number">${totalJobs}</div><div class="stat-label">Total Jobs</div></div>
    <div class="stat-card"><div class="stat-number">${activeJobs}</div><div class="stat-label">Active Jobs</div></div>
    <div class="stat-card"><div class="stat-number">${totalApplicants}</div><div class="stat-label">Total Applicants</div></div>
    <div class="stat-card"><div class="stat-number">${interviewStage}</div><div class="stat-label">Interview Stage</div></div>
    <div class="stat-card"><div class="stat-number">${selected}</div><div class="stat-label">Selected</div></div>
    <div class="stat-card"><div class="stat-number">${rejected}</div><div class="stat-label">Rejected</div></div>
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
        grid.innerHTML = filtered.map(j => {
            const jc = j.created || j.posted || "N/A";
            const d = j.deadline || "N/A";
            const appCount = applicants.filter(a => String(a.jobId) === String(j.id)).length;
            return `<div class="job-card ${j.status === 'closed' ? 'closed' : j.status === 'draft' ? 'draft' : ''}"><div class="job-title">${j.title}</div><div class="job-meta"><span><i class="fas fa-map-marker-alt"></i> ${j.location}</span><span><i class="fas fa-clock"></i> ${j.type}</span></div><div class="job-stats"><span>📄 Applicants: ${appCount}</span><span>📅 Posted: ${jc}</span><span>⏳ Deadline: ${d}</span></div><div class="job-actions"><button class="btn-sm btn-outline" onclick="viewApplicantsByJob(${j.id})">View Applicants</button><button class="btn-sm btn-outline" onclick="editJob(${j.id})">Edit</button><button class="btn-sm btn-danger" onclick="toggleJobStatus(${j.id}, '${j.status}')">${j.status === 'active' ? 'Close Job' : 'Activate'}</button></div></div>`;
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
    alert("Edit job " + id + " - UI integration pending.");
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
        tbody.innerHTML = filtered.map(a => {
            const jTitle = jobs.find(j => String(j.id) === String(a.jobId))?.title || a.jobId;
            const photoTd = a.photo ? `<img src="${a.photo}" width="36" height="36" style="border-radius:50%;object-fit:cover">` : `<i class="fas fa-user-circle fa-2x"></i>`;
            return `<tr><td><input type="checkbox" class="applicantCheck" data-id="${a.id}"></td><td>${photoTd}</td><td>${a.name}<br><small>${a.email}</small></td><td>${a.phone}</td><td>${jTitle}</td><td>${a.experience || '--'}</td><td><button class="icon-btn-sm" onclick="viewResume('${a.resume}')"><i class="fas fa-file-pdf"></i></button></td><td><span class="status-badge status-${a.status}">${a.status}</span></td><td><div class="action-btns"><button class="icon-btn-sm" onclick="viewApplicant(${a.id})"><i class="fas fa-eye"></i></button><button class="icon-btn-sm" onclick="updateApplicantStatus(${a.id}, 'shortlisted')"><i class="fas fa-star"></i></button><button class="icon-btn-sm" onclick="updateApplicantStatus(${a.id}, 'rejected')"><i class="fas fa-times"></i></button><button class="icon-btn-sm" onclick="openInterviewModal(${a.id})"><i class="fas fa-calendar"></i></button></div></td></tr>`;
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
    let jobTitle = jobs.find(j => String(j.id) === String(a.jobId))?.title || a.jobId;
    const detailPhoto = a.photo ? `<img src="${a.photo}" width="80" style="border-radius:50%;object-fit:cover">` : `<i class="fas fa-user-circle" style="font-size:80px;color:#94a3b8"></i>`;
    document.getElementById('applicantDetail').innerHTML = `${detailPhoto}<h3>${a.name}</h3><p>Email: ${a.email}<br>Phone: ${a.phone}<br>Job: ${jobTitle}<br>Experience: ${a.experience || '--'}<br>Skills: ${a.skills || '--'}<br>Notes: ${a.notes || '--'}</p><button class="btn-sm" onclick="openInterviewModal(${a.id})">Send Interview</button> <button class="btn-sm btn-danger" onclick="updateApplicantStatus(${a.id}, 'rejected')">Reject</button>`;
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

document.getElementById('interviewForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    let id = parseInt(document.getElementById('interviewApplicantId').value);
    updateApplicantStatus(id, 'interview');
    showToast('Interview invitation sent');
    closeModals();
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
    let html = `<div class="kanban-board" id="kanbanBoard">`;
    stages.forEach(stage => {
        let candidates = applicants.filter(a => a.status === stage);
        html += `<div class="kanban-column" data-stage="${stage}"><div class="column-header">${stage.toUpperCase()} <span>${candidates.length}</span></div><div class="column-cards">`;
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

// Create Job Modal
const jobModal = document.getElementById('jobModal');
document.getElementById('createJobBtn').onclick = () => {
    document.getElementById('jobModalTitle').innerText = 'Create Job';
    document.getElementById('jobForm').reset();
    jobModal.classList.add('active');
};

document.getElementById('jobForm').onsubmit = async (e) => {
    e.preventDefault();
    let newJob = {
        title: document.getElementById('jobTitle').value,
        department: document.getElementById('jobDept').value,
        type: document.getElementById('jobType').value,
        location: document.getElementById('jobLocation').value,
        salary: document.getElementById('jobSalary').value,
        desc: document.getElementById('jobDesc').value,
        requirements: document.getElementById('jobReq').value,
        deadline: document.getElementById('jobDeadline').value,
        status: 'active',
        posted: new Date().toISOString().slice(0, 10)
    };

    try {
        const res = await fetch('/admin/api/jobs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'create', job: newJob })
        });
        if (res.ok) {
            const data = await res.json();
            jobs = data.jobs;
            showToast('Job created');
            updateStats();
            renderJobs();
            closeModals();
        } else {
            showToast('Failed to create job');
        }
    } catch (e) {
        showToast('Error creating job');
    }
};

document.getElementById('saveDraftBtn')?.addEventListener('click', () => {
    alert('Save draft not implemented');
});

function closeModals() {
    document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
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
