// Tab switching
function switchTab(tab) {
    const requests = document.getElementById('requestsTab');
    const students = document.getElementById('studentsTab');
    const btns = document.querySelectorAll('.tab-btn');
    if (tab === 'requests') {
        requests.style.display = 'block';
        students.style.display = 'none';
        btns[0].classList.add('active');
        btns[1].classList.remove('active');
    } else {
        requests.style.display = 'none';
        students.style.display = 'block';
        btns[0].classList.remove('active');
        btns[1].classList.add('active');
    }
}

// Modal functions
function openStudentModal() {
    document.getElementById('studentModal').classList.add('active');
}

function openAddStudentModal() {
    document.getElementById('addStudentModal').classList.add('active');
}

function closeModal(id) {
    document.getElementById(id).classList.remove('active');
}

// Toast
function showToast(message, type) {
    const toast = document.getElementById('toast');
    const icon = document.getElementById('toastIcon');
    const msgSpan = document.getElementById('toastMessage');
    msgSpan.innerText = message;

    if (type === 'success') {
        icon.className = 'fas fa-check-circle';
        icon.style.color = '#22c55e';
        toast.className = 'toast success';
    } else {
        icon.className = 'fas fa-times-circle';
        icon.style.color = '#ef4444';
        toast.className = 'toast error';
    }

    toast.style.display = 'flex';
    setTimeout(() => { toast.style.display = 'none'; }, 3000);
}

// Handle Form Submit
function handleAddStudent(e) {
    e.preventDefault();

    const formData = new FormData();
    formData.append('fullname', document.getElementById('addStudentName').value.trim());
    formData.append('email', document.getElementById('addStudentEmail').value.trim());
    formData.append('phone', document.getElementById('addStudentPhone').value.trim());
    formData.append('age', document.getElementById('addStudentAge').value.trim());
    formData.append('program', document.getElementById('addStudentCourse').value);
    formData.append('gender', document.getElementById('addStudentGender').value);
    formData.append('school', document.getElementById('addStudentSchool').value.trim());
    formData.append('address', document.getElementById('addStudentAddress').value.trim());
    formData.append('medical', document.getElementById('addStudentMedical').value.trim());
    
    const imageInput = document.getElementById('addStudentImage');
    if (imageInput && imageInput.files[0]) {
        const file = imageInput.files[0];
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            showToast('Only JPG, PNG and WebP images are allowed. SVG not permitted.', 'error');
            return;
        }
        if (file.size > 100 * 1024) {
            showToast('Photo must be under 100 KB.', 'error');
            return;
        }
        formData.append('image', file);
    }

    fetch('/admin/add-student', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(result => {
        if (result.status === 'success') {
            showToast('Student added successfully', 'success');
            closeModal('addStudentModal');
            setTimeout(() => { location.reload(); }, 1000);
        } else {
            showToast(result.message || 'Failed to add student', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showToast('An error occurred while adding the student', 'error');
    });
}

// Live Photo Preview
function previewStudentPhoto(input) {
    const preview = document.getElementById('addPhotoPreviewImg');
    const placeholder = document.getElementById('addPhotoPlaceholder');
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
            preview.src = e.target.result;
            preview.style.display = 'block';
            placeholder.style.display = 'none';
        };
        reader.readAsDataURL(input.files[0]);
    } else {
        preview.style.display = 'none';
        preview.src = '';
        placeholder.style.display = 'flex';
    }
}

// Program Chip Selection
document.addEventListener('DOMContentLoaded', function () {
    const chips = document.querySelectorAll('.add-program-chip');
    const hiddenSelect = document.getElementById('addStudentCourse');

    chips.forEach(chip => {
        chip.addEventListener('click', function () {
            chips.forEach(c => c.classList.remove('active'));
            this.classList.add('active');
            const radio = this.querySelector('input[type="radio"]');
            if (radio) {
                radio.checked = true;
                if (hiddenSelect) {
                    hiddenSelect.value = radio.value;
                }
            }
        });
    });
});

// Filter students by status in Students List tab
function filterStudents(filter) {
    const rows = document.querySelectorAll('#studentsTableBody tr[data-status]');
    const noRow = document.getElementById('noStudentsRow');
    let visibleCount = 0;

    // Update active tab
    document.querySelectorAll('#studentFilterTabs .filter-tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');

    rows.forEach(row => {
        if (filter === 'all' || row.getAttribute('data-status') === filter) {
            row.style.display = '';
            visibleCount++;
        } else {
            row.style.display = 'none';
        }
    });

    // Show/hide "no students" message
    if (noRow) {
        noRow.style.display = visibleCount === 0 ? '' : 'none';
    }
}

// Filter tabs active state
document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.addEventListener('click', function () {
            this.parentElement.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Close modals on outside click
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('active');
        }
    });
});

function updateStudentStatus(id, newStatus) {
    fetch('/admin/update-request-status', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            id: id,
            status: newStatus
        })
    })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                showToast(newStatus === 'active' ? 'Approved' : 'Rejected', newStatus === 'active' ? 'success' : 'error');
                setTimeout(() => {
                    location.reload();
                }, 1000);
            } else {
                showToast(data.message, 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showToast('An error occurred', 'error');
        });
}

function openStudentDetails(student) {
    document.getElementById('modalStudentName').innerText = student.fullname || 'N/A';
    document.getElementById('modalStudentEmail').innerText = student.email || 'N/A';
    document.getElementById('modalStudentPhone').innerText = student.phone || 'N/A';
    document.getElementById('modalStudentAddress').innerText = student.address || 'N/A';
    document.getElementById('modalStudentCourse').innerText = student.program || 'N/A';
    document.getElementById('modalStudentAge').innerText = student.age || 'N/A';
    document.getElementById('modalStudentGender').innerText = student.gender || 'N/A';
    document.getElementById('modalStudentSchool').innerText = student.school || 'N/A';
    document.getElementById('modalStudentParentName').innerText = student.parent_name || 'N/A';
    document.getElementById('modalStudentParentContact').innerText = student.parent_contact || 'N/A';
    document.getElementById('modalStudentMedical').innerText = student.medical || 'N/A';
    document.getElementById('modalStudentExperience').innerText = student.experience || 'N/A';

    if (student.image) {
        document.getElementById('modalStudentPhoto').src = student.image;
        document.getElementById('modalStudentPhoto').style.display = 'block';
        document.getElementById('modalStudentIcon').style.display = 'none';
    } else {
        document.getElementById('modalStudentPhoto').style.display = 'none';
        document.getElementById('modalStudentIcon').style.display = 'flex';
    }

    const actionBtns = document.getElementById('modalActionBtns');
    actionBtns.innerHTML = '';
    if (student.status === 'pending') {
        actionBtns.innerHTML = `
            <button class="btn" onclick="updateStudentStatus('${student.id}', 'active')">Approve</button>
            <button class="btn btn-outline" onclick="updateStudentStatus('${student.id}', 'rejected')">Reject</button>
        `;
    }

    document.getElementById('studentModal').classList.add('active');
}