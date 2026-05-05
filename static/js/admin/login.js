// ============================
// Password show/hide toggle
// ============================
const togglePassword = document.getElementById('togglePassword');
const passwordInput = document.getElementById('password');

togglePassword.addEventListener('click', function () {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    this.querySelector('i').classList.toggle('fa-eye');
    this.querySelector('i').classList.toggle('fa-eye-slash');
});

// ============================
// State
// ============================
let otpTimerInterval = null;
let resendTimerInterval = null;
let savedEmail = '';
let savedPassword = '';

// ============================
// Step 1: Handle Login
// ============================
function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const errorDiv = document.getElementById('errorMsg');
    const errorText = document.getElementById('errorText');

    errorDiv.classList.remove('show');

    if (email === '' || password === '') {
        errorText.innerText = 'Both fields are required.';
        errorDiv.classList.add('show');
        return false;
    }

    const loginBtn = document.getElementById('loginBtn');
    const originalText = loginBtn.innerText;
    loginBtn.innerText = 'Verifying...';
    loginBtn.disabled = true;

    fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'otp_sent') {
                savedEmail = email;
                savedPassword = password;
                showOtpSection(data.masked_email);
            } else if (data.status === 'success') {
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

// ============================
// Show OTP Section
// ============================
function showOtpSection(maskedEmail) {
    const loginForm = document.getElementById('loginForm');
    const otpSection = document.getElementById('otpSection');
    const cardTitle = document.getElementById('cardTitle');
    const cardSubtitle = document.getElementById('cardSubtitle');

    cardTitle.innerText = 'Verify Your Identity';
    cardSubtitle.innerText = 'Two-step authentication';

    loginForm.style.display = 'none';
    otpSection.style.display = 'block';

    document.getElementById('maskedEmail').innerText = maskedEmail;

    setTimeout(() => {
        const firstBox = document.querySelector('.otp-box[data-index="0"]');
        if (firstBox) firstBox.focus();
    }, 300);

    startOtpTimer(5 * 60);
    startResendTimer(30);
}

// ============================
// Back to Login
// ============================
function backToLogin() {
    const loginForm = document.getElementById('loginForm');
    const otpSection = document.getElementById('otpSection');
    const cardTitle = document.getElementById('cardTitle');
    const cardSubtitle = document.getElementById('cardSubtitle');
    const loginBtn = document.getElementById('loginBtn');

    cardTitle.innerText = 'Admin Panel Login';
    cardSubtitle.innerText = 'Authorized personnel only';

    otpSection.style.display = 'none';
    loginForm.style.display = 'block';
    loginBtn.innerText = 'Sign In';
    loginBtn.disabled = false;

    clearOtpInputs();
    clearInterval(otpTimerInterval);
    clearInterval(resendTimerInterval);

    document.getElementById('errorMsg').classList.remove('show');
    document.getElementById('otpErrorMsg').classList.remove('show');
}

// ============================
// OTP Input Handling
// ============================
const otpBoxes = document.querySelectorAll('.otp-box');

otpBoxes.forEach((box, index) => {
    box.addEventListener('input', function () {
        const val = this.value.replace(/[^0-9]/g, '');
        this.value = val;

        document.getElementById('otpErrorMsg').classList.remove('show');
        this.classList.remove('error');

        if (val) {
            this.classList.add('filled');
            const nextBox = document.querySelector(`.otp-box[data-index="${index + 1}"]`);
            if (nextBox) nextBox.focus();
        } else {
            this.classList.remove('filled');
        }

        if (getOtpValue().length === 6) {
            handleVerifyOtp();
        }
    });

    box.addEventListener('keydown', function (e) {
        if (e.key === 'Backspace' && !this.value) {
            const prevBox = document.querySelector(`.otp-box[data-index="${index - 1}"]`);
            if (prevBox) {
                prevBox.focus();
                prevBox.value = '';
                prevBox.classList.remove('filled');
            }
        }
    });

    box.addEventListener('paste', function (e) {
        e.preventDefault();
        const pastedData = (e.clipboardData || window.clipboardData).getData('text').replace(/[^0-9]/g, '');
        if (pastedData.length >= 6) {
            otpBoxes.forEach((b, i) => {
                if (i < 6 && pastedData[i]) {
                    b.value = pastedData[i];
                    b.classList.add('filled');
                }
            });
            setTimeout(() => handleVerifyOtp(), 100);
        }
    });

    box.addEventListener('focus', function () {
        this.select();
    });
});

function getOtpValue() {
    let otp = '';
    otpBoxes.forEach(box => { otp += box.value; });
    return otp;
}

function clearOtpInputs() {
    otpBoxes.forEach(box => {
        box.value = '';
        box.classList.remove('filled', 'error');
    });
}

// ============================
// Step 2: Verify OTP
// ============================
function handleVerifyOtp() {
    const otp = getOtpValue();
    const errorDiv = document.getElementById('otpErrorMsg');
    const errorText = document.getElementById('otpErrorText');
    const verifyBtn = document.getElementById('verifyOtpBtn');

    errorDiv.classList.remove('show');

    if (otp.length !== 6) {
        errorText.innerText = 'Please enter the complete 6-digit code.';
        errorDiv.classList.add('show');
        otpBoxes.forEach(b => { if (!b.value) b.classList.add('error'); });
        return;
    }

    verifyBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';
    verifyBtn.disabled = true;

    fetch('/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp })
    })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                verifyBtn.innerHTML = '<i class="fas fa-check"></i> Verified!';
                verifyBtn.style.background = 'linear-gradient(135deg, #43A047, #2E7D32)';
                clearInterval(otpTimerInterval);
                clearInterval(resendTimerInterval);
                setTimeout(() => { window.location.href = data.redirect; }, 500);
            } else {
                errorText.innerText = data.message || 'Invalid verification code.';
                errorDiv.classList.add('show');
                verifyBtn.innerHTML = 'Verify & Sign In';
                verifyBtn.disabled = false;

                otpBoxes.forEach(b => b.classList.add('error'));
                setTimeout(() => otpBoxes.forEach(b => b.classList.remove('error')), 500);

                if (data.message && data.message.includes('login again')) {
                    setTimeout(() => backToLogin(), 2000);
                }
            }
        })
        .catch(error => {
            console.error('Error during OTP verification:', error);
            errorText.innerText = 'An error occurred. Please try again.';
            errorDiv.classList.add('show');
            verifyBtn.innerHTML = 'Verify & Sign In';
            verifyBtn.disabled = false;
        });
}

