document.addEventListener('DOMContentLoaded', function() {
    // Update thumbnails when carousel slides
    const carousel = document.getElementById('carouselExampleAutoplaying');
    if (carousel) {
        carousel.addEventListener('slide.bs.carousel', function (e) {
            const thumbnails = document.querySelectorAll('.thumbnail');
            thumbnails.forEach(thumb => thumb.classList.remove('active'));
            thumbnails[e.to].classList.add('active');
        });
    }

    // Click thumbnail to change carousel slide
    document.querySelectorAll('.thumbnail').forEach((thumb, index) => {
        thumb.addEventListener('click', function() {
            const carousel = new bootstrap.Carousel(document.getElementById('carouselExampleAutoplaying'));
            carousel.to(index);
        });
    });
});

// Lightbox functions
function showLightbox(src) {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = lightbox.querySelector('img');
    lightboxImg.src = src;
    lightbox.style.display = 'flex';
}

function hideLightbox() {
    document.getElementById('lightbox').style.display = 'none';
}

// Close lightbox with escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        hideLightbox();
    }
}); 