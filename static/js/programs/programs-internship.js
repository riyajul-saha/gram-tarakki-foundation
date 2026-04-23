(function () {
    // ---------- SCROLL REVEAL ----------
    const scrollReveals = document.querySelectorAll('.scroll-reveal');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

    scrollReveals.forEach(el => observer.observe(el));

    // ---------- ROLE CHIP HOVER EFFECT ----------
    const roleChips = document.querySelectorAll('.role-chip');
    roleChips.forEach(chip => {
        chip.addEventListener('mouseenter', function () {
            this.style.transform = 'translateY(-2px) scale(1.02)';
        });
        chip.addEventListener('mouseleave', function () {
            this.style.transform = '';
        });
    });
})();
