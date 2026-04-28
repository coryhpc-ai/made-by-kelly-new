// js/home.js
document.addEventListener('DOMContentLoaded', () => {

    // HERO SLIDESHOW
    const slides = document.querySelectorAll('.hero-slide');
    const dots = document.querySelectorAll('.hero-dot');
    let currentSlide = 0;

    function showSlide(n) {
        slides.forEach(slide => slide.classList.remove('active'));
        dots.forEach(dot => dot.classList.remove('active'));
        slides[n].classList.add('active');
        dots[n].classList.add('active');
    }

    if (slides.length > 0) {
        setInterval(() => {
            currentSlide = (currentSlide + 1) % slides.length;
            showSlide(currentSlide);
        }, 6000);
    }

    // TESTIMONIALS - SINGLE CARD FADE
    const testimonialCards = document.querySelectorAll('.testimonial-card');
    let currentTestimonial = 0;

    function fadeNextTestimonial() {
        testimonialCards.forEach(card => card.classList.remove('active'));
        currentTestimonial = (currentTestimonial + 1) % testimonialCards.length;
        testimonialCards[currentTestimonial].classList.add('active');
    }

    if (testimonialCards.length > 0) {
        testimonialCards[0].classList.add('active'); // Show first one
        setInterval(fadeNextTestimonial, 5000);     // Change every 5 seconds
    }
});