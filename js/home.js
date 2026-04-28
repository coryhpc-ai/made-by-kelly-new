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

    // TESTIMONIALS - GROUP ROTATION (3 on desktop)
    const allCards = document.querySelectorAll('.testimonial-card');
    let currentGroup = 0;
    const cardsPerGroup = 3;

    function showNextGroup() {
        allCards.forEach(card => {
            card.classList.remove('active');
        });

        const start = currentGroup * cardsPerGroup;
        for (let i = start; i < start + cardsPerGroup && i < allCards.length; i++) {
            allCards[i].classList.add('active');
        }

        currentGroup = (currentGroup + 1) % Math.ceil(allCards.length / cardsPerGroup);
    }

    if (allCards.length > 0) {
        showNextGroup(); // Show first group
        setInterval(showNextGroup, 6000); // Rotate every 6 seconds
    }
});