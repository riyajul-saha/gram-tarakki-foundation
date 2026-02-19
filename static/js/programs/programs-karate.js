
// Constants
const ITEMS_PER_PAGE = 4;
const TOTAL_IMAGES = 12;
const AUTO_ROTATE_INTERVAL = 3000;

// State
let startIndex = 0;
let autoRotateTimer = null;
let isLightboxOpen = false;

// Generate Gallery Data
const galleryImages = Array.from({ length: TOTAL_IMAGES }).map((_, i) => ({
    id: i,
    url: `https://picsum.photos/800/600?random=${i + 10}`,
    title: `Gallery Image ${i + 1}`
}));

// DOM Elements
const galleryGrid = document.getElementById('gallery-grid');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxClose = document.getElementById('lightbox-close');

// --- Scroll Reveal Logic ---
function initScrollReveal() {
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target); // Only animate once
            }
        });
    }, observerOptions);

    document.querySelectorAll('.scroll-reveal').forEach(el => {
        el.classList.add('scroll-revealed');
        observer.observe(el);
    });
}

// --- Gallery Logic ---

function renderGallery() {
    galleryGrid.innerHTML = '';

    const visibleImages = [];
    for (let i = 0; i < ITEMS_PER_PAGE; i++) {
        const index = (startIndex + i) % galleryImages.length;
        visibleImages.push(galleryImages[index]);
    }

    visibleImages.forEach((img, idx) => {
        const item = document.createElement('div');
        item.className = 'gallery-item';
        item.style.animation = `fadeIn 0.5s ease forwards ${idx * 0.1}s`;
        item.onclick = () => openLightbox(img);

        const imageElement = document.createElement('img');
        imageElement.src = img.url;
        imageElement.alt = img.title;
        imageElement.loading = 'lazy';

        const overlay = document.createElement('div');
        overlay.className = 'gallery-overlay';

        // Icon logic is handled by Lucide, but we need to inject the element first
        const icon = document.createElement('i');
        icon.setAttribute('data-lucide', 'zoom-in');

        overlay.appendChild(icon);
        item.appendChild(imageElement);
        item.appendChild(overlay);

        galleryGrid.appendChild(item);
    });

    // Re-run Lucide to render icons for new elements
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

function nextSlide() {
    startIndex = (startIndex + ITEMS_PER_PAGE) % galleryImages.length;
    renderGallery();
}

function prevSlide() {
    startIndex = (startIndex - ITEMS_PER_PAGE + galleryImages.length) % galleryImages.length;
    renderGallery();
}

function startAutoRotate() {
    stopAutoRotate();
    autoRotateTimer = setInterval(() => {
        if (!isLightboxOpen) {
            nextSlide();
        }
    }, AUTO_ROTATE_INTERVAL);
}

function stopAutoRotate() {
    if (autoRotateTimer) {
        clearInterval(autoRotateTimer);
        autoRotateTimer = null;
    }
}

// --- Lightbox Logic ---

function openLightbox(img) {
    isLightboxOpen = true;
    lightboxImg.src = img.url;
    lightboxImg.alt = img.title;
    lightbox.classList.add('open');
    stopAutoRotate(); // Stop rotation while viewing
}

function closeLightbox() {
    isLightboxOpen = false;
    lightbox.classList.remove('open');
    startAutoRotate(); // Resume rotation
}

// Event Listeners
prevBtn.addEventListener('click', () => {
    prevSlide();
    startAutoRotate(); // Reset timer on manual interaction
});

nextBtn.addEventListener('click', () => {
    nextSlide();
    startAutoRotate(); // Reset timer on manual interaction
});

lightboxClose.addEventListener('click', closeLightbox);
lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) {
        closeLightbox();
    }
});

// Key Press support for Lightbox
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isLightboxOpen) {
        closeLightbox();
    }
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initScrollReveal();
    renderGallery();
    startAutoRotate();

    // Add simple fade-in keyframes for gallery items
    const style = document.createElement('style');
    style.innerHTML = `
    @keyframes fadeIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
  `;
    document.head.appendChild(style);
});
