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

    const loginBtn = document.querySelector('.login-btn');
    const originalText = loginBtn.innerText;
    loginBtn.innerText = 'Signing In...';
    loginBtn.disabled = true;

    fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password })
    })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                window.location.href = data.redirect;
            } else {
                errorText.innerText = data.message || 'Invalid email or password.';
                errorDiv.classList.add('show');
                loginBtn.innerText = originalText;
                loginBtn.disabled = false;
            }
        })
        .catch(error => {
            console.error('Error during login:', error);
            errorText.innerText = 'An error occurred. Please try again.';
            errorDiv.classList.add('show');
            loginBtn.innerText = originalText;
            loginBtn.disabled = false;
        });

    return false;
}

// Remove error when user starts typing
document.getElementById('username').addEventListener('input', function () {
    document.getElementById('errorMsg').classList.remove('show');
});
document.getElementById('password').addEventListener('input', function () {
    document.getElementById('errorMsg').classList.remove('show');
});
