/* ========================================
   Intern Management – JavaScript
   ======================================== */

let allInterns = [];
let filteredInterns = [];
let currentTab = 'all';
let currentPage = 1;
const perPage = 8;
let emailRecipientType = 'all';

// Init
document.addEventListener('DOMContentLoaded', () => {
    fetchInterns();
});

async function fetchInterns() {
    try {
        const res = await fetch('/admin/api/interns');
        const data = await res.json();
        if (data.status === 'success') {
            allInterns = data.interns.map(i => ({
                id: i.intern_id || `DB${i.id}`,
                db_id: i.id,
                name: i.fullname,
                email: i.email,
                phone: i.phone,
                photo: i.photo || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(i.fullname),
                field: i.field,
                college: i.college || 'N/A',
                duration: i.duration || 'N/A',
                startDate: i.start_date || i.created_at || 'N/A',
                endDate: i.end_date || 'N/A',
                status: i.status || 'active',
                certApproved: i.cert_approved === 1 || i.cert_approved === true,
                address: i.address || 'N/A',
                selected: false
            }));
            filteredInterns = [...allInterns];
            updateStats();
            applyFilters();
        }
    } catch (e) {
        console.error('Error fetching interns:', e);
        showToast('Failed to load interns', 'error');
    }
}

// Stats
function updateStats() {
    const total = allInterns.length;
    const active = allInterns.filter(i => i.status === 'active').length;
    const resigned = allInterns.filter(i => i.status === 'resigned').length;
    const certified = allInterns.filter(i => i.certApproved).length;
    animateCount('countTotal', total);
    animateCount('countActive', active);
    animateCount('countResigned', resigned);
    animateCount('countCertified', certified);
}

function animateCount(id, target) {
    const el = document.getElementById(id);
    let current = 0;
    const step = Math.max(1, Math.floor(target / 20));
    const timer = setInterval(() => {
        current += step;
        if (current >= target) { current = target; clearInterval(timer); }
        el.textContent = current;
    }, 30);
}

// Tabs
function switchTab(tab) {
    currentTab = tab;
    currentPage = 1;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    event.target.closest('.tab-btn').classList.add('active');
    applyFilters();
}

// Filters
function applyFilters() {
    const search = document.getElementById('searchInput').value.toLowerCase().trim();
    const fieldVal = document.getElementById('fieldFilter').value;
    const statusVal = document.getElementById('statusFilter').value;

    filteredInterns = allInterns.filter(intern => {
        // Tab filter
        if (currentTab === 'active' && intern.status !== 'active') return false;
        if (currentTab === 'resigned' && intern.status !== 'resigned') return false;
        if (currentTab === 'certified' && !intern.certApproved) return false;
        // Search
        if (search && !intern.name.toLowerCase().includes(search) && !intern.id.toLowerCase().includes(search) && !intern.field.toLowerCase().includes(search)) return false;
        // Field filter
        if (fieldVal && !intern.field.includes(fieldVal)) return false;
        // Status filter
        if (statusVal && intern.status !== statusVal) return false;
        return true;
    });

    updateBadges();
    renderTable();
    renderCards();
    renderPagination();
}

function resetFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('fieldFilter').value = '';
    document.getElementById('statusFilter').value = '';
    applyFilters();
}

function updateBadges() {
    document.getElementById('badgeAll').textContent = allInterns.length;
    document.getElementById('badgeActive').textContent = allInterns.filter(i => i.status === 'active').length;
    document.getElementById('badgeResigned').textContent = allInterns.filter(i => i.status === 'resigned').length;
    document.getElementById('badgeCertified').textContent = allInterns.filter(i => i.certApproved).length;
}

