// Mobile Navigation Toggle
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');
const hamburgerIcon = hamburger.querySelector('i');

hamburger.addEventListener('click', () => {
    navMenu.classList.toggle('active');
    hamburgerIcon.classList.toggle('fa-bars');
    hamburgerIcon.classList.toggle('fa-times');

    // Close dropdowns if the menu is being closed
    if (!navMenu.classList.contains('active')) {
        document.querySelectorAll('.dropdown').forEach(d => d.classList.remove('active-dropdown'));
    }
});

// Close mobile menu when clicking on a link
document.querySelectorAll('.nav-menu a').forEach(link => {
    link.addEventListener('click', (e) => {
        if (!link.classList.contains('dropbtn')) {
            navMenu.classList.remove('active');
            hamburgerIcon.classList.add('fa-bars');
            hamburgerIcon.classList.remove('fa-times');
            // Close any open dropdowns
            document.querySelectorAll('.dropdown').forEach(d => d.classList.remove('active-dropdown'));
        } else {
            e.preventDefault();
            link.parentElement.classList.toggle('active-dropdown');
        }
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

// PWA Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
        .then(registration => {
            console.log('ServiceWorker registration successful with scope: ', registration.scope);
        })
        .catch(err => {
            console.log('ServiceWorker registration failed: ', err);
        });
    });
}

// Handle custom Install App prompt
let deferredPrompt;
const installNavBtn = document.getElementById('installAppNavBtn');

window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    e.preventDefault();
    // Stash the event so it can be triggered later.
    deferredPrompt = e;
    // Update UI notify the user they can add to home screen
    if(installNavBtn) installNavBtn.style.display = 'block';
});

function handleInstallClick(e) {
    if(e) e.preventDefault();
    if(!deferredPrompt) return;
    // Show the prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
            console.log('User accepted the A2HS prompt');
        } else {
            console.log('User dismissed the A2HS prompt');
        }
        deferredPrompt = null;
        if(installNavBtn) installNavBtn.style.display = 'none';
    });
}

if(installNavBtn) installNavBtn.addEventListener('click', handleInstallClick);

window.addEventListener('appinstalled', (evt) => {
    console.log('App was successfully installed');
    if(installNavBtn) installNavBtn.style.display = 'none';
});
