const CATEGORIES = ['All', 'Karate', 'Yoga', 'Education', 'Events', 'Awards', 'Community Work'];

const captions = {
  'Karate': ['Belt Distribution Ceremony', 'State Level Championship', 'Self Defense Workshop', 'Morning Practice'],
  'Yoga': ['Yoga Awareness Camp', 'International Yoga Day', 'Meditation Session', 'Kids Yoga Class'],
  'Education': ['Book Distribution', 'Computer Literacy Drive', 'Evening Classes', 'Scholarship Award'],
  'Events': ['Annual Function', 'Cultural Fest', 'Sports Meet', 'Health Camp'],
  'Awards': ['Best NGO Award', 'Volunteer Recognition', 'Community Service Award', 'Youth Icon Award'],
  'Community Work': ['Tree Plantation', 'Cleanliness Drive', 'Food Distribution', 'Winter Clothes Donation']
};

const generateMockPhotos = () => {
  const photos = [];
  const categories = ['Karate', 'Yoga', 'Education', 'Events', 'Awards', 'Community Work'];
  
  for (let i = 1; i <= 24; i++) {
    const category = categories[i % categories.length];
    const categoryCaptions = captions[category];
    const caption = categoryCaptions[i % categoryCaptions.length];
    
    photos.push({
      id: `photo-${i}`,
      url: `https://picsum.photos/seed/gramtarakki${i}/800/600`,
      category,
      caption,
      likes: Math.floor(Math.random() * 100) + 10,
      likedByUser: false,
    });
  }
  return photos;
};

let photos = generateMockPhotos();
let activeCategory = 'All';
let visibleCount = 9;
let lightboxIndex = null;

const categoryTabsContainer = document.getElementById('categoryTabs');
const photoGrid = document.getElementById('photoGrid');
const loadMoreBtn = document.getElementById('loadMoreBtn');
const loadMoreContainer = document.getElementById('loadMoreContainer');
const lightbox = document.getElementById('lightbox');
const lightboxContent = document.getElementById('lightboxContent');
const lightboxCloseBtn = document.getElementById('lightboxClose');
const lightboxPrev = document.getElementById('lightboxPrev');
const lightboxNext = document.getElementById('lightboxNext');

function getFilteredPhotos() {
  return photos.filter(p => activeCategory === 'All' || p.category === activeCategory);
}

function renderCategories() {
  categoryTabsContainer.innerHTML = '';
  CATEGORIES.forEach(category => {
    const btn = document.createElement('button');
    btn.className = `category-btn ${activeCategory === category ? 'active' : ''}`;
    btn.textContent = category;
    btn.onclick = () => {
      activeCategory = category;
      visibleCount = 9;
      renderCategories();
      renderPhotos();
    };
    categoryTabsContainer.appendChild(btn);
  });
}

function handleLike(e, id) {
  e.stopPropagation();
  photos = photos.map(p => {
    if (p.id === id) {
      return {
        ...p,
        likes: p.likedByUser ? p.likes - 1 : p.likes + 1,
        likedByUser: !p.likedByUser
      };
    }
    return p;
  });
  
  if (lightboxIndex !== null) {
    const photo = photos.find(p => p.id === id);
    if(photo) {
        updateLightboxLikeButton(photo.likedByUser, photo.likes);
    }
  }
  
  // Natively update DOM for grid item
  updateGridItemLikeState(id);
}

function updateGridItemLikeState(id) {
    const photo = photos.find(p => p.id === id);
    if (!photo) return;
    
    // Find the specific button and update
    const btn = document.querySelector(`.photo-card button[data-photo-id="${id}"]`);
    if (btn) {
        btn.className = `like-btn ${photo.likedByUser ? 'liked' : ''}`;
    }
    const likesSpan = document.querySelector(`.photo-card .photo-likes-container span[data-photo-counts="${id}"]`);
    if (likesSpan) {
        likesSpan.textContent = `${photo.likes} likes`;
    }
}

function updateLightboxLikeButton(likedByUser, likes) {
    const btn = document.getElementById('lightboxLikeBtn');
    if(btn) {
        btn.className = `lightbox-like-btn ${likedByUser ? 'liked' : ''}`;
        btn.querySelector('span').textContent = likes;
    }
}

