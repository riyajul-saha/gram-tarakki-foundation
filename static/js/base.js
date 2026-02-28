// Mobile Navigation Toggle
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');
const hamburgerIcon = hamburger.querySelector('i');

hamburger.addEventListener('click', () => {
    navMenu.classList.toggle('active');
    hamburgerIcon.classList.toggle('fa-bars');
    hamburgerIcon.classList.toggle('fa-times');
});

// Close mobile menu when clicking on a link
document.querySelectorAll('.nav-menu a').forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        hamburgerIcon.classList.add('fa-bars');
        hamburgerIcon.classList.remove('fa-times');
    });
});

// Highlight Contact link when scrolling to footer
document.addEventListener('DOMContentLoaded', () => {
    const contactSection = document.getElementById('contact');
    const contactLink = document.querySelector('a[href="#contact"]');
    const allNavLinks = document.querySelectorAll('.nav-menu a');

    if (contactSection && contactLink) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    allNavLinks.forEach(link => link.classList.remove('active'));
                    contactLink.classList.add('active');
                } else {
                    contactLink.classList.remove('active');
                    // Restore original active link based on pathname
                    const currentPath = window.location.pathname;
                    allNavLinks.forEach(link => {
                        if (link.getAttribute('href') === currentPath) {
                            link.classList.add('active');
                        }
                    });
                }
            });
        }, { threshold: 0.3 });
        
        observer.observe(contactSection);
    }
});