// ============================
// Resend OTP
// ============================
function handleResendOtp() {
    const resendBtn = document.getElementById('resendOtpBtn');
    const errorDiv = document.getElementById('otpErrorMsg');
    const errorText = document.getElementById('otpErrorText');

    resendBtn.disabled = true;
    resendBtn.innerHTML = 'Sending...';

    fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: savedEmail, password: savedPassword })
    })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'otp_sent') {
                clearOtpInputs();
                clearInterval(otpTimerInterval);
                startOtpTimer(5 * 60);
                startResendTimer(30);
                const firstBox = document.querySelector('.otp-box[data-index="0"]');
                if (firstBox) firstBox.focus();
                errorDiv.classList.remove('show');
            } else {
                errorText.innerText = data.message || 'Failed to resend. Please login again.';
                errorDiv.classList.add('show');
                if (data.message && (data.message.includes('locked') || data.message.includes('blocked'))) {
                    setTimeout(() => backToLogin(), 2000);
                }
            }
        })
        .catch(error => {
            console.error('Error resending OTP:', error);
            errorText.innerText = 'Failed to resend. Please try again.';
            errorDiv.classList.add('show');
            startResendTimer(30);
        });
}

// ============================
// OTP Countdown Timer (5 min)
// ============================
function startOtpTimer(seconds) {
    const timerEl = document.getElementById('timerCount');
    const timerContainer = document.getElementById('otpTimer');
    let remaining = seconds;

    clearInterval(otpTimerInterval);

    function tick() {
        const mins = Math.floor(remaining / 60);
        const secs = remaining % 60;
        timerEl.innerText = `${mins}:${secs.toString().padStart(2, '0')}`;

        if (remaining <= 60) {
            timerContainer.classList.add('expiring');
        } else {
            timerContainer.classList.remove('expiring');
        }

        if (remaining <= 0) {
            clearInterval(otpTimerInterval);
            timerEl.innerText = 'Expired';
        }

        remaining--;
    }

    tick();
    otpTimerInterval = setInterval(tick, 1000);
}

// ============================
// Resend Cooldown Timer (30s)
// ============================
function startResendTimer(seconds) {
    const resendBtn = document.getElementById('resendOtpBtn');
    let remaining = seconds;

    clearInterval(resendTimerInterval);
    resendBtn.disabled = true;

    function tick() {
        if (remaining <= 0) {
            clearInterval(resendTimerInterval);
            resendBtn.disabled = false;
            resendBtn.innerHTML = 'Resend Code';
            return;
        }

        resendBtn.innerHTML = `Resend Code <span id="resendTimer">(${remaining}s)</span>`;
        remaining--;
    }

    tick();
    resendTimerInterval = setInterval(tick, 1000);
}

// ============================
// Clear errors on typing
// ============================
document.getElementById('email').addEventListener('input', function () {
    document.getElementById('errorMsg').classList.remove('show');
});
document.getElementById('password').addEventListener('input', function () {
    document.getElementById('errorMsg').classList.remove('show');
});
