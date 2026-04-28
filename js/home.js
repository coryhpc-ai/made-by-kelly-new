// js/home.js
document.addEventListener('DOMContentLoaded', () => {

    // === HERO SLIDESHOW ===
    const slides = document.querySelectorAll('.hero-slide');
    const dots = document.querySelectorAll('.hero-dot');
    let currentSlide = 0;

    function showSlide(n) {
        slides.forEach(slide => slide.classList.remove('active'));
        dots.forEach(dot => dot.classList.remove('active'));
        slides[n].classList.add('active');
        dots[n].classList.add('active');
    }

    setInterval(() => {
        currentSlide = (currentSlide + 1) % slides.length;
        showSlide(currentSlide);
    }, 6000);

    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            currentSlide = index;
            showSlide(currentSlide);
        });
    });

    // === TESTIMONIALS CENTERED CAROUSEL ===
    const track = document.getElementById('testimonialTrack');
    if (track) {
        let currentIndex = 1; // Start with middle card visible
        const cards = document.querySelectorAll('.testimonial-card');
        const total = cards.length;

        function updateCarousel() {
            const offset = (currentIndex - 1) * -100;
            track.style.transform = `translateX(${offset}%)`;
        }

        function nextSlide() {
            currentIndex = (currentIndex + 1) % total;
            if (currentIndex === 0) currentIndex = 1; // Keep center bias
            updateCarousel();
        }

        // Auto rotate every 5 seconds
        setInterval(nextSlide, 5000);

        // Initial position
        updateCarousel();
    }
});