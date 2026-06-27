// js/shop.js

document.addEventListener('DOMContentLoaded', () => {

    // COLOUR SWATCHES — select one per card
    document.querySelectorAll('.shop-card').forEach(card => {
        card.querySelectorAll('.swatches-row .swatch').forEach(swatch => {
            swatch.addEventListener('click', () => {
                card.querySelectorAll('.swatches-row .swatch').forEach(s => s.classList.remove('selected'));
                swatch.classList.add('selected');
            });
        });
    });

    // OPTION TAGS — toggle on/off
    document.querySelectorAll('.tag').forEach(tag => {
        tag.addEventListener('click', () => {
            tag.classList.toggle('selected');
        });
    });

    // HEART BUTTON — toggle liked
    document.querySelectorAll('.heart-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.classList.toggle('liked');
        });
    });

});