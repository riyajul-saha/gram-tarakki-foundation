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
    formData.append('address', document.getElementById('addStudentAddress').value.trim());
    
    const imageInput = document.getElementById('addStudentImage');
    if (imageInput && imageInput.files[0]) {
        formData.append('image', imageInput.files[0]);
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