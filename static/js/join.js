(function () {
    "use strict";

    // ---------- CONDITIONAL GUARDIAN FIELDS (age < 20) ----------
    const ageInput = document.getElementById('age');
    const guardianSection = document.querySelector('.guardian-section');
    const parentNameInput = document.getElementById('parentName');
    const parentContactInput = document.getElementById('parentContact');

    function toggleGuardianFields() {
        const age = parseInt(ageInput.value, 10);
        if (!isNaN(age) && age < 20) {
            guardianSection.style.display = 'block';
            // make guardian fields required
            parentNameInput.setAttribute('required', 'required');
            parentContactInput.setAttribute('required', 'required');
        } else {
            guardianSection.style.display = 'none';
            // remove required to allow form submission
            parentNameInput.removeAttribute('required');
            parentContactInput.removeAttribute('required');
        }
    }

    // initial call
    ageInput.addEventListener('input', toggleGuardianFields);
    toggleGuardianFields(); // run on page load

    // ---------- FORM SUBMISSION & VALIDATION ----------
    const form = document.getElementById('joinForm');
    const popupModal = document.getElementById('popupModal');
    const popupTitle = document.getElementById('popupTitle');
    const popupMessage = document.getElementById('popupMessage');
    const popupIcon = document.getElementById('popupIcon');
    const closeBtn = document.getElementById('popupCloseBtn');

    // Helper to show popup
    function showPopup(type, title, message) {
        if (type === 'success') {
            popupIcon.innerHTML = '✅';
            popupTitle.style.color = 'var(--deep-green)';
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

    closeBtn.addEventListener('click', closePopup);
    popupModal.addEventListener('click', function (e) {
        if (e.target === popupModal) closePopup();
    });

    // Form submit handler
    form.addEventListener('submit', function (e) {
        e.preventDefault();

        // ----- Validate all required fields -----
        let isValid = true;
        const requiredFields = form.querySelectorAll('[required]');
        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                field.style.borderColor = '#dc2626';
                isValid = false;
            } else {
                field.style.borderColor = ''; // reset
            }
        });

        // Additional validation: if guardian section is visible, ensure its fields are filled (already required via JS)
        if (guardianSection.style.display === 'block') {
            if (!parentNameInput.value.trim() || !parentContactInput.value.trim()) {
                isValid = false;
                if (!parentNameInput.value.trim()) parentNameInput.style.borderColor = '#dc2626';
                if (!parentContactInput.value.trim()) parentContactInput.style.borderColor = '#dc2626';
            }
        }

        // check if at least one radio in 'experience' is checked
        const experienceRadios = document.getElementsByName('experience');
        let experienceChecked = false;
        for (let radio of experienceRadios) {
            if (radio.checked) experienceChecked = true;
        }
        if (!experienceChecked) {
            isValid = false;
            // mark the radio group container (visual hint)
            document.querySelector('.radio-group').style.border = '2px solid #dc2626';
            document.querySelector('.radio-group').style.borderRadius = '12px';
            document.querySelector('.radio-group').style.padding = '8px';
        } else {
            document.querySelector('.radio-group').style.border = 'none';
        }

        // check both consent checkboxes are ticked
        const chk1 = document.getElementById('agreeDiscipline');
        const chk2 = document.getElementById('confirmInfo');
        if (!chk1.checked || !chk2.checked) {
            isValid = false;
            if (!chk1.checked) chk1.parentElement.style.color = '#b91c1c';
            if (!chk2.checked) chk2.parentElement.style.color = '#b91c1c';
        } else {
            chk1.parentElement.style.color = '';
            chk2.parentElement.style.color = '';
        }

        if (isValid) {
            // success popup
            showPopup('success', 'Success!', 'Your application has been submitted successfully. We will contact you soon.');
            form.reset(); // optional reset
            // reset guardian display after reset (age empty)
            setTimeout(() => {
                toggleGuardianFields();
            }, 50);
        } else {
            // failure popup
            showPopup('fail', 'Incomplete Form', 'Please fill all required fields and agree to the terms.');
        }
    });

    // ---------- FADE-IN ON SCROLL (Intersection Observer) ----------
    const fadeElements = document.querySelectorAll('.fade-section');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // optional: unobserve after visible
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.2, rootMargin: '0px 0px -30px 0px' });

    fadeElements.forEach(el => observer.observe(el));

    // Manually trigger visible for elements already in view
    fadeElements.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
            el.classList.add('visible');
        }
    });

    // ---------- Remove red border on input ----------
    const allInputs = form.querySelectorAll('input, select, textarea');
    allInputs.forEach(input => {
        input.addEventListener('input', function () {
            this.style.borderColor = '';
        });
        input.addEventListener('change', function () {
            this.style.borderColor = '';
        });
    });

    // Special: remove radio group red border when radio selected
    experienceRadios.forEach(radio => {
        radio.addEventListener('change', function () {
            document.querySelector('.radio-group').style.border = 'none';
        });
    });

})();