function renderPhotos() {
  const visiblePhotos = getFilteredPhotos().slice(0, visibleCount);
  photoGrid.innerHTML = '';
  
  visiblePhotos.forEach((photo, index) => {
    const card = document.createElement('div');
    card.className = 'photo-card show';
    card.style.animationDelay = `${(index % 9) * 0.1}s`;
    card.onclick = () => openLightbox(photo.id);
    
    card.innerHTML = `
      <div class="photo-img-container">
        <img src="${photo.url}" alt="${photo.caption}" loading="lazy" referrerpolicy="no-referrer" />
        <div class="photo-overlay">
          <i data-lucide="maximize-2" style="width: 32px; height: 32px;"></i>
        </div>
        <button class="like-btn ${photo.likedByUser ? 'liked' : ''}" data-photo-id="${photo.id}" onclick="handleLike(event, '${photo.id}')">
          <i data-lucide="heart" style="width: 18px; height: 18px;"></i>
        </button>
      </div>
      <div class="photo-info">
        <div>
          <span class="photo-category">${photo.category}</span>
          <h3 class="photo-caption">${photo.caption}</h3>
        </div>
        <div class="photo-likes-container">
          <i data-lucide="heart" style="width: 14px; height: 14px;"></i>
          <span data-photo-counts="${photo.id}">${photo.likes} likes</span>
        </div>
      </div>
    `;
    photoGrid.appendChild(card);
  });
  
  if (window.lucide) {
    lucide.createIcons();
  }
  
  if (visibleCount < getFilteredPhotos().length) {
    loadMoreContainer.classList.remove('hidden');
  } else {
    loadMoreContainer.classList.add('hidden');
  }
}

// Lightbox logic
let touchStart = null;
let touchEnd = null;

function openLightbox(photoId) {
  const filtered = getFilteredPhotos();
  const index = filtered.findIndex(p => p.id === photoId);
  if (index !== -1) {
    lightboxIndex = index;
    renderLightboxContent();
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden'; // prevent scrolling
  }
}

function closeLightbox() {
  lightbox.classList.remove('open');
  lightboxIndex = null;
  document.body.style.overflow = '';
}

function nextPhoto(e) {
  if (e) e.stopPropagation();
  if (lightboxIndex !== null) {
    const filtered = getFilteredPhotos();
    lightboxIndex = (lightboxIndex + 1) % filtered.length;
    renderLightboxContent();
  }
}

function prevPhoto(e) {
  if (e) e.stopPropagation();
  if (lightboxIndex !== null) {
    const filtered = getFilteredPhotos();
    lightboxIndex = (lightboxIndex - 1 + filtered.length) % filtered.length;
    renderLightboxContent();
  }
}

function renderLightboxContent() {
  if (lightboxIndex === null) return;
  const filtered = getFilteredPhotos();
  const photo = filtered[lightboxIndex];
  
  // Remove animation to re-trigger
  lightboxContent.classList.remove('animate-spring');
  void lightboxContent.offsetWidth; // trigger reflow
  lightboxContent.classList.add('animate-spring');
  
  lightboxContent.innerHTML = `
    <div class="lightbox-img-container">
      <img src="${photo.url}" alt="${photo.caption}" referrerpolicy="no-referrer" />
    </div>
    
    <div class="lightbox-info">
      <div class="lightbox-info-text">
        <h3>${photo.caption}</h3>
        <p>${photo.category}</p>
      </div>
      <button id="lightboxLikeBtn" class="lightbox-like-btn ${photo.likedByUser ? 'liked' : ''}" onclick="handleLike(event, '${photo.id}')">
        <i data-lucide="heart" style="width: 20px; height: 20px;"></i>
        <span>${photo.likes}</span>
      </button>
    </div>
  `;
  if (window.lucide) {
    lucide.createIcons();
  }
}

lightboxCloseBtn.onclick = closeLightbox;
lightboxPrev.onclick = prevPhoto;
lightboxNext.onclick = nextPhoto;

lightbox.onclick = (e) => {
  if (e.target === lightbox || e.target.closest('.lightbox-close')) {
    closeLightbox();
  }
};

lightboxContent.addEventListener('click', (e) => e.stopPropagation());

lightbox.addEventListener('touchstart', (e) => {
  touchEnd = null;
  touchStart = e.targetTouches[0].clientX;
}, { passive: true });

lightbox.addEventListener('touchmove', (e) => {
  touchEnd = e.targetTouches[0].clientX;
}, { passive: true });

lightbox.addEventListener('touchend', () => {
  if (!touchStart || !touchEnd) return;
  const minSwipeDistance = 50;
  const distance = touchStart - touchEnd;
  
  if (distance > minSwipeDistance) {
    nextPhoto();
  } else if (distance < -minSwipeDistance) {
    prevPhoto();
  }
});

window.addEventListener('keydown', (e) => {
  if (lightboxIndex !== null) {
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowRight') nextPhoto();
    if (e.key === 'ArrowLeft') prevPhoto();
  }
});

loadMoreBtn.onclick = () => {
  visibleCount += 9;
  renderPhotos();
};

// INITIALIZE
document.addEventListener('DOMContentLoaded', () => {
  renderCategories();
  renderPhotos();
});
