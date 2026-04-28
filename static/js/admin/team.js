let teamData = [];
let currentTab = 'pending'; // pending, active, all
let filteredData = [];

function filterData() {
    const search = document.getElementById('searchInput') ? document.getElementById('searchInput').value.toLowerCase() : '';
    const role = document.getElementById('roleFilter') ? document.getElementById('roleFilter').value : '';
    const status = document.getElementById('statusFilter') ? document.getElementById('statusFilter').value : '';
    
    filteredData = teamData.filter(item => {
        let match = true;
        const itemStatus = item.status ? item.status.toLowerCase() : '';
        
        if (currentTab === 'pending') {
            if (itemStatus !== 'pending') match = false;
        } else if (currentTab === 'active') {
            if (itemStatus !== 'active' && itemStatus !== 'approved' && itemStatus !== 'selected') match = false;
        } else if (currentTab === 'all') {
            if (!['selected', 'active', 'approved', 'resign', 'resigned', 'pending'].includes(itemStatus)) match = false;
        }
        
        if (search && (!item.name || !item.name.toLowerCase().includes(search)) && (!item.email || !item.email.toLowerCase().includes(search)) && (!item.phone || !item.phone.includes(search))) match = false;
        if (role && item.role !== role) match = false;
        if (status && item.status !== status) match = false;
        return match;
    });
    renderTable();
}

function renderTable() {
    const tableBody = document.getElementById('tableBody');
    const cardsView = document.getElementById('cardsView');
    if (!tableBody || !cardsView) return;

    let tableHtml = '', cardsHtml = '';
    
    if (filteredData.length === 0) {
        const emptyIcon = currentTab === 'pending' ? 'fa-inbox' : 'fa-users-slash';
        const emptyTitle = currentTab === 'pending' ? 'No Pending Requests' : 'No Records Found';
        const emptyMsg = currentTab === 'pending' ? 'All volunteer requests have been reviewed.' : 'No team members match this filter.';
        const emptyHtml = `<div class="empty-state"><i class="fas ${emptyIcon}"></i><h4>${emptyTitle}</h4><p>${emptyMsg}</p></div>`;
        tableHtml = `<tr><td colspan="6">${emptyHtml}</td></tr>`;
        cardsHtml = emptyHtml;
    }

    filteredData.forEach(item => {
        const itemStatus = item.status ? item.status.toLowerCase() : '';
        const statusDisplay = item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1) : 'Unknown';
        const statusClass = itemStatus === 'pending' ? 'status-pending' : ((itemStatus === 'active' || itemStatus === 'approved' || itemStatus === 'selected') ? 'status-active' : 'status-inactive');
        
        let actions = `
            <div class="action-btns">
                <button class="action-btn view" onclick="viewDetails('${item.source}', ${item.id})"><i class="fas fa-eye"></i></button>
        `;
        if (itemStatus === 'pending') {
            actions += `
                <button class="action-btn approve" onclick="confirmApprove('${item.source}', ${item.id})"><i class="fas fa-check"></i></button>
                <button class="action-btn reject" onclick="confirmReject('${item.source}', ${item.id})"><i class="fas fa-times"></i></button>
            `;
        } else if (itemStatus === 'active' || itemStatus === 'approved' || itemStatus === 'selected') {
            actions += `
                <button class="action-btn edit" onclick="editStaff('${item.source}', ${item.id})"><i class="fas fa-edit"></i></button>
                <button class="action-btn reject" onclick="confirmReject('${item.source}', ${item.id})"><i class="fas fa-times" title="Reject"></i></button>
            `;
        } else {
            actions += `
                <button class="action-btn remove" onclick="confirmRemove('${item.source}', ${item.id})"><i class="fas fa-trash" title="Delete"></i></button>
            `;
        }
        actions += `</div>`;

        let displayRole = item.role || 'N/A';
        const roleLower = displayRole.toLowerCase();
        const jt = (item.job_type || '').toLowerCase();
        
        if (jt === 'volunteer' || (item.source === 'volunteer' && !roleLower.includes('intern'))) {
             displayRole += ' <small>(vol)</small>';
        } else if (jt === 'internship' || (item.source === 'volunteer' && roleLower.includes('intern'))) {
             displayRole += ' <small>(intern)</small>';
        } else if (jt === 'staff' || item.source === 'staff') {
             displayRole += ' <small>(staff)</small>';
        }

        // Table row
        tableHtml += `
            <tr>
                <td><img src="${item.photo}" class="team-photo"></td>
                <td><div class="name-role"><span class="name">${item.name}</span><br><span class="email">${item.email}</span></div></td>
                <td>${displayRole}</td>
                <td>${item.phone || 'N/A'}</td>
                <td><span class="status-badge ${statusClass}">${statusDisplay}</span></td>
                <td>${actions}</td>
            </tr>
        `;

        // Card for mobile
        cardsHtml += `
            <div class="team-card">
                <div class="card-photo"><img src="${item.photo}"></div>
                <div class="card-info">
                    <h4>${item.name}</h4>
                    <p>${displayRole}</p>
                    <span class="status-badge ${statusClass}">${statusDisplay}</span>
                </div>
                <div class="card-actions">
                    <button class="action-btn view" onclick="viewDetails('${item.source}', ${item.id})"><i class="fas fa-eye"></i></button>
                    ${itemStatus === 'pending' ?
                `<button class="action-btn approve" onclick="confirmApprove('${item.source}', ${item.id})"><i class="fas fa-check"></i></button>
                         <button class="action-btn reject" onclick="confirmReject('${item.source}', ${item.id})"><i class="fas fa-times"></i></button>` :
                (itemStatus === 'active' || itemStatus === 'approved' || itemStatus === 'selected' ?
                `<button class="action-btn edit" onclick="editStaff('${item.source}', ${item.id})"><i class="fas fa-edit"></i></button>
                         <button class="action-btn reject" onclick="confirmReject('${item.source}', ${item.id})"><i class="fas fa-times"></i></button>` :
                `<button class="action-btn remove" onclick="confirmRemove('${item.source}', ${item.id})"><i class="fas fa-trash"></i></button>`)
            }
                </div>
            </div>
        `;
    });

    tableBody.innerHTML = tableHtml;
    cardsView.innerHTML = cardsHtml;
}

