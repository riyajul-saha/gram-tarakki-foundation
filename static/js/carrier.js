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
                            <button class="btn" onclick="openApplyModal('${job.title}')">Apply Now</button>
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
                <button class="btn" onclick="openApplyModal('${job.title}')">Apply Now</button>
            `;
    modal.classList.add('active');
}

function closeJobModal() {
    document.getElementById('jobModal').classList.remove('active');
}

// Apply modal
function openApplyModal(jobTitle) {
    document.getElementById('applyJobTitle').innerText = jobTitle;
    document.getElementById('applyModal').classList.add('active');
}

function closeApplyModal() {
    document.getElementById('applyModal').classList.remove('active');
}

function handleApply(e) {
    e.preventDefault();
    alert('Application submitted! (Demo) We will send you a confirmation email.');
    closeApplyModal();
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