// // Mobile Navigation Toggle
// const hamburger = document.querySelector('.hamburger');
// const navMenu = document.querySelector('.nav-menu');
// const hamburgerIcon = hamburger.querySelector('i');

// hamburger.addEventListener('click', () => {
//     navMenu.classList.toggle('active');
//     hamburgerIcon.classList.toggle('fa-bars');
//     hamburgerIcon.classList.toggle('fa-times');
// });

// // Close mobile menu when clicking on a link
// document.querySelectorAll('.nav-menu a').forEach(link => {
//     link.addEventListener('click', () => {
//         navMenu.classList.remove('active');
//         hamburgerIcon.classList.add('fa-bars');
//         hamburgerIcon.classList.remove('fa-times');
//     });
// });

// Lightbox functionality
const galleryItems = document.querySelectorAll('.gallery-item');
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const closeLightbox = document.querySelector('.close-lightbox');

galleryItems.forEach(item => {
    item.addEventListener('click', () => {
        const imgSrc = item.getAttribute('data-src');
        lightboxImg.setAttribute('src', imgSrc);
        lightbox.classList.add('active');
    });
});

closeLightbox.addEventListener('click', () => {
    lightbox.classList.remove('active');
});

lightbox.addEventListener('click', (e) => {
    if (e.target !== lightboxImg) {
        lightbox.classList.remove('active');
    }
});

// Testimonial slider
const slides = document.querySelectorAll('.testimonial-slide');
let currentSlide = 0;

function showSlide(index) {
    slides.forEach(slide => slide.classList.remove('active'));
    slides[index].classList.add('active');
}

function nextSlide() {
    currentSlide = (currentSlide + 1) % slides.length;
    showSlide(currentSlide);
}

// Auto-slide testimonials every 10 seconds
setInterval(nextSlide, 10000);

// Form submission
const joinForm = document.getElementById('join-form');

joinForm.addEventListener('submit', (e) => {
    e.preventDefault();
    alert('Thank you for your interest! We will contact you soon.');
    joinForm.reset();
});

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();

        const targetId = this.getAttribute('href');
        if (targetId === '#') return;

        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop - 80,
                behavior: 'smooth'
            });
        }
    });
});

// Simple counter animation for impact numbers
function animateCounter(element, target, duration = 2000) {
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
        start += increment;
        if (start >= target) {
            element.textContent = target;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(start);
        }
    }, 16);
}

// Initialize counters when section comes into view
const observerOptions = {
    threshold: 0.5
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            animateCounter(document.getElementById('villages-count'), 42);
            animateCounter(document.getElementById('people-count'), 1850);
            animateCounter(document.getElementById('events-count'), 67);
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

observer.observe(document.querySelector('.impact'));
