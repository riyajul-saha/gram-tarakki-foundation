// Donation Chart
window.onload = function () {
    const dateElement = document.getElementById('current-date');
    if (dateElement) {
        const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
        dateElement.textContent = new Date().toLocaleDateString('en-GB', options);
    }

    const canvas = document.getElementById('donationChart');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                datasets: [{
                    label: 'Donations (₹)',
                    data: [35000, 42000, 48000, 53000, 47000, 59000, 62000, 71000, 68000, 74000, 82000, 91000],
                    backgroundColor: '#2563eb',
                    borderRadius: 8,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function (value) {
                                return '₹' + value;
                            }
                        }
                    }
                }
            }
        });
    }

    // Handle Join Request Actions (Approve/Reject)
    const tableBody = document.querySelector('.table-wrapper tbody');
    if (tableBody) {
        tableBody.addEventListener('click', function(e) {
            const button = e.target.closest('button');
            if (!button) return;

            const requestId = button.getAttribute('data-id');
            const action = button.getAttribute('data-action');

            if (requestId && action) {
                updateStatus(requestId, action);
            }
        });
    }
};

function updateStatus(requestId, status) {
    if (!confirm(`Are you sure you want to ${status} this request?`)) return;

    fetch('/admin/update-request-status', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: requestId, status: status }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            // Update the UI
            const row = document.querySelector(`tr[data-id="${requestId}"]`);
            if (row) {
                const actionCell = row.querySelector('.action-btns');
                const statusText = status === 'approve' ? 'Approved' : 'Rejected';
                const statusClass = status === 'approve' ? 'approved' : 'rejected';
                actionCell.innerHTML = `<span class="status-label ${statusClass}">${statusText}</span>`;
            }
        } else {
            alert('Error: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while updating the status.');
    });
}
