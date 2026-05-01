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
            if (item.source === 'admin') match = false;
        } else if (currentTab === 'admin') {
            if (item.source !== 'admin') match = false;
        } else if (currentTab === 'all') {
            if (!['selected', 'active', 'approved', 'resign', 'resigned'].includes(itemStatus) && item.source !== 'admin') match = false;
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
    let adminCount = 0;
    let allCount = 0;

    teamData.forEach(item => {
        const status = item.status ? item.status.toLowerCase() : '';

        if (status === 'pending') pendingVolunteer++;
        if ((status === 'active' || status === 'approved' || status === 'selected') && item.source !== 'admin') activeBoth++;
        if (status === 'rejected') rejectedBoth++;
        if (item.source === 'admin') adminCount++;
        
        if (['selected', 'active', 'approved', 'resign', 'resigned'].includes(status) || item.source === 'admin') {
            allCount++;
        }
    });

    const totalTeam = activeBoth + rejectedBoth + adminCount;

    if (document.getElementById('countTotalTeam')) document.getElementById('countTotalTeam').innerText = totalTeam;
    if (document.getElementById('countPending')) document.getElementById('countPending').innerText = pendingVolunteer;
    if (document.getElementById('countActive')) document.getElementById('countActive').innerText = activeBoth;
    if (document.getElementById('countRejected')) document.getElementById('countRejected').innerText = rejectedBoth;

    if (document.getElementById('badgePending')) document.getElementById('badgePending').innerText = pendingVolunteer;
    if (document.getElementById('badgeActive')) document.getElementById('badgeActive').innerText = activeBoth;
    if (document.getElementById('badgeAdmin')) document.getElementById('badgeAdmin').innerText = adminCount;
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
    const form = document.getElementById('addStaffForm');
    if(form) {
        form.reset();
        // Reset file upload card states
        const photoCard = document.getElementById('photoUploadCard');
        const docCard = document.getElementById('docUploadCard');
        if(photoCard) photoCard.classList.remove('has-file');
        if(docCard) docCard.classList.remove('has-file');
        if(document.getElementById('photoUploadText')) document.getElementById('photoUploadText').innerText = 'Click to upload photo';
        if(document.getElementById('docUploadText')) document.getElementById('docUploadText').innerText = 'Click to upload documents';
        // Reset password UI
        resetPasswordStrength();
        handleTypeChange();
    }
    openModal('addStaffModal');
}

function handleTypeChange() {
    const typeEl = document.getElementById('staffType');
    if (!typeEl) return;
    const type = typeEl.value;
    
    const adminFields = document.getElementById('adminFields');
    const volunteerFields = document.getElementById('volunteerFields');
    const otherStaffFields = document.getElementById('otherStaffFields');
    const docUploadGroup = document.getElementById('docUploadGroup');
    
    // Reset displays using CSS class
    if(adminFields) adminFields.classList.remove('visible');
    if(volunteerFields) volunteerFields.classList.remove('visible');
    if(otherStaffFields) otherStaffFields.classList.remove('visible');
    if(docUploadGroup) docUploadGroup.style.display = '';

    // Remove required attributes
    ['staffPassword', 'staffConfirmPassword', 'staffServiceType', 'staffAvailability', 'staffRoleOfStaff'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.removeAttribute('required');
    });

    // Reset password strength UI
    resetPasswordStrength();

    if (type === 'Admin') {
        if(adminFields) adminFields.classList.add('visible');
        if(docUploadGroup) docUploadGroup.style.display = 'none';
        document.getElementById('staffPassword').setAttribute('required', 'required');
        document.getElementById('staffConfirmPassword').setAttribute('required', 'required');
    } else if (type === 'Volunteer') {
        if(volunteerFields) volunteerFields.classList.add('visible');
        document.getElementById('staffServiceType').setAttribute('required', 'required');
        document.getElementById('staffAvailability').setAttribute('required', 'required');
    } else if (type === 'Other Staff') {
        if(otherStaffFields) otherStaffFields.classList.add('visible');
        document.getElementById('staffRoleOfStaff').setAttribute('required', 'required');
    }
}

