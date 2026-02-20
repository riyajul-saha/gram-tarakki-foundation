(function () {
    // Scroll reveal
    const reveals = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.15, rootMargin: '0px 0px -30px 0px' });
    reveals.forEach(el => observer.observe(el));

    // Donation card selection toggle
    const donationCards = document.querySelectorAll('.donation-card');
    donationCards.forEach(card => {
        const btn = card.querySelector('.card-btn');
        if (btn) {
            btn.addEventListener('click', function () {
                // Remove selected class from all cards and their buttons
                donationCards.forEach(c => {
                    c.classList.remove('selected');
                    const b = c.querySelector('.card-btn');
                    if (b) {
                        b.classList.remove('selected');
                        b.textContent = 'Select';
                    }
                });

                // Add selected class to this card and button
                card.classList.add('selected');
                this.classList.add('selected');
                this.textContent = 'Selected';
            });
        }
    });

    // Amount pill active toggle
    const pills = document.querySelectorAll('.amount-pill');
    const customInput = document.getElementById('customAmount');

    pills.forEach(pill => {
        pill.addEventListener('click', function () {
            pills.forEach(p => p.classList.remove('active'));
            this.classList.add('active');
            // clear custom input if needed
            if (customInput) customInput.value = '';
        });
    });

    // Optional: if custom input gets focus, remove active from pills
    if (customInput) {
        customInput.addEventListener('focus', () => {
            pills.forEach(p => p.classList.remove('active'));
        });
    }

    // Sticky donate button smooth scroll
    document.querySelector('.sticky-donate').addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector('#donation-options').scrollIntoView({ behavior: 'smooth' });
    });

    // General Smooth scrolling for anchor links (from home.js)
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            // Skip if it's the sticky button as it has its own handler (though the logic is similar)
            if (this.classList.contains('sticky-donate')) return;

            e.preventDefault();

            const targetId = this.getAttribute('href');
            if (targetId === '#' || targetId === '') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                // Account for fixed header if necessary, or just scroll to element
                const headerOffset = 80; // approximate header height
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth"
                });
            }
        });
    });
})();