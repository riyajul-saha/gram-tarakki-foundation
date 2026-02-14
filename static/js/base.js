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

// Dynamic Gallery Link Logic
document.addEventListener('DOMContentLoaded', () => {
    const galleryLink = document.querySelector('.nav-menu a[href="#program-gallery"], .nav-menu a[href="#gallery"], .nav-menu a[href*="gallery"]');

    // Find the Gallery link specifically by text content if selector is ambiguous
    const navLinks = document.querySelectorAll('.nav-menu a');
    let targetLink = null;

    navLinks.forEach(link => {
        if (link.textContent.trim() === 'Gallery') {
            targetLink = link;
        }
    });

    if (targetLink) {
        if (window.location.pathname.includes('/programs')) {
            targetLink.setAttribute('href', '#program-gallery');
        } else {
            // Check if we are already on home page to avoid full reload if possible, 
            // but for "home section" request, usually means /#gallery
            // We need to construct the path to home + #gallery
            // The home link usually has the correct base path
            const homeLink = document.querySelector('.nav-menu a[href$="/"]'); // naive check

            // Better approach: use the home link's href as base
            // Assuming the first link is Home or the logo is Home
            const logoLink = document.querySelector('.logo');
            let homeUrl = '/';
            if (logoLink) {
                homeUrl = logoLink.getAttribute('href');
            }

            // Remove trailing slash if present to avoid double slash
            if (homeUrl.endsWith('/')) {
                homeUrl = homeUrl.slice(0, -1);
            }

            if (window.location.pathname === homeUrl || window.location.pathname === homeUrl + '/') {
                targetLink.setAttribute('href', '#gallery');
            } else {
                targetLink.setAttribute('href', homeUrl + '/#gallery');
            }
        }
    }
});