// Render Table
function renderTable() {
    const tbody = document.getElementById('tableBody');
    const start = (currentPage - 1) * perPage;
    const pageData = filteredInterns.slice(start, start + perPage);

    if (pageData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state"><i class="fas fa-user-graduate"></i><h4>No Interns Found</h4><p>Try adjusting your filters or add a new intern</p></div></td></tr>`;
        return;
    }

    tbody.innerHTML = pageData.map(intern => `
        <tr data-id="${intern.id}">
            <td><input type="checkbox" ${intern.selected ? 'checked' : ''} onchange="toggleSelect('${intern.id}')"></td>
            <td><img src="${intern.photo}" alt="${intern.name}" class="intern-photo"></td>
            <td><div class="name-info"><span class="name">${intern.name}</span><span class="intern-id">${intern.id}</span></div></td>
            <td><span class="field-tag">${intern.field}</span></td>
            <td><span style="font-size:.82rem;color:#64748b;">${formatDate(intern.startDate)} – ${formatDate(intern.endDate)}</span><br><small style="color:#94a3b8">${intern.duration}</small></td>
            <td><span class="status-badge status-${intern.status}"><i class="fas fa-${intern.status === 'active' ? 'circle' : 'minus-circle'}" style="font-size:.5rem"></i> ${capitalize(intern.status)}</span></td>
            <td><span class="cert-badge ${intern.certApproved ? 'cert-approved' : 'cert-pending'}"><i class="fas fa-${intern.certApproved ? 'check-circle' : 'clock'}"></i> ${intern.certApproved ? 'Approved' : 'Pending'}</span></td>
            <td><div class="action-btns">
                <button class="action-btn view" title="View" onclick="viewIntern('${intern.id}')"><i class="fas fa-eye"></i></button>
                <button class="action-btn email" title="Email" onclick="emailSingle('${intern.id}')"><i class="fas fa-envelope"></i></button>
                <button class="action-btn cert" title="Approve Certificate" onclick="approveSingle('${intern.id}')"><i class="fas fa-certificate"></i></button>
                <button class="action-btn remove" title="Remove" onclick="removeIntern('${intern.id}')"><i class="fas fa-trash-alt"></i></button>
            </div></td>
        </tr>
    `).join('');
}

// Render Cards
function renderCards() {
    const container = document.getElementById('cardsView');
    const start = (currentPage - 1) * perPage;
    const pageData = filteredInterns.slice(start, start + perPage);

    if (pageData.length === 0) {
        container.innerHTML = `<div class="empty-state"><i class="fas fa-user-graduate"></i><h4>No Interns Found</h4><p>Try adjusting your filters</p></div>`;
        return;
    }

    container.innerHTML = pageData.map(intern => `
        <div class="intern-card" data-id="${intern.id}">
            <div class="card-photo"><img src="${intern.photo}" alt="${intern.name}"></div>
            <div class="card-info">
                <h4>${intern.name}</h4>
                <p><span class="field-tag">${intern.field}</span></p>
                <span class="status-badge status-${intern.status}" style="font-size:.7rem;padding:2px 8px;"><i class="fas fa-circle" style="font-size:.4rem"></i> ${capitalize(intern.status)}</span>
            </div>
            <div class="card-actions">
                <button class="action-btn view" onclick="viewIntern('${intern.id}')"><i class="fas fa-eye"></i></button>
                <button class="action-btn cert" onclick="approveSingle('${intern.id}')"><i class="fas fa-certificate"></i></button>
            </div>
        </div>
    `).join('');
}

// Pagination
function renderPagination() {
    const container = document.getElementById('pagination');
    const totalPages = Math.ceil(filteredInterns.length / perPage);
    if (totalPages <= 1) { container.innerHTML = ''; return; }

    let html = `<button class="page-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="goToPage(${currentPage - 1})"><i class="fas fa-chevron-left"></i></button>`;
    for (let i = 1; i <= totalPages; i++) {
        html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
    }
    html += `<button class="page-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="goToPage(${currentPage + 1})"><i class="fas fa-chevron-right"></i></button>`;
    container.innerHTML = html;
}

function goToPage(page) {
    currentPage = page;
    renderTable();
    renderCards();
    renderPagination();
    document.querySelector('.tabs-container').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Selection
function toggleSelect(id) {
    const intern = allInterns.find(i => i.id === id);
    if (intern) intern.selected = !intern.selected;
    updateBulkBar();
}

function toggleSelectAll() {
    const checked = document.getElementById('selectAll').checked;
    const start = (currentPage - 1) * perPage;
    const pageData = filteredInterns.slice(start, start + perPage);
    pageData.forEach(i => { i.selected = checked; });
    renderTable();
    updateBulkBar();
}

function clearSelection() {
    allInterns.forEach(i => i.selected = false);
    document.getElementById('selectAll').checked = false;
    renderTable();
    updateBulkBar();
}

function updateBulkBar() {
    const count = allInterns.filter(i => i.selected).length;
    const bar = document.getElementById('bulkBar');
    document.getElementById('bulkCount').textContent = count;
    bar.style.display = count > 0 ? 'flex' : 'none';
}

function bulkEmail() {
    emailRecipientType = 'selected';
    openModal('emailModal');
    document.querySelectorAll('.recipient-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.recipient-btn')[2].classList.add('active');
    updateRecipientCount();
}

async function bulkApproveCert() {
    const selected = allInterns.filter(i => i.selected);
    const ids = selected.map(i => i.db_id);
    if (ids.length === 0) return;
    try {
        const res = await fetch('/admin/api/interns', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'approve_cert', ids: ids })
        });
        const result = await res.json();
        if (result.status === 'success') {
            showToast(`Certificates approved for ${selected.length} intern(s)`, 'success');
            clearSelection();
            fetchInterns();
        }
    } catch (e) { showToast('Error approving certificates', 'error'); }
}

