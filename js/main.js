// js/main.js - Burger Menu
document.addEventListener('DOMContentLoaded', () => {
    const burger = document.getElementById('burger');
    const mobileMenu = document.getElementById('mobileMenu');

    if (burger && mobileMenu) {
        burger.addEventListener('click', () => {
            mobileMenu.classList.toggle('active');
            burger.classList.toggle('active');
        });
    }

    // Close menu when clicking a link
    const mobileLinks = document.querySelectorAll('.mobile-menu a');
    mobileLinks.forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.remove('active');
            burger.classList.remove('active');
        });
    });
});