// Sample team data
let teamData = [
    { id: 1, photo: 'https://randomuser.me/api/portraits/men/1.jpg', name: 'Rahim Khan', email: 'rahim@email.com', phone: '9876543210', role: 'Teacher', status: 'Pending', appliedDate: '2026-03-10', address: 'Kolkata', documents: ['ID Proof', 'Certificate'] },
    { id: 2, photo: 'https://randomuser.me/api/portraits/women/2.jpg', name: 'Priya Das', email: 'priya@email.com', phone: '9876543211', role: 'Volunteer', status: 'Active', appliedDate: '2026-02-15', address: 'Rampurhat', documents: ['ID Proof'] },
    { id: 3, photo: 'https://randomuser.me/api/portraits/men/3.jpg', name: 'Sourav Ghosh', email: 'sourav@email.com', phone: '9876543212', role: 'Admin', status: 'Active', appliedDate: '2026-01-20', address: 'Birbhum', documents: ['ID Proof', 'Resume'] },
    { id: 4, photo: 'https://randomuser.me/api/portraits/women/4.jpg', name: 'Rina Ghosh', email: 'rina@email.com', phone: '9876543213', role: 'Teacher', status: 'Pending', appliedDate: '2026-03-12', address: 'Kolkata', documents: ['ID Proof'] },
    { id: 5, photo: 'https://randomuser.me/api/portraits/men/5.jpg', name: 'Arjun Singh', email: 'arjun@email.com', phone: '9876543214', role: 'Volunteer', status: 'Active', appliedDate: '2026-02-28', address: 'Rural', documents: [] },
];

let currentTab = 'pending'; // pending, active, all
let filteredData = [];