function updateCounts() {
    let pendingVolunteer = 0;
    let activeBoth = 0;
    let rejectedBoth = 0;
    let allCount = 0;

    teamData.forEach(item => {
        const status = item.status ? item.status.toLowerCase() : '';
        const isVolunteer = item.source === 'volunteer';
        const isStaff = item.source === 'staff';

        if (status === 'pending') pendingVolunteer++;
        if (status === 'active' || status === 'approved' || status === 'selected') activeBoth++;
        if (status === 'rejected') rejectedBoth++;
        
        if (['selected', 'active', 'approved', 'resign', 'resigned', 'pending'].includes(status)) {
            allCount++;
        }
    });

    const totalTeam = activeBoth + rejectedBoth;

    if (document.getElementById('countTotalTeam')) document.getElementById('countTotalTeam').innerText = totalTeam;
    if (document.getElementById('countPending')) document.getElementById('countPending').innerText = pendingVolunteer;
    if (document.getElementById('countActive')) document.getElementById('countActive').innerText = activeBoth;
    if (document.getElementById('countRejected')) document.getElementById('countRejected').innerText = rejectedBoth;

    if (document.getElementById('badgePending')) document.getElementById('badgePending').innerText = pendingVolunteer;
    if (document.getElementById('badgeActive')) document.getElementById('badgeActive').innerText = activeBoth;
    if (document.getElementById('badgeAll')) document.getElementById('badgeAll').innerText = allCount;
}

function switchTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    if (event && event.target) {
        if (event.target.classList.contains('tab-btn')) {
            event.target.classList.add('active');
        } else {
            event.target.closest('.tab-btn').classList.add('active');
        }
    }
    filterData();
}

function applyFilters() {
    filterData();
}

