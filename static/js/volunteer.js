document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Lucide Icons
    lucide.createIcons();

    // 2. Scroll Animations (Intersection Observer)
    // Replace framer-motion stagger and fade-in-up logic
    const observerOptions = {
        root: null,
        rootMargin: '0px 0px -50px 0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const container = entry.target;

                if (container.classList.contains('scroll-stagger-container')) {
                    // Stagger children animations
                    const animatedItems = container.querySelectorAll('.scroll-animate-item');
                    animatedItems.forEach((item, index) => {
                        setTimeout(() => {
                            item.classList.add('in-view');
                            item.style.visibility = 'visible';
                        }, index * 100); // 100ms stagger delay
                    });
                } else if (container.classList.contains('scroll-animate-item')) {
                    // Single item animation
                    container.classList.add('in-view');
                    container.style.visibility = 'visible';
                }

                // Stop observing once animated
                observer.unobserve(container);
            }
        });
    }, observerOptions);

    // Observe all stagger containers
    document.querySelectorAll('.scroll-stagger-container').forEach(container => {
        observer.observe(container);
    });

    // Observe individual scroll items that are NOT inside a stagger container
    document.querySelectorAll('.scroll-animate-item').forEach(item => {
        if (!item.closest('.scroll-stagger-container')) {
            observer.observe(item);
        }
    });

    // 3. Handle Role Application buttons
    const applyButtons = document.querySelectorAll('.apply-role-btn');
    const roleSelect = document.getElementById('role-select');

    applyButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const role = button.getAttribute('data-role');
            if (roleSelect && role) {
                // Set explicitly mapped roles from React code
                const options = Array.from(roleSelect.options).map(o => o.value);
                if (options.includes(role)) {
                    roleSelect.value = role;
                } else {
                    roleSelect.value = 'Other';
                }
            }
        });
    });

    // 4. Pre-fill form from URL parameters if present
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('name')) {
        const nameInput = document.querySelector('input[placeholder="John Doe"]');
        if (nameInput) nameInput.value = urlParams.get('name');
    }
    if (urlParams.has('email')) {
        const emailInput = document.querySelector('input[type="email"]');
        if (emailInput) emailInput.value = urlParams.get('email');
    }
    if (urlParams.has('phone')) {
        const phoneInput = document.querySelector('input[type="tel"]');
        if (phoneInput) phoneInput.value = urlParams.get('phone');
    }
    if (urlParams.has('city')) {
        const cityInput = document.querySelector('input[placeholder="Your City"]');
        if (cityInput) cityInput.value = urlParams.get('city');
    }
    if (urlParams.has('role')) {
        const role = urlParams.get('role');
        const roleSelect = document.getElementById('role-select');
        if (roleSelect) {
            // Find option case-insensitively
            const option = Array.from(roleSelect.options).find(o => o.value.toLowerCase() === role.toLowerCase());
            if (option) {
                roleSelect.value = option.value;
            } else {
                roleSelect.value = 'Other';
            }
        }
    }

    // 5. Form Submission and Popup logic
    const form = document.getElementById('volunteerForm');
    const popupModal = document.getElementById('popupModal');
    const popupTitle = document.getElementById('popupTitle');
    const popupMessage = document.getElementById('popupMessage');
    const popupIcon = document.getElementById('popupIcon');
    const closeBtn = document.getElementById('popupCloseBtn');

    // Helper to show popup
    function showPopup(type, title, message) {
        if (type === 'success') {
            popupIcon.innerHTML = '✅';
            popupTitle.style.color = 'var(--color-green)';
        } else {
            popupIcon.innerHTML = '❌';
            popupTitle.style.color = '#b91c1c';
        }
        popupTitle.textContent = title;
        popupMessage.textContent = message;
        popupModal.style.display = 'flex';
    }

    // Close popup
    function closePopup() {
        popupModal.style.display = 'none';
    }

    if (closeBtn && popupModal) {
        closeBtn.addEventListener('click', closePopup);
        popupModal.addEventListener('click', function (e) {
            if (e.target === popupModal) closePopup();
        });
    }

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            // Validate all required fields
            let isValid = true;
            const requiredFields = form.querySelectorAll('[required]');
            requiredFields.forEach(field => {
                // For checkboxes, rely on the checked property
                if (field.type === 'checkbox') {
                    if (!field.checked) {
                        isValid = false;
                        field.parentElement.style.color = '#b91c1c';
                    } else {
                        field.parentElement.style.color = '';
                    }
                } else if (!field.value.trim()) {
                    field.style.borderColor = '#dc2626';
                    isValid = false;
                } else {
                    field.style.borderColor = '';
                }
            });

            if (isValid) {
                const formData = new FormData(form);
                const submitBtn = form.querySelector('button[type="submit"]');
                const originalText = submitBtn.textContent;

                submitBtn.textContent = 'Submitting...';
                submitBtn.disabled = true;

                fetch('/volunteer_join', {
                    method: 'POST',
                    body: formData
                })
                    .then(response => response.json())
                    .then(data => {
                        submitBtn.textContent = originalText;
                        submitBtn.disabled = false;

                        if (data.status === 'success') {
                            showPopup('success', 'Success!', data.message || 'Your application has been submitted successfully. We will contact you soon.');
                            form.reset();
                        } else {
                            showPopup('fail', 'Submission Failed', data.message || 'There was an error submitting your form.');
                        }
                    })
                    .catch(error => {
                        console.error('Error submitting form:', error);
                        submitBtn.textContent = originalText;
                        submitBtn.disabled = false;
                        showPopup('fail', 'Error', 'Failed to connect to the server. Please check your connection and try again.');
                    });
            } else {
                showPopup('fail', 'Incomplete Form', 'Please fill all required fields and agree to the terms.');
            }
        });

        // Remove red styling on input/change
        const allInputs = form.querySelectorAll('input, select, textarea');
        allInputs.forEach(input => {
            input.addEventListener('input', function () {
                if (this.type !== 'checkbox') this.style.borderColor = '';
            });
            input.addEventListener('change', function () {
                if (this.type !== 'checkbox') this.style.borderColor = '';
                if (this.type === 'checkbox') this.parentElement.style.color = '';
            });
        });

        // 6. Handle file upload UI and validation (Max 1MB)
        const fileInput = document.getElementById('fileInput');
        const uploadText = document.querySelector('.upload-text');
        const uploadBox = document.getElementById('fileUploadBox');

        if (fileInput && uploadText) {
            fileInput.addEventListener('change', function () {
                if (this.files && this.files.length > 0) {
                    const file = this.files[0];
                    const fileSizeMB = file.size / (1024 * 1024);

                    if (fileSizeMB > 1) {
                        // File too large
                        showPopup('fail', 'File Too Large', 'Please upload a file smaller than 1MB.');
                        this.value = ''; // clear input
                        uploadText.textContent = 'Click to upload Resume or ID proof (Max 1MB, PDF only)';
                        uploadText.style.color = '#dc2626';
                        if (uploadBox) uploadBox.style.borderColor = '#dc2626';
                    } else if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
                        // Not a PDF
                        showPopup('fail', 'Invalid File Type', 'Only PDF files are allowed.');
                        this.value = ''; // clear input
                        uploadText.textContent = 'Click to upload Resume or ID proof (Max 1MB, PDF only)';
                        uploadText.style.color = '#dc2626';
                        if (uploadBox) uploadBox.style.borderColor = '#dc2626';
                    } else {
                        // Display filename
                        uploadText.textContent = `Selected: ${file.name}`;
                        uploadText.style.color = 'var(--color-green)';
                        if (uploadBox) uploadBox.style.borderColor = 'var(--color-green)';
                    }
                } else {
                    uploadText.textContent = 'Click to upload Resume or ID proof (Max 1MB, PDF only)';
                    uploadText.style.color = '';
                    if (uploadBox) uploadBox.style.borderColor = '';
                }
            });
        }

        // 7. Handle photo upload UI and validation (Max 2MB, Images only)
        const photoInput = document.getElementById('photoInput');
        const photoUploadBox = document.getElementById('photoUploadBox');
        const photoPreview = document.getElementById('photoPreview');
        const photoUploadText = document.getElementById('photoUploadText');

        if (photoInput) {
            photoInput.addEventListener('change', function () {
                if (this.files && this.files.length > 0) {
                    const file = this.files[0];
                    const fileSizeMB = file.size / (1024 * 1024);

                    if (fileSizeMB > 2) {
                        showPopup('fail', 'File Too Large', 'Please upload a photo smaller than 2MB.');
                        this.value = '';
                        resetPhotoPreview();
                    } else if (!file.type.startsWith('image/')) {
                        showPopup('fail', 'Invalid File Type', 'Only image files (JPG/PNG/WEBP) are allowed.');
                        this.value = '';
                        resetPhotoPreview();
                    } else {
                        // Display filename
                        photoUploadText.textContent = file.name;
                        photoUploadText.style.color = 'var(--color-green)';
                        if (photoUploadBox) photoUploadBox.style.borderColor = 'var(--color-green)';
                        
                        // Show preview
                        const reader = new FileReader();
                        reader.onload = function(e) {
                            photoPreview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
                        };
                        reader.readAsDataURL(file);
                    }
                } else {
                    resetPhotoPreview();
                }
            });
        }

        function resetPhotoPreview() {
            if (photoUploadText) {
                photoUploadText.textContent = 'Click to upload photo';
                photoUploadText.style.color = '';
            }
            if (photoUploadBox) photoUploadBox.style.borderColor = '';
            if (photoPreview) {
                photoPreview.innerHTML = '<i data-lucide="user" class="user-icon"></i>';
                if (window.lucide) {
                    lucide.createIcons();
                }
            }
        }
    }

    // 5. Hero Animations initialization
    // The hero section uses CSS animations directly on load. We initialized them with 'init-hidden'.
    setTimeout(() => {
        document.querySelectorAll('.animate-fade-in-up-css, .animate-fade-in-up-delay-1, .animate-fade-in-up-delay-2').forEach(el => {
            el.classList.remove('init-hidden');
        });
    }, 100);
});