function filterData() {
    const search = document.getElementById('searchInput') ? document.getElementById('searchInput').value.toLowerCase() : '';
    const role = document.getElementById('roleFilter') ? document.getElementById('roleFilter').value : '';
    const status = document.getElementById('statusFilter') ? document.getElementById('statusFilter').value : '';
    filteredData = teamData.filter(item => {
        let match = true;
        if (currentTab === 'pending' && item.status !== 'Pending') match = false;
        if (currentTab === 'active' && item.status !== 'Active') match = false;
        if (search && !item.name.toLowerCase().includes(search) && !item.email.toLowerCase().includes(search) && !item.phone.includes(search)) match = false;
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

    filteredData.forEach(item => {
        const statusClass = item.status === 'Pending' ? 'status-pending' : (item.status === 'Active' ? 'status-active' : 'status-inactive');
        const actions = item.status === 'Pending' ? `
            <div class="action-btns">
                <button class="action-btn view" onclick="viewDetails(${item.id})"><i class="fas fa-eye"></i></button>
                <button class="action-btn approve" onclick="confirmApprove(${item.id})"><i class="fas fa-check"></i></button>
                <button class="action-btn reject" onclick="confirmReject(${item.id})"><i class="fas fa-times"></i></button>
            </div>
        ` : `
            <div class="action-btns">
                <button class="action-btn view" onclick="viewDetails(${item.id})"><i class="fas fa-eye"></i></button>
                <button class="action-btn edit" onclick="editStaff(${item.id})"><i class="fas fa-edit"></i></button>
                <button class="action-btn remove" onclick="confirmRemove(${item.id})"><i class="fas fa-trash"></i></button>
            </div>
        `;

        // Table row
        tableHtml += `
            <tr>
                <td><img src="${item.photo}" class="team-photo"></td>
                <td><div class="name-role"><span class="name">${item.name}</span><br><span class="email">${item.email}</span></div></td>
                <td>${item.role}</td>
                <td>${item.phone}</td>
                <td><span class="status-badge ${statusClass}">${item.status}</span></td>
                <td>${actions}</td>
            </tr>
        `;

        // Card for mobile
        cardsHtml += `
            <div class="team-card">
                <div class="card-photo"><img src="${item.photo}"></div>
                <div class="card-info">
                    <h4>${item.name}</h4>
                    <p>${item.role}</p>
                    <span class="status-badge ${statusClass}">${item.status}</span>
                </div>
                <div class="card-actions">
                    <button class="action-btn view" onclick="viewDetails(${item.id})"><i class="fas fa-eye"></i></button>
                    ${item.status === 'Pending' ?
                `<button class="action-btn approve" onclick="confirmApprove(${item.id})"><i class="fas fa-check"></i></button>
                         <button class="action-btn reject" onclick="confirmReject(${item.id})"><i class="fas fa-times"></i></button>` :
                `<button class="action-btn edit" onclick="editStaff(${item.id})"><i class="fas fa-edit"></i></button>
                         <button class="action-btn remove" onclick="confirmRemove(${item.id})"><i class="fas fa-trash"></i></button>`
            }
                </div>
            </div>
        `;
    });

    tableBody.innerHTML = tableHtml;
    cardsView.innerHTML = cardsHtml;
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
function viewDetails(id) {
    const item = teamData.find(i => i.id === id);
    const content = `
        <h2>${item.name}</h2>
        <div style="display: flex; gap: 20px; margin: 20px 0;">
            <img src="${item.photo}" style="width: 100px; height: 100px; border-radius: 50%;">
            <div>
                <p><strong>Email:</strong> ${item.email}</p>
                <p><strong>Phone:</strong> ${item.phone}</p>
                <p><strong>Role:</strong> ${item.role}</p>
                <p><strong>Address:</strong> ${item.address}</p>
                <p><strong>Applied:</strong> ${item.appliedDate}</p>
            </div>
        </div>
        <h3>Documents</h3>
        <div style="display: flex; gap: 10px; margin: 10px 0;">
            ${item.documents.map(d => `<button class="doc-btn"><i class="fas fa-file"></i> ${d}</button>`).join('')}
        </div>
        <div style="display: flex; gap: 10px; margin-top: 20px;">
            ${item.status === 'Pending' ?
            `<button class="btn" onclick="confirmApprove(${item.id})">Approve</button>
                 <button class="btn btn-outline" onclick="confirmReject(${item.id})">Reject</button>` :
            `<button class="btn" onclick="editStaff(${item.id})">Edit</button>
                 <button class="btn btn-outline" onclick="confirmRemove(${item.id})">Remove</button>`
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
function confirmApprove(id) {
    currentActionId = id;
    document.getElementById('confirmTitle').innerText = 'Approve Staff';
    document.getElementById('confirmMessage').innerText = 'Are you sure you want to approve this member?';
    document.getElementById('confirmYes').onclick = function () { executeApprove(currentActionId); };
    openModal('confirmModal');
}
function confirmReject(id) {
    currentActionId = id;
    document.getElementById('confirmTitle').innerText = 'Reject Request';
    document.getElementById('confirmMessage').innerText = 'Reject this request?';
    document.getElementById('confirmYes').onclick = function () { executeReject(currentActionId); };
    openModal('confirmModal');
}
function confirmRemove(id) {
    currentActionId = id;
    document.getElementById('confirmTitle').innerText = 'Remove Staff';
    document.getElementById('confirmMessage').innerText = 'This action cannot be undone.';
    document.getElementById('confirmYes').onclick = function () { executeRemove(currentActionId); };
    openModal('confirmModal');
}

function executeApprove(id) {
    const item = teamData.find(i => i.id === id);
    if (item) {
        item.status = 'Active';
    }
    showToast('Staff approved successfully', 'success');
    closeModal('confirmModal');
    closeModal('viewModal');
    filterData();
}
function executeReject(id) {
    teamData = teamData.filter(i => i.id !== id);
    showToast('Request rejected', 'error');
    closeModal('confirmModal');
    closeModal('viewModal');
    filterData();
}
function executeRemove(id) {
    teamData = teamData.filter(i => i.id !== id);
    showToast('Staff removed', 'error');
    closeModal('confirmModal');
    closeModal('viewModal');
    filterData();
}

function editStaff(id) {
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
document.addEventListener('DOMContentLoaded', function () {
    filterData();
});