async function handleAddStaff(e) {
    e.preventDefault();
    const type = document.getElementById('staffType').value;
    
    if (type === 'Admin') {
        const pwd = document.getElementById('staffPassword').value;
        const confirmPwd = document.getElementById('staffConfirmPassword').value;
        if (pwd !== confirmPwd) {
            showToast('Passwords do not match', 'error');
            return;
        }
    }

    const formData = new FormData();
    formData.append('action', 'add_staff');
    formData.append('name', document.getElementById('staffName').value);
    formData.append('email', document.getElementById('staffEmail').value);
    formData.append('phone', document.getElementById('staffPhone').value);
    formData.append('type', type);
    formData.append('address', document.getElementById('staffAddress').value);

    if (type === 'Admin') {
        formData.append('password', document.getElementById('staffPassword').value);
    } else if (type === 'Volunteer') {
        formData.append('serviceType', document.getElementById('staffServiceType').value);
        formData.append('availability', document.getElementById('staffAvailability').value);
    } else if (type === 'Other Staff') {
        formData.append('roleOfStaff', document.getElementById('staffRoleOfStaff').value);
    }

    const photoInput = document.getElementById('staffPhoto');
    if (photoInput && photoInput.files[0]) {
        formData.append('photo', photoInput.files[0]);
    }

    if (type !== 'Admin') {
        const docInput = document.getElementById('staffDocs');
        if (docInput && docInput.files) {
            for (let i = 0; i < docInput.files.length; i++) {
                formData.append('documents', docInput.files[i]);
            }
        }
    }

    const btn = document.getElementById('addStaffBtn');
    const originalText = btn ? btn.innerHTML : 'Add Staff';
    if (btn) {
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
        btn.disabled = true;
    }

    try {
        const res = await fetch('/admin/api/team', {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        if (data.status === 'success') {
            showToast('Staff added successfully', 'success');
            closeModal('addStaffModal');
            await fetchTeamData();
        } else {
            showToast(data.message || 'Failed to add staff', 'error');
        }
    } catch (err) {
        console.error(err);
        showToast('Error adding staff', 'error');
    } finally {
        if (btn) {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }
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

// ========================================
// Edit Staff
// ========================================

function editStaff(source, id) {
    const item = teamData.find(i => i.id === id && i.source === source);
    if (!item) {
        showToast('Staff member not found', 'error');
        return;
    }

    // Close view modal if open
    closeModal('viewModal');

    // Populate header
    const photoPreview = document.getElementById('editPhotoPreview');
    if (photoPreview) photoPreview.src = item.photo || 'https://ui-avatars.com/api/?name=Staff';

    const titleEl = document.getElementById('editStaffTitle');
    if (titleEl) titleEl.textContent = `Edit: ${item.name}`;

    const subtitleEl = document.getElementById('editStaffSubtitle');
    if (subtitleEl) {
        const sourceLabel = source === 'admin' ? 'Admin' : (item.job_type === 'volunteer' ? 'Volunteer' : 'Staff');
        subtitleEl.textContent = `Update ${sourceLabel} information`;
    }

    // Populate hidden fields
    document.getElementById('editStaffId').value = id;
    document.getElementById('editStaffSource').value = source;

    // Populate form fields
    document.getElementById('editName').value = item.name || '';
    document.getElementById('editEmail').value = item.email || '';
    document.getElementById('editPhone').value = item.phone || '';
    document.getElementById('editRole').value = item.role || '';
    document.getElementById('editAddress').value = item.address || '';

    // Set status
    const statusSelect = document.getElementById('editStatus');
    if (statusSelect) {
        const currentStatus = (item.status || 'active').toLowerCase();
        statusSelect.value = currentStatus;
        // If admin, disable status change
        if (source === 'admin') {
            statusSelect.disabled = true;
        } else {
            statusSelect.disabled = false;
        }
    }

    // If admin, hide role field (they are always "Admin")
    const roleGroup = document.getElementById('editRole').closest('.form-group');
    if (source === 'admin' && roleGroup) {
        roleGroup.style.display = 'none';
    } else if (roleGroup) {
        roleGroup.style.display = '';
    }

    // Reset photo upload card
    const photoCard = document.getElementById('editPhotoUploadCard');
    if (photoCard) photoCard.classList.remove('has-file');
    const photoText = document.getElementById('editPhotoUploadText');
    if (photoText) photoText.textContent = 'Click to change photo';
    const photoInput = document.getElementById('editStaffPhoto');
    if (photoInput) photoInput.value = '';

    openModal('editStaffModal');
}

function handleEditPhotoPreview() {
    const input = document.getElementById('editStaffPhoto');
    const preview = document.getElementById('editPhotoPreview');
    const card = document.getElementById('editPhotoUploadCard');
    const label = document.getElementById('editPhotoUploadText');

    if (input && input.files && input.files[0]) {
        card.classList.add('has-file');
        label.textContent = input.files[0].name;

        // Show live preview
        const reader = new FileReader();
        reader.onload = function(e) {
            if (preview) preview.src = e.target.result;
        };
        reader.readAsDataURL(input.files[0]);
    } else {
        card.classList.remove('has-file');
        label.textContent = 'Click to change photo';
    }
}

async function handleEditStaff(e) {
    e.preventDefault();

    const id = document.getElementById('editStaffId').value;
    const source = document.getElementById('editStaffSource').value;
    const name = document.getElementById('editName').value.trim();
    const phone = document.getElementById('editPhone').value.trim();
    const role = document.getElementById('editRole').value.trim();
    const status = document.getElementById('editStatus').value;
    const address = document.getElementById('editAddress').value.trim();

    if (!name || !phone) {
        showToast('Name and phone are required', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('action', 'edit_staff');
    formData.append('id', id);
    formData.append('source', source);
    formData.append('name', name);
    formData.append('phone', phone);
    formData.append('role', role);
    formData.append('status', status);
    formData.append('address', address);

    // Photo
    const photoInput = document.getElementById('editStaffPhoto');
    if (photoInput && photoInput.files[0]) {
        formData.append('photo', photoInput.files[0]);
    }

    const btn = document.getElementById('editStaffBtn');
    const originalText = btn ? btn.innerHTML : '<i class="fas fa-save"></i> Save Changes';
    if (btn) {
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        btn.disabled = true;
    }

    try {
        const res = await fetch('/admin/api/team', {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        if (data.status === 'success') {
            showToast('Staff updated successfully', 'success');
            closeModal('editStaffModal');
            await fetchTeamData();
        } else {
            showToast(data.message || 'Failed to update staff', 'error');
        }
    } catch (err) {
        console.error(err);
        showToast('Error updating staff', 'error');
    } finally {
        if (btn) {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }
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

// ========================================
// Password Strength Meter
// ========================================

function checkPasswordStrength(password) {
    const bar = document.getElementById('strengthBar');
    const label = document.getElementById('strengthLabel');
    if (!bar || !label) return;

    const criteria = {
        length: password.length >= 8,
        upper: /[A-Z]/.test(password),
        lower: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[^A-Za-z0-9]/.test(password)
    };

    // Update criteria items
    updateCriteriaItem('criteriaLength', criteria.length);
    updateCriteriaItem('criteriaUpper', criteria.upper);
    updateCriteriaItem('criteriaLower', criteria.lower);
    updateCriteriaItem('criteriaNumber', criteria.number);
    updateCriteriaItem('criteriaSpecial', criteria.special);

    const score = Object.values(criteria).filter(Boolean).length;

    // Remove old strength classes
    bar.className = 'strength-bar-fill';

    if (password.length === 0) {
        label.textContent = 'Enter a password';
        label.style.color = '#94a3b8';
        return;
    }

    if (score <= 1) {
        bar.classList.add('strength-weak');
        label.textContent = '🔴 Weak';
        label.style.color = '#ef4444';
    } else if (score <= 2) {
        bar.classList.add('strength-fair');
        label.textContent = '🟠 Fair';
        label.style.color = '#f97316';
    } else if (score <= 3) {
        bar.classList.add('strength-good');
        label.textContent = '🟡 Good';
        label.style.color = '#eab308';
    } else {
        bar.classList.add('strength-strong');
        label.textContent = '🟢 Strong';
        label.style.color = '#10b981';
    }

    // Also check password match in case confirm is already filled
    checkPasswordMatch();
}

function updateCriteriaItem(id, met) {
    const el = document.getElementById(id);
    if (!el) return;
    const icon = el.querySelector('i');
    if (met) {
        el.classList.add('met');
        if (icon) icon.className = 'fas fa-check-circle';
    } else {
        el.classList.remove('met');
        if (icon) icon.className = 'fas fa-circle';
    }
}

function resetPasswordStrength() {
    const bar = document.getElementById('strengthBar');
    const label = document.getElementById('strengthLabel');
    const matchMsg = document.getElementById('passwordMatchMsg');
    if (bar) bar.className = 'strength-bar-fill';
    if (label) { label.textContent = 'Enter a password'; label.style.color = '#94a3b8'; }
    if (matchMsg) { matchMsg.textContent = ''; matchMsg.className = 'password-match-msg'; }

    ['criteriaLength', 'criteriaUpper', 'criteriaLower', 'criteriaNumber', 'criteriaSpecial'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.classList.remove('met');
            const icon = el.querySelector('i');
            if (icon) icon.className = 'fas fa-circle';
        }
    });
}

function checkPasswordMatch() {
    const pwd = document.getElementById('staffPassword');
    const confirm = document.getElementById('staffConfirmPassword');
    const msg = document.getElementById('passwordMatchMsg');
    if (!pwd || !confirm || !msg) return;

    if (confirm.value.length === 0) {
        msg.textContent = '';
        msg.className = 'password-match-msg';
        return;
    }

    if (pwd.value === confirm.value) {
        msg.innerHTML = '<i class="fas fa-check-circle"></i> Passwords match';
        msg.className = 'password-match-msg match';
    } else {
        msg.innerHTML = '<i class="fas fa-times-circle"></i> Passwords do not match';
        msg.className = 'password-match-msg no-match';
    }
}

function togglePasswordVisibility(inputId, btnEl) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const icon = btnEl.querySelector('i');

    if (input.type === 'password') {
        input.type = 'text';
        if (icon) icon.className = 'fas fa-eye-slash';
    } else {
        input.type = 'password';
        if (icon) icon.className = 'fas fa-eye';
    }
}

// ========================================
// File Upload UI Handler
// ========================================

function handleFileUploadUI(inputId, cardId, labelId, isMultiple) {
    const input = document.getElementById(inputId);
    const card = document.getElementById(cardId);
    const label = document.getElementById(labelId);
    if (!input || !card || !label) return;

    if (input.files && input.files.length > 0) {
        card.classList.add('has-file');
        if (isMultiple) {
            label.textContent = input.files.length + ' file(s) selected';
        } else {
            label.textContent = input.files[0].name;
        }
    } else {
        card.classList.remove('has-file');
        label.textContent = isMultiple ? 'Click to upload documents' : 'Click to upload photo';
    }
}

// ========================================
// Initialize
// ========================================

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
