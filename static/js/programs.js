
// Scroll animations for program sections
const programContainers = document.querySelectorAll('.program-container');
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

programContainers.forEach(container => {
    observer.observe(container);
});

// Gallery Slider Functionality
const slides = document.querySelectorAll('.gallery-slide');
const dots = document.querySelectorAll('.slider-dot');
const prevBtn = document.querySelector('.prev-slide');
const nextBtn = document.querySelector('.next-slide');
const filterBtns = document.querySelectorAll('.filter-btn');
let currentSlide = 0;
let slideInterval;

// Function to show slide
function showSlide(index) {
    // Hide all slides
    slides.forEach(slide => {
        slide.classList.remove('active');
    });

    // Remove active class from all dots
    dots.forEach(dot => {
        dot.classList.remove('active');
    });

    // Show current slide and activate corresponding dot
    slides[index].classList.add('active');
    dots[index].classList.add('active');
    currentSlide = index;

    // Update filter buttons
    filterBtns.forEach(btn => btn.classList.remove('active'));
    // Check if slided exists before trying to get attribute
    if (slides[index]) {
        const filter = slides[index].getAttribute('data-category');
        const filterBtn = document.querySelector(`.filter-btn[data-filter="${filter}"]`);
        if (filterBtn) {
            filterBtn.classList.add('active');
        }
    }
}

// Next slide function
function nextSlide() {
    let nextIndex = currentSlide + 1;
    if (nextIndex >= slides.length) {
        nextIndex = 0;
    }
    showSlide(nextIndex);
}

// Previous slide function
function prevSlide() {
    let prevIndex = currentSlide - 1;
    if (prevIndex < 0) {
        prevIndex = slides.length - 1;
    }
    showSlide(prevIndex);
}

// Auto slide every 5 seconds
function startAutoSlide() {
    // Clear existing interval to avoid duplicates
    if (slideInterval) clearInterval(slideInterval);
    slideInterval = setInterval(nextSlide, 3500);
}

// Stop auto sliding on hover
const slider = document.querySelector('.gallery-slider');
if (slider) {
    slider.addEventListener('mouseenter', () => {
        clearInterval(slideInterval);
    });

    slider.addEventListener('mouseleave', () => {
        startAutoSlide();
    });
}

// Event listeners for slider controls
if (nextBtn) nextBtn.addEventListener('click', nextSlide);
if (prevBtn) prevBtn.addEventListener('click', prevSlide);

// Event listeners for dots
dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
        showSlide(index);
    });
});

// Event listeners for filter buttons
filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const filter = btn.getAttribute('data-filter');

        // Find slide with matching category
        if (filter === 'all') {
            // Logic for 'all' could be different, but assuming first slide is 'all' or similar
            // This part might need adjustment based on how 'all' is handled in the original code logic.
            // Looking at original code:
            // <div class="gallery-slide active" data-category="all">
            // So if filter is 'all', we search for data-category="all"
        }

        slides.forEach((slide, index) => {
            if (slide.getAttribute('data-category') === filter) {
                showSlide(index);
            }
        });
    });
});

// Lightbox functionality
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const closeLightbox = document.querySelector('.close-lightbox');
const galleryThumbs = document.querySelectorAll('.gallery-thumb');

if (lightbox && lightboxImg && closeLightbox) {
    galleryThumbs.forEach(thumb => {
        thumb.addEventListener('click', () => {
            const imgSrc = thumb.getAttribute('data-src');
            lightboxImg.setAttribute('src', imgSrc);
            lightbox.classList.add('active');
        });
    });

    closeLightbox.addEventListener('click', () => {
        lightbox.classList.remove('active');
    });

    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            lightbox.classList.remove('active');
        }
    });
}

// Initialize
// Only start if slides exist
if (slides.length > 0) {
    startAutoSlide();
}

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
