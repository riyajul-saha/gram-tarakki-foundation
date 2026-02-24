(function() {
            // ----- SCROLL REVEAL -----
            const reveals = document.querySelectorAll('.reveal');
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                    }
                });
            }, { threshold: 0.15, rootMargin: '0px 0px -30px 0px' });
            reveals.forEach(el => observer.observe(el));

            // ----- CONDITIONAL "OTHER" PARTNER TYPE -----
            const partnerType = document.getElementById('partnerType');
            const otherGroup = document.getElementById('otherTypeGroup');
            partnerType.addEventListener('change', function() {
                if (this.value === 'Other') {
                    otherGroup.style.display = 'block';
                } else {
                    otherGroup.style.display = 'none';
                }
            });

            // ----- FILE UPLOAD VISUAL -----
            const fileArea = document.getElementById('fileUploadArea');
            const fileInput = document.getElementById('logoUpload');
            fileArea.addEventListener('click', () => fileInput.click());
            fileInput.addEventListener('change', function() {
                if (this.files.length > 0) {
                    fileArea.innerHTML = `<i class="fas fa-check-circle"></i> ${this.files[0].name}`;
                } else {
                    fileArea.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> Click or drag to upload';
                }
            });

            // ----- FORM SUBMISSION WITH LOADING AND POPUP -----
            const form = document.getElementById('partnerForm');
            const submitBtn = document.getElementById('submitBtn');
            const popup = document.getElementById('popup');
            const popupIcon = document.getElementById('popupIcon');
            const popupTitle = document.getElementById('popupTitle');
            const popupMessage = document.getElementById('popupMessage');

            function showPopup(type, title, msg) {
                if (type === 'success') {
                    popupIcon.className = 'fas fa-check-circle success';
                    popupTitle.textContent = title;
                    popupMessage.textContent = msg;
                } else {
                    popupIcon.className = 'fas fa-times-circle error';
                    popupTitle.textContent = title;
                    popupMessage.textContent = msg;
                }
                popup.classList.add('show');
                setTimeout(() => popup.classList.remove('show'), 3000);
            }

            form.addEventListener('submit', function(e) {
                e.preventDefault();

                // Basic validation
                const requiredFields = ['orgName', 'contactPerson', 'email', 'phone', 'city', 'partnerType'];
                let isValid = true;
                requiredFields.forEach(id => {
                    const field = document.getElementById(id);
                    if (!field.value.trim()) {
                        field.style.borderColor = '#dc2626';
                        isValid = false;
                    } else {
                        field.style.borderColor = '';
                    }
                });

                // Email regex
                const email = document.getElementById('email');
                if (email.value && !/^\S+@\S+\.\S+$/.test(email.value)) {
                    email.style.borderColor = '#dc2626';
                    isValid = false;
                }

                // Phone (basic)
                const phone = document.getElementById('phone');
                if (phone.value && !/^[0-9]{10}$/.test(phone.value.replace(/\D/g,''))) {
                    phone.style.borderColor = '#dc2626';
                    isValid = false;
                }

                // Consent
                const consent = document.getElementById('consent');
                if (!consent.checked) {
                    consent.parentElement.style.color = '#dc2626';
                    isValid = false;
                } else {
                    consent.parentElement.style.color = '';
                }

                if (!isValid) {
                    showPopup('error', 'Incomplete Form', 'Please fill all required fields correctly.');
                    return;
                }

                // Simulate loading
                submitBtn.disabled = true;
                submitBtn.textContent = 'Processing... ⏳';

                setTimeout(() => {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Become a Partner';
                    showPopup('success', 'Request Sent!', 'We will contact you within 48 hours.');
                    form.reset();
                    otherGroup.style.display = 'none';
                    fileArea.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> Click or drag to upload';
                }, 1500);
            });

            // Remove red border on input
            document.querySelectorAll('input, select, textarea').forEach(el => {
                el.addEventListener('input', () => el.style.borderColor = '');
            });

            // ----- IMPACT STATS COUNTER (on scroll) -----
            const stats = document.querySelectorAll('.stat-number');
            const statsSection = document.getElementById('statsGrid');
            let counted = false;

            function countUp() {
                stats.forEach(stat => {
                    const target = parseInt(stat.getAttribute('data-target'));
                    let current = 0;
                    const increment = target / 50; // 50 steps
                    const timer = setInterval(() => {
                        current += increment;
                        if (current >= target) {
                            stat.textContent = target;
                            clearInterval(timer);
                        } else {
                            stat.textContent = Math.floor(current);
                        }
                    }, 20);
                });
            }

            // Use intersection observer for stats section
            const statsObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && !counted) {
                        counted = true;
                        countUp();
                    }
                });
            }, { threshold: 0.5 });
            statsObserver.observe(document.querySelector('.stats-grid'));

            // Reset counters if needed (optional)
        })();