        (function() {
            // ---------- SCROLL REVEAL ----------
            const reveals = document.querySelectorAll('.reveal');
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                    }
                });
            }, { threshold: 0.2, rootMargin: '0px 0px -30px 0px' });

            reveals.forEach(el => observer.observe(el));

            // ---------- AUTO GALLERY (change set every 3 seconds) ----------
            const gallerySets = document.getElementById('gallerySets');
            if (gallerySets) {
                const sets = Array.from(gallerySets.children);
                let currentSet = 0;
                const totalSets = sets.length;

                // Hide all sets except first
                sets.forEach((set, index) => {
                    if (index !== 0) set.style.display = 'none';
                });

                setInterval(() => {
                    // hide current
                    sets[currentSet].style.display = 'none';
                    // move to next
                    currentSet = (currentSet + 1) % totalSets;
                    // show next
                    sets[currentSet].style.display = 'grid';
                }, 3000);
            }

            // ---------- BUTTON PULSE (already in CSS) ----------
        })();