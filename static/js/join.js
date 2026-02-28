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
    // ✅ Define experienceRadios here (global within the IIFE)
    const experienceRadios = document.getElementsByName('experience');

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
            const formData = new FormData(form);

            const submitBtn = form.querySelector('.btn-submit');
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin" style="margin-right: 10px;"></i> Submitting...';
            submitBtn.disabled = true;

            fetch('/join', {
                method: 'POST',
                body: formData
            })
                .then(response => response.json())
                .then(data => {
                    submitBtn.innerHTML = originalBtnText;
                    submitBtn.disabled = false;

                    if (data.status === 'exists') {
                        showPopup('fail', 'Already Joined', data.message);
                        setTimeout(() => {
                            closePopup();
                            const contactSection = document.querySelector('.contact-buttons');
                            if (contactSection) {
                                contactSection.scrollIntoView({ behavior: 'smooth' });
                            }
                        }, 2500);
                    } else if (data.status === 'success') {
                        showPopup('success', 'Success!', 'Your application has been submitted successfully. We will contact you soon.');
                        form.reset();
                        setTimeout(() => {
                            toggleGuardianFields();
                        }, 50);
                    } else {
                        showPopup('fail', 'Error', data.message || 'Something went wrong. Please try again.');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    submitBtn.innerHTML = originalBtnText;
                    submitBtn.disabled = false;
                    showPopup('fail', 'Error', 'Failed to submit application. Please check your connection.');
                });
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

    // ---------- DYNAMIC INFO SLIDER ----------
    const liveProgramEl = document.getElementById('live-program');
    const locationEl = document.getElementById('location');
    const ageDisplayEl = document.getElementById('age-display');
    const trainingDaysEl = document.getElementById('training-days');
    const configEl = document.getElementById('program-info-config');

    // Use the URL generated by Flask if available, otherwise default
    // Note: base.html probably has the config, or we can put it in join.html
    // I put it in base.html in the previous step, so it should be available.
    // However, JS runs on join.html. base.html wraps it.

    const jsonUrl = configEl ? configEl.getAttribute('data-url') : '/static/data/program_info.json';

    // Mappings: JSON Key -> Element
    let programData = null;
    let currentIndex = 0;

    console.log('Fetching program info from:', jsonUrl);

    fetch(jsonUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            console.log('Program info loaded:', data);
            programData = data;
            // Start the cycle
            setInterval(cycleInfo, 5000);
        })
        .catch(err => console.error('Error loading program info:', err));

    function cycleInfo() {
        if (!programData) return;

        // Keys in JSON
        const keys = {
            "Live Program": liveProgramEl,
            "Location": locationEl,
            "Age": ageDisplayEl,
            "Training days": trainingDaysEl
        };

        // Validate data structure
        if (!programData["Live Program"] || !Array.isArray(programData["Live Program"])) {
            console.error("Invalid data structure for Live Program");
            return;
        }

        // Determine next index
        const dataLength = programData["Live Program"].length;
        const nextIndex = (currentIndex + 1) % dataLength;

        // Animate out
        Object.values(keys).forEach(el => {
            if (el) el.classList.add('slide-out');
        });

        // Wait for slide-out transition (500ms), then swap and slide-in
        setTimeout(() => {
            for (const [key, el] of Object.entries(keys)) {
                if (!el) continue;

                // Safety check for key existence
                if (!programData[key]) continue;

                let newValue = programData[key][nextIndex];
                // Append " years" for Age if needed
                if (key === "Age") {
                    newValue += " years";
                }

                el.textContent = newValue;

                // Prepare for slide-in
                el.classList.remove('slide-out');
                el.classList.add('slide-in-start');

                // Trigger reflow to apply the start position
                void el.offsetWidth;

                // Animate in to normal position
                el.classList.remove('slide-in-start');
            }

            currentIndex = nextIndex;
        }, 500); // Matches CSS transition time
    }

})();