// View Details Modal
function viewDetails(source, id) {
    const item = teamData.find(i => i.id === id && i.source === source);
    if (!item) return;
    
    let displayRole = item.role || 'N/A';
    const roleLower = displayRole.toLowerCase();
    const jt = (item.job_type || '').toLowerCase();
    
    if (jt === 'volunteer' || (item.source === 'volunteer' && !roleLower.includes('intern'))) {
         displayRole += ' <small>(vol)</small>';
    } else if (jt === 'internship' || (item.source === 'volunteer' && roleLower.includes('intern'))) {
         displayRole += ' <small>(intern)</small>';
    } else if (jt === 'staff' || item.source === 'staff') {
         displayRole += ' <small>(staff)</small>';
    }
    
    const itemStatus = item.status ? item.status.toLowerCase() : '';
    const statusDisplay = item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1) : 'Unknown';
    const statusClass = itemStatus === 'pending' ? 'status-pending' : ((itemStatus === 'active' || itemStatus === 'approved' || itemStatus === 'selected') ? 'status-active' : 'status-inactive');

    const content = `
        <div style="display: flex; align-items: center; gap: 18px; margin-bottom: 24px;">
            <img src="${item.photo}" style="width: 72px; height: 72px; border-radius: 16px; object-fit: cover; border: 3px solid #f1f5f9;">
            <div>
                <h2 style="margin:0 0 4px;">${item.name}</h2>
                <span class="status-badge ${statusClass}">${statusDisplay}</span>
            </div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 24px;">
            <div style="background:#f8fafc; padding:12px 14px; border-radius:12px;">
                <p style="margin:0;font-size:0.75rem;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Email</p>
                <p style="margin:4px 0 0;font-weight:600;color:#1e293b;font-size:0.9rem;">${item.email}</p>
            </div>
            <div style="background:#f8fafc; padding:12px 14px; border-radius:12px;">
                <p style="margin:0;font-size:0.75rem;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Phone</p>
                <p style="margin:4px 0 0;font-weight:600;color:#1e293b;font-size:0.9rem;">${item.phone || 'N/A'}</p>
            </div>
            <div style="background:#f8fafc; padding:12px 14px; border-radius:12px;">
                <p style="margin:0;font-size:0.75rem;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Role</p>
                <p style="margin:4px 0 0;font-weight:600;color:#1e293b;font-size:0.9rem;">${displayRole}</p>
            </div>
            <div style="background:#f8fafc; padding:12px 14px; border-radius:12px;">
                <p style="margin:0;font-size:0.75rem;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Address</p>
                <p style="margin:4px 0 0;font-weight:600;color:#1e293b;font-size:0.9rem;">${item.address || 'N/A'}</p>
            </div>
            <div style="background:#f8fafc; padding:12px 14px; border-radius:12px; grid-column: span 2;">
                <p style="margin:0;font-size:0.75rem;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Applied Date</p>
                <p style="margin:4px 0 0;font-weight:600;color:#1e293b;font-size:0.9rem;">${item.appliedDate || 'N/A'}</p>
            </div>
        </div>
        <h3 style="margin-bottom:10px;">Documents</h3>
        <div style="display: flex; gap: 10px; margin-bottom: 24px; flex-wrap: wrap;">
            ${(item.documents && item.documents.length > 0) ? item.documents.map(d => `<button class="doc-btn"><i class="fas fa-file-alt"></i> ${d}</button>`).join('') : '<p style="color:#94a3b8;font-size:0.88rem;">No documents uploaded</p>'}
        </div>
        <div style="display: flex; gap: 10px;">
            ${itemStatus === 'pending' ?
            `<button class="btn" onclick="confirmApprove('${item.source}', ${item.id})" style="flex:1;justify-content:center;"><i class="fas fa-check"></i> Approve</button>
                 <button class="btn btn-danger" onclick="confirmReject('${item.source}', ${item.id})" style="flex:1;justify-content:center;"><i class="fas fa-times"></i> Reject</button>` :
            (itemStatus === 'active' || itemStatus === 'approved' || itemStatus === 'selected' ?
            `<button class="btn" onclick="editStaff('${item.source}', ${item.id})" style="flex:1;justify-content:center;"><i class="fas fa-edit"></i> Edit</button>
                 <button class="btn btn-danger" onclick="confirmReject('${item.source}', ${item.id})" style="flex:1;justify-content:center;"><i class="fas fa-times"></i> Reject</button>` :
            `<button class="btn btn-danger" onclick="confirmRemove('${item.source}', ${item.id})" style="flex:1;justify-content:center;"><i class="fas fa-trash"></i> Remove</button>`)
        }
        </div>
    `;
    document.getElementById('viewModalContent').innerHTML = content;
    openModal('viewModal');
}

// Add Staff
function openAddStaffModal() {
    openModal('addStaffModal');
}
function handleAddStaff(e) {
    e.preventDefault();
    showToast('Staff added successfully', 'success');
    closeModal('addStaffModal');
}

// Confirm actions
let currentActionId = null;
let currentActionSource = null;