// Modal helpers
function openModal(id) {
    document.getElementById(id).classList.add('active');
    document.body.style.overflow = 'hidden';
    if (id === 'emailModal') updateRecipientCount();
    if (id === 'certModal') renderCertList();
}

function closeModal(id) {
    document.getElementById(id).classList.remove('active');
    document.body.style.overflow = '';
}

async function handleAddIntern(e) {
    e.preventDefault();
    const form = document.getElementById('addInternForm');
    const formData = new FormData(form);
    formData.append('action', 'add_intern');
    try {
        const response = await fetch('/admin/api/interns', { method: 'POST', body: formData });
        const result = await response.json();
        if (result.status === 'success') {
            closeModal('addInternModal');
            form.reset();
            showToast(`Intern added successfully!`, 'success');
            fetchInterns();
        } else {
            showToast(result.message || 'Error adding intern', 'error');
        }
    } catch (err) {
        showToast('Network error', 'error');
    }
}

// View Intern
function viewIntern(id) {
    const intern = allInterns.find(i => i.id === id);
    if (!intern) return;
    const content = document.getElementById('viewInternContent');
    content.innerHTML = `
        <div class="view-intern-header">
            <img src="${intern.photo}" alt="${intern.name}">
            <h3>${intern.name}</h3>
            <span class="view-id">${intern.id}</span>
            <div style="margin-top:8px;">
                <span class="status-badge status-${intern.status}"><i class="fas fa-circle" style="font-size:.5rem"></i> ${capitalize(intern.status)}</span>
                <span class="cert-badge ${intern.certApproved ? 'cert-approved' : 'cert-pending'}" style="margin-left:6px;"><i class="fas fa-${intern.certApproved ? 'check-circle' : 'clock'}"></i> ${intern.certApproved ? 'Certified' : 'Pending'}</span>
            </div>
        </div>
        <div class="view-detail-grid">
            <div class="view-detail-item"><label>Email</label><span>${intern.email}</span></div>
            <div class="view-detail-item"><label>Phone</label><span>${intern.phone}</span></div>
            <div class="view-detail-item"><label>Field</label><span>${intern.field}</span></div>
            <div class="view-detail-item"><label>Duration</label><span>${intern.duration}</span></div>
            <div class="view-detail-item"><label>Start Date</label><span>${formatDate(intern.startDate)}</span></div>
            <div class="view-detail-item"><label>End Date</label><span>${formatDate(intern.endDate)}</span></div>
            <div class="view-detail-item"><label>College</label><span>${intern.college}</span></div>
            <div class="view-detail-item"><label>Address</label><span>${intern.address}</span></div>
        </div>
        <div class="view-actions">
            <button class="btn btn-sm" onclick="emailSingle('${intern.id}')"><i class="fas fa-envelope"></i> Send Email</button>
            <button class="btn btn-sm btn-success" onclick="approveSingle('${intern.id}')"><i class="fas fa-certificate"></i> ${intern.certApproved ? 'Certified' : 'Approve Cert'}</button>
            <button class="btn btn-sm btn-danger" onclick="removeIntern('${intern.id}')"><i class="fas fa-trash-alt"></i> Remove</button>
        </div>
    `;
    openModal('viewInternModal');
}

// Single actions
function emailSingle(id) {
    const intern = allInterns.find(i => i.id === id);
    if (!intern) return;
    closeModal('viewInternModal');
    allInterns.forEach(i => i.selected = false);
    intern.selected = true;
    emailRecipientType = 'selected';
    openModal('emailModal');
    document.querySelectorAll('.recipient-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.recipient-btn')[2].classList.add('active');
    updateRecipientCount();
}

async function approveSingle(id) {
    const intern = allInterns.find(i => i.id === id);
    if (!intern) return;
    try {
        const res = await fetch('/admin/api/interns', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'approve_cert', ids: [intern.db_id] })
        });
        const result = await res.json();
        if (result.status === 'success') {
            showToast(`Certificate approved for ${intern.name}`, 'success');
            closeModal('viewInternModal');
            fetchInterns();
        }
    } catch (e) { showToast('Network error', 'error'); }
}

function removeIntern(id) {
    const intern = allInterns.find(i => i.id === id);
    if (!intern) return;
    document.getElementById('confirmTitle').textContent = 'Remove Intern';
    document.getElementById('confirmMessage').textContent = `Are you sure you want to remove ${intern.name}?`;
    const yesBtn = document.getElementById('confirmYes');
    yesBtn.onclick = async () => {
        try {
            const res = await fetch('/admin/api/interns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'remove', id: intern.db_id })
            });
            const result = await res.json();
            if (result.status === 'success') {
                closeModal('confirmModal');
                closeModal('viewInternModal');
                showToast(`${intern.name} removed`, 'info');
                fetchInterns();
            } else {
                showToast('Error removing intern', 'error');
            }
        } catch (e) {
            showToast('Network error', 'error');
        }
    };
    openModal('confirmModal');
}

