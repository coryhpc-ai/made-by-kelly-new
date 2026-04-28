// js/main.js

document.addEventListener('DOMContentLoaded', () => {
    
    const burger = document.getElementById('burger');
    const mobileMenu = document.getElementById('mobileMenu');

    if (burger && mobileMenu) {
        burger.addEventListener('click', () => {
            mobileMenu.classList.toggle('active');
            
            // Optional: Animate burger into X
            burger.classList.toggle('active');
        });
    }

    // Close mobile menu when clicking a link
    const mobileLinks = document.querySelectorAll('.mobile-menu a');
    mobileLinks.forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.remove('active');
            burger.classList.remove('active');
        });
    });
});