function confirmApprove(source, id) {
    currentActionId = id;
    currentActionSource = source;
    document.getElementById('confirmTitle').innerText = 'Approve Staff';
    document.getElementById('confirmMessage').innerText = 'Are you sure you want to approve this member?';
    document.getElementById('confirmYes').onclick = function () { executeApprove(currentActionSource, currentActionId); };
    openModal('confirmModal');
}
function confirmReject(source, id) {
    const item = teamData.find(i => i.id === id && i.source === source);
    const itemStatus = item && item.status ? item.status.toLowerCase() : '';
    const isSelected = ['active', 'approved', 'selected'].includes(itemStatus);

    currentActionId = id;
    currentActionSource = source;
    document.getElementById('confirmTitle').innerText = 'Reject ' + (isSelected ? 'Staff' : 'Request');
    document.getElementById('confirmMessage').innerText = isSelected ? 'Are you sure you want to mark this staff as resigned?' : 'Reject this request?';
    document.getElementById('confirmYes').onclick = function () { executeReject(currentActionSource, currentActionId, isSelected); };
    openModal('confirmModal');
}
function confirmRemove(source, id) {
    currentActionId = id;
    currentActionSource = source;
    document.getElementById('confirmTitle').innerText = 'Remove Staff';
    document.getElementById('confirmMessage').innerText = 'This action cannot be undone.';
    document.getElementById('confirmYes').onclick = function () { executeRemove(currentActionSource, currentActionId); };
    openModal('confirmModal');
}

async function executeApprove(source, id) {
    try {
        const res = await fetch('/admin/api/team', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, source, status: 'active', action: 'update_status' })
        });
        const data = await res.json();
        if (data.status === 'success') {
            showToast('Staff approved successfully', 'success');
            closeModal('confirmModal');
            closeModal('viewModal');
            await fetchTeamData();
        } else {
            showToast(data.message || 'Failed to approve', 'error');
        }
    } catch (e) {
        console.error(e);
        showToast('Error approving staff', 'error');
    }
}
async function executeReject(source, id, isSelected) {
    const newStatus = isSelected ? 'resign' : 'rejected';
    try {
        const res = await fetch('/admin/api/team', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, source, status: newStatus, action: 'update_status' })
        });
        const data = await res.json();
        if (data.status === 'success') {
            showToast(isSelected ? 'Staff marked as resigned' : 'Request rejected', isSelected ? 'success' : 'error');
            closeModal('confirmModal');
            closeModal('viewModal');
            await fetchTeamData();
        } else {
            showToast(data.message || 'Failed to reject', 'error');
        }
    } catch (e) {
        console.error(e);
        showToast('Error rejecting', 'error');
    }
}
async function executeRemove(source, id) {
    try {
        const res = await fetch('/admin/api/team', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, source, action: 'remove' })
        });
        const data = await res.json();
        if (data.status === 'success') {
            showToast('Staff removed', 'error');
            closeModal('confirmModal');
            closeModal('viewModal');
            await fetchTeamData();
        } else {
            showToast(data.message || 'Failed to remove', 'error');
        }
    } catch (e) {
        console.error(e);
        showToast('Error removing staff', 'error');
    }
}

function editStaff(source, id) {
    alert('Edit functionality - would open edit form');
}

// Toast
function showToast(message, type) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.querySelector('span').innerText = message;
    toast.className = 'toast ' + (type === 'error' ? 'error' : '');
    toast.style.display = 'flex';
    setTimeout(() => { toast.style.display = 'none'; }, 3000);
}

// Modal helpers
function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.add('active');
}
function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove('active');
}

// Initialize
function populateRoleFilter() {
    const roleFilter = document.getElementById('roleFilter');
    if (!roleFilter) return;
    
    const currentVal = roleFilter.value;
    const roles = new Set();
    
    teamData.forEach(item => {
        if (item.role) {
            // Some roles have appended text in display, but we want the base item.role
            roles.add(item.role);
        }
    });
    
    const sortedRoles = Array.from(roles).sort();
    let html = '<option value="">All Roles</option>';
    sortedRoles.forEach(role => {
        html += `<option value="${role}">${role}</option>`;
    });
    
    roleFilter.innerHTML = html;
    if (sortedRoles.includes(currentVal)) {
        roleFilter.value = currentVal;
    }
}

async function fetchTeamData() {
    try {
        const response = await fetch('/admin/api/team');
        const data = await response.json();
        if (data.status === 'success') {
            teamData = data.team;
            updateCounts();
            populateRoleFilter();
            filterData();
        } else {
            showToast('Failed to fetch team data', 'error');
        }
    } catch (e) {
        console.error(e);
        showToast('Error loading data', 'error');
    }
}

document.addEventListener('DOMContentLoaded', function () {
    fetchTeamData();
    
    // Setup real-time filters
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.addEventListener('input', filterData);
    
    const roleFilter = document.getElementById('roleFilter');
    if (roleFilter) roleFilter.addEventListener('change', filterData);
    
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) statusFilter.addEventListener('change', filterData);
});
