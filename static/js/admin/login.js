// Password show/hide toggle
const togglePassword = document.getElementById('togglePassword');
const passwordInput = document.getElementById('password');

togglePassword.addEventListener('click', function () {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    this.querySelector('i').classList.toggle('fa-eye');
    this.querySelector('i').classList.toggle('fa-eye-slash');
});

// Simple login validation (demo only)
function handleLogin(event) {
    event.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const errorDiv = document.getElementById('errorMsg');
    const errorText = document.getElementById('errorText');

    // Reset error
    errorDiv.classList.remove('show');

    // Demo credentials (hardcoded for demo)
    if (username === '' || password === '') {
        errorText.innerText = 'Both fields are required.';
        errorDiv.classList.add('show');
        return false;
    }

    // Simulate authentication (in real scenario, you'd send to server)
    if (username === 'admin@gtfoundation.in' && password === 'admin123') {
        // Success – redirect or show success (demo)
        alert('Login successful! (Demo)');
        // window.location.href = 'dashboard.html';
    } else {
        errorText.innerText = 'Invalid email or password.';
        errorDiv.classList.add('show');
    }
    return false;
}

// Remove error when user starts typing
document.getElementById('username').addEventListener('input', function () {
    document.getElementById('errorMsg').classList.remove('show');
});
document.getElementById('password').addEventListener('input', function () {
    document.getElementById('errorMsg').classList.remove('show');
});