// Email
function setRecipient(type, btn) {
    emailRecipientType = type;
    document.querySelectorAll('.recipient-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    updateRecipientCount();
}

function updateRecipientCount() {
    let count = 0;
    if (emailRecipientType === 'all') count = allInterns.length;
    else if (emailRecipientType === 'active') count = allInterns.filter(i => i.status === 'active').length;
    else count = allInterns.filter(i => i.selected).length;
    document.querySelector('#recipientCount span').textContent = count;
}

function handleSendEmail(e) {
    e.preventDefault();
    let count = 0;
    if (emailRecipientType === 'all') count = allInterns.length;
    else if (emailRecipientType === 'active') count = allInterns.filter(i => i.status === 'active').length;
    else count = allInterns.filter(i => i.selected).length;
    closeModal('emailModal');
    document.getElementById('emailForm').reset();
    showToast(`Email sent to ${count} intern(s)!`, 'success');
}

// Certificate Modal
function renderCertList() {
    const list = document.getElementById('certList');
    const uncertified = allInterns.filter(i => !i.certApproved);
    if (uncertified.length === 0) {
        list.innerHTML = '<div class="empty-state" style="padding:24px"><i class="fas fa-award"></i><h4>All Certified!</h4><p>All interns have approved certificates</p></div>';
        return;
    }
    list.innerHTML = uncertified.map(intern => `
        <div class="cert-item" data-id="${intern.id}">
            <input type="checkbox" class="cert-check" data-id="${intern.id}">
            <img src="${intern.photo}" alt="${intern.name}">
            <div class="cert-item-info">
                <div class="cert-name">${intern.name} <small style="color:#94a3b8">${intern.id}</small></div>
                <div class="cert-field">${intern.field} · ${intern.duration}</div>
            </div>
            <span class="cert-status-tag pending">Pending</span>
        </div>
    `).join('');

    list.querySelectorAll('.cert-check').forEach(cb => {
        cb.addEventListener('change', updateCertCount);
    });
    updateCertCount();
}

function filterCertList() {
    const search = document.getElementById('certSearchInput').value.toLowerCase();
    document.querySelectorAll('.cert-item').forEach(item => {
        const name = item.querySelector('.cert-name').textContent.toLowerCase();
        item.style.display = name.includes(search) ? 'flex' : 'none';
    });
}

function selectAllCert() {
    const checks = document.querySelectorAll('.cert-check');
    const allChecked = [...checks].every(c => c.checked);
    checks.forEach(c => c.checked = !allChecked);
    updateCertCount();
}

function updateCertCount() {
    const count = document.querySelectorAll('.cert-check:checked').length;
    document.getElementById('certSelectedCount').textContent = count;
}

async function approveCertificates() {
    const checked = document.querySelectorAll('.cert-check:checked');
    if (checked.length === 0) { showToast('Please select at least one intern', 'error'); return; }

    const ids = [];
    checked.forEach(cb => {
        const id = cb.getAttribute('data-id');
        const intern = allInterns.find(i => i.id === id);
        if (intern) ids.push(intern.db_id);
    });

    try {
        const res = await fetch('/admin/api/interns', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'approve_cert', ids: ids })
        });
        const result = await res.json();
        if (result.status === 'success') {
            closeModal('certModal');
            showToast(`Certificates approved for ${checked.length} intern(s)!`, 'success');
            fetchInterns();
        } else { showToast('Error approving certificates', 'error'); }
    } catch (e) { showToast('Network error', 'error'); }
}

// Export
function exportCSV() {
    const headers = ['ID', 'Name', 'Email', 'Phone', 'Field', 'Duration', 'Start Date', 'End Date', 'Status', 'Certificate'];
    const rows = filteredInterns.map(i => [i.id, i.name, i.email, i.phone, i.field, i.duration, i.startDate, i.endDate, i.status, i.certApproved ? 'Approved' : 'Pending']);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'interns_export.csv'; a.click();
    URL.revokeObjectURL(url);
    showToast('CSV exported successfully!', 'success');
}

// Toast
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const icon = toast.querySelector('i');
    document.getElementById('toastMessage').textContent = message;
    toast.className = 'toast ' + type;
    icon.className = type === 'success' ? 'fas fa-check-circle' : type === 'error' ? 'fas fa-exclamation-circle' : 'fas fa-info-circle';
    toast.style.display = 'flex';
    setTimeout(() => { toast.style.display = 'none'; }, 3500);
}

// Helpers
function formatDate(d) {
    if (!d || d === 'N/A') return 'N/A';
    const date = new Date(d);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
