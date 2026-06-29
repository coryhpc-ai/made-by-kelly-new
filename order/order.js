// order/order.js
import { db } from '../js/firebase.js';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const PRODUCTS = [
  { id:'robe',        name:'Custom Robe',                cat:'Clothing',    price:20,   hasColour:true,  hasSizes:true,  hasName:true,  hasText:true,  colours:['Ivory','Blush Pink','Light Pink','Sage Green','Black','Blue'] },
  { id:'lace-robe',   name:'Lace Edge Robe',             cat:'Clothing',    price:18,   hasColour:true,  hasSizes:true,  hasName:true,  hasText:true,  colours:['Ivory','Blush','Lilac'] },
  { id:'slippers',    name:'Personalised Slippers',      cat:'Clothing',    price:9,    hasColour:true,  hasSizes:true,  hasName:true,  hasText:true,  colours:['White','Pink','Black'] },
  { id:'socks',       name:'Groomsman Socks',            cat:'Clothing',    price:5,    hasColour:true,  hasSizes:false, hasName:true,  hasText:true,  colours:['Black','Navy'] },
  { id:'boxers',      name:'Personalised Boxers',        cat:'Clothing',    price:7.5,  hasColour:false, hasSizes:true,  hasName:true,  hasText:true,  colours:[] },
  { id:'scrunchies',  name:'Scrunchies',                 cat:'Clothing',    price:3.5,  hasColour:true,  hasSizes:false, hasName:true,  hasText:false, colours:['Pink','Sage','Lilac','White'] },
  { id:'hanky',       name:'Personalised Handkerchief',  cat:'Clothing',    price:7,    hasColour:false, hasSizes:false, hasName:true,  hasText:true,  colours:[] },
  { id:'pjs',         name:'Personalised PJs',           cat:'Clothing',    price:22,   hasColour:true,  hasSizes:true,  hasName:true,  hasText:true,  colours:['Pink','Sage','Black'] },
  { id:'apron-a',     name:'Adult Apron',                cat:'Clothing',    price:11,   hasColour:true,  hasSizes:false, hasName:true,  hasText:true,  colours:['Pink','Black','Natural'] },
  { id:'apron-c',     name:'Child Apron',                cat:'Clothing',    price:9,    hasColour:true,  hasSizes:false, hasName:true,  hasText:true,  colours:['Pink','Blue','Natural'] },
  { id:'memorial',    name:'Memorial Cloth',             cat:'Clothing',    price:18,   hasColour:false, hasSizes:false, hasName:false, hasText:true,  colours:[] },
  { id:'fans',        name:'Fans',                       cat:'Clothing',    price:3,    hasColour:false, hasSizes:false, hasName:true,  hasText:false, colours:[] },
  { id:'fg-basket',   name:'Flower Girl Basket',         cat:'Accessories', price:15,   hasColour:true,  hasSizes:false, hasName:true,  hasText:true,  colours:['Natural','Rose Gold','Green'] },
  { id:'fg-wand',     name:'Flower Girl Wand',           cat:'Accessories', price:12,   hasColour:true,  hasSizes:false, hasName:true,  hasText:false, colours:['Pink','White','Lilac'] },
  { id:'hanger',      name:'Personalised Hangers',       cat:'Accessories', price:5.5,  hasColour:false, hasSizes:false, hasName:true,  hasText:true,  colours:[] },
  { id:'hanger-tag',  name:'Hanger Tags',                cat:'Accessories', price:5,    hasColour:false, hasSizes:false, hasName:true,  hasText:true,  colours:[] },
  { id:'claw-clip',   name:'Claw Clip with Ribbon',      cat:'Accessories', price:4.5,  hasColour:true,  hasSizes:false, hasName:false, hasText:false, colours:['Pink','Sage','White'] },
  { id:'rabbit-p',    name:'Pink Rabbit with Dress',     cat:'Accessories', price:15,   hasColour:false, hasSizes:false, hasName:true,  hasText:true,  colours:[] },
  { id:'rabbit-g',    name:'Grey Rabbit',                cat:'Accessories', price:20,   hasColour:false, hasSizes:false, hasName:true,  hasText:true,  colours:[] },
  { id:'teddy',       name:'Teddy Bear with T-Shirt',    cat:'Accessories', price:17,   hasColour:false, hasSizes:false, hasName:true,  hasText:true,  colours:[] },
  { id:'noughts',     name:'Noughts & Crosses',          cat:'Accessories', price:4.5,  hasColour:false, hasSizes:false, hasName:false, hasText:false, colours:[] },
  { id:'harmonica',   name:'Wooden Harmonica',           cat:'Accessories', price:5,    hasColour:false, hasSizes:false, hasName:true,  hasText:false, colours:[] },
  { id:'tambourine',  name:'Tambourine',                 cat:'Accessories', price:8.5,  hasColour:false, hasSizes:false, hasName:true,  hasText:false, colours:[] },
  { id:'seat-sign',   name:'Pick a Seat Sign',           cat:'Accessories', price:21,   hasColour:false, hasSizes:false, hasName:false, hasText:true,  colours:[] },
  { id:'flutes',      name:'Champagne Flutes',           cat:'Drinkware',   price:5.5,  hasColour:false, hasSizes:false, hasName:true,  hasText:true,  colours:[] },
  { id:'wine-glass',  name:'Wine Glass',                 cat:'Drinkware',   price:5.5,  hasColour:false, hasSizes:false, hasName:true,  hasText:true,  colours:[] },
  { id:'pint',        name:'Pint Glasses',               cat:'Drinkware',   price:6.5,  hasColour:false, hasSizes:false, hasName:true,  hasText:true,  colours:[] },
  { id:'shot',        name:'Shot Glasses',               cat:'Drinkware',   price:4,    hasColour:false, hasSizes:false, hasName:true,  hasText:true,  colours:[] },
  { id:'flask',       name:'Hip Flask',                  cat:'Drinkware',   price:6,    hasColour:false, hasSizes:false, hasName:true,  hasText:true,  colours:[] },
  { id:'flask-box',   name:'Boxed Hip Flask Set',        cat:'Drinkware',   price:15,   hasColour:false, hasSizes:false, hasName:true,  hasText:true,  colours:[] },
  { id:'opener',      name:'Bottle Openers',             cat:'Drinkware',   price:4.5,  hasColour:false, hasSizes:false, hasName:true,  hasText:true,  colours:[] },
  { id:'tumbler',     name:'Mixer Glass Tumbler',        cat:'Drinkware',   price:5.5,  hasColour:false, hasSizes:false, hasName:true,  hasText:true,  colours:[] },
  { id:'plastic-cup', name:'Clear Plastic Tumblers',     cat:'Drinkware',   price:6,    hasColour:false, hasSizes:false, hasName:false, hasText:false, colours:[] },
  { id:'stein',       name:'Beer Steins',                cat:'Drinkware',   price:10,   hasColour:false, hasSizes:false, hasName:true,  hasText:true,  colours:[] },
  { id:'frosted',     name:'Frosted Cups',               cat:'Drinkware',   price:5,    hasColour:false, hasSizes:false, hasName:true,  hasText:true,  colours:[] },
  { id:'gift-bag',    name:'Gift Bags',                  cat:'Gifting',     price:5,    hasColour:true,  hasSizes:false, hasName:false, hasText:false, colours:['Black','White','Clear'] },
  { id:'large-bag',   name:'Large Brown & White Bags',   cat:'Gifting',     price:7,    hasColour:true,  hasSizes:false, hasName:false, hasText:false, colours:['Brown','White'] },
  { id:'mag-box',     name:'Magnetic Gift Box',          cat:'Gifting',     price:12,   hasColour:true,  hasSizes:false, hasName:false, hasText:false, colours:['Black','White','Pink','Sage'] },
  { id:'fold-box',    name:'DIY Fold Out Box',           cat:'Gifting',     price:6,    hasColour:false, hasSizes:false, hasName:false, hasText:false, colours:[] },
  { id:'bm-necklace', name:'Bridesmaid Necklace',        cat:'Bridal',      price:8,    hasColour:false, hasSizes:false, hasName:true,  hasText:true,  colours:[] },
  { id:'bm-cards',    name:'Will You Be My Cards',       cat:'Bridal',      price:1.5,  hasColour:false, hasSizes:false, hasName:true,  hasText:true,  colours:[] },
];

const SIZES = ['XS','S','M','L','XL','XXL','Size 3','Size 4','Size 5','Size 6','Size 7','Size 8'];

// basket[id] = { product, qty, colour, sameForAll: true/false/null, shared:{name,text,size}, individual:[{name,text,size}] }
let basket = {};

// ── STEP NAV ──
function showStep(n) {
    [1,2,3].forEach(i => {
        document.getElementById(`step${i}`).style.display = i === n ? 'block' : 'none';
        const el = document.querySelector(`.progress-step[data-step="${i}"]`);
        el.classList.toggle('active', i === n);
        el.classList.toggle('done', i < n);
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.getElementById('toStep2').addEventListener('click', () => {
    if (!Object.keys(basket).length) return;
    renderPersonalisation();
    showStep(2);
});
document.getElementById('backToStep1').addEventListener('click', () => showStep(1));
document.getElementById('toStep3').addEventListener('click', () => {
    if (!validateStep2()) return;
    renderOrderSummary();
    showStep(3);
});
document.getElementById('backToStep2').addEventListener('click', () => showStep(2));

// ── STEP 1: PRODUCT PICKER ──
function renderPicker(filter = '') {
    const picker = document.getElementById('productPicker');
    const filtered = PRODUCTS.filter(p =>
        p.name.toLowerCase().includes(filter.toLowerCase()) ||
        p.cat.toLowerCase().includes(filter.toLowerCase())
    );
    const cats = [...new Set(filtered.map(p => p.cat))];
    picker.innerHTML = cats.map(cat => `
        <div class="picker-cat-label">${cat}</div>
        ${filtered.filter(p => p.cat === cat).map(p => `
            <div class="picker-card ${basket[p.id] ? 'selected' : ''}" data-id="${p.id}">
                <div class="picker-check">✓</div>
                <div class="picker-name">${p.name}</div>
                <div class="picker-price">£${p.price.toFixed(2)}</div>
            </div>`).join('')}
    `).join('');

    picker.querySelectorAll('.picker-card').forEach(card => {
        card.addEventListener('click', () => {
            const id = card.dataset.id;
            const product = PRODUCTS.find(p => p.id === id);
            if (basket[id]) {
                delete basket[id];
            } else {
                basket[id] = { product, qty: 1, colour: '', sameForAll: null, shared: { name:'', text:'', size:'', colour:'' }, individual: [{ name:'', text:'', size:'', colour:'' }] };
            }
            renderPicker(document.getElementById('productSearch').value);
            updateBasketMini();
        });
    });
}

function updateBasketMini() {
    const items = Object.values(basket);
    const mini = document.getElementById('basketMini');
    const btn  = document.getElementById('toStep2');
    if (!items.length) { mini.style.display='none'; btn.style.display='none'; return; }
    const total = items.reduce((s, {product, qty}) => s + product.price * qty, 0);
    document.getElementById('basketMiniText').textContent = `${items.length} item${items.length>1?'s':''} · £${total.toFixed(2)}`;
    mini.style.display = 'block';
    btn.style.display = 'block';
}

document.getElementById('productSearch').addEventListener('input', e => renderPicker(e.target.value));

// ── STEP 2: PERSONALISATION ──
function renderPersonalisation() {
    const form = document.getElementById('personalisationForm');
    form.innerHTML = Object.values(basket).map(({product}) => renderItemBlock(product)).join('');
    attachPersonalisationListeners();
}

function renderItemBlock(product) {
    const item = basket[product.id];
    const needsPersonalisation = product.hasName || product.hasText || product.hasSizes || product.hasColour;

    return `
    <div class="item-personalise-block" id="block-${product.id}">
        <div class="item-personalise-header">
            <div class="item-personalise-name">${product.name}</div>
            <div class="item-personalise-price">£${product.price.toFixed(2)} each</div>
        </div>

        <!-- QTY SELECTOR -->
        <div class="qty-row">
            <label>How many?</label>
            <div class="qty-pill-wrap" id="qtypills-${product.id}">
                ${[1,2,3,4,5,6,7,8,9,10].map(n => `
                    <button class="qty-pill ${item.qty === n ? 'selected' : ''}" data-id="${product.id}" data-qty="${n}">${n}</button>
                `).join('')}
                <button class="qty-pill ${item.qty > 10 ? 'selected' : ''} qty-more" data-id="${product.id}">10+</button>
            </div>
            ${item.qty > 10 ? `<input type="number" class="qty-manual-input" data-id="${product.id}" value="${item.qty}" min="11" max="100" style="margin-top:10px;width:100px;padding:8px 12px;border:1.5px solid #8fa88f;border-radius:8px;font-size:0.95rem;font-family:'Inter',sans-serif;outline:none">` : ''}
            <span class="qty-line-total" id="linetotal-${product.id}">£${(product.price * item.qty).toFixed(2)}</span>
        </div>

        ${needsPersonalisation ? `
        <!-- COLOUR — shared when same for all, hidden when individual -->
        ${product.hasColour ? `
        <div class="form-group" id="sharedColour-${product.id}" style="${item.sameForAll === false ? 'display:none' : ''}">
            <label>Colour${item.qty > 1 && item.sameForAll !== false ? ' — same for all items' : ''}</label>
            <select data-id="${product.id}" data-field="colour" class="colour-select">
                <option value="">Select colour...</option>
                ${product.colours.map(c => `<option ${item.colour===c?'selected':''}>${c}</option>`).join('')}
                <option ${item.colour==='Other'?'selected':''}>Other — I'll specify in notes</option>
            </select>
        </div>` : ''}

        <!-- SAME FOR ALL TOGGLE (only show if qty > 1 and has name/text/size) -->
        ${(product.hasName || product.hasText || product.hasSizes) ? `
        <div class="same-for-all-wrap" id="sameToggleWrap-${product.id}" ${item.qty <= 1 ? 'style="display:none"' : ''}>
            <p class="same-for-all-question">Is the personalisation the same on all ${item.qty} items?</p>
            <div class="same-toggle-btns">
                <button class="same-btn ${item.sameForAll === true ? 'active' : ''}" data-id="${product.id}" data-same="true">✅ Yes, all the same</button>
                <button class="same-btn ${item.sameForAll === false ? 'active' : ''}" data-id="${product.id}" data-same="false">✏️ No, each is different</button>
            </div>
        </div>

        <!-- SHARED FIELDS (qty=1 OR sameForAll=true) -->
        <div class="personalise-fields" id="sharedFields-${product.id}"
             style="${item.qty > 1 && item.sameForAll !== true ? 'display:none' : ''}">
            ${renderPersonaliseFields(product, item.shared, 'shared', item.qty > 1)}
        </div>

        <!-- INDIVIDUAL FIELDS (sameForAll=false) -->
        <div id="individualFields-${product.id}" style="${item.sameForAll === false ? '' : 'display:none'}">
            ${item.individual.map((ind, i) => `
            <div class="individual-item-block">
                <div class="individual-item-label">Item ${i + 1} of ${item.qty}</div>
                ${renderPersonaliseFields(product, ind, `ind_${i}`, false)}
            </div>`).join('')}
        </div>
        ` : ''}

        <!-- INSTRUCTIONS -->
        <div class="form-group" style="margin-top:8px">
            <label>Any other notes for this item?</label>
            <textarea data-id="${product.id}" data-field="instructions" rows="2" placeholder="Font preferences, special requests...">${item.instructions||''}</textarea>
        </div>
        ` : '<p style="color:#888;font-size:0.9rem;padding:8px 0">No personalisation needed for this item.</p>'}
    </div>`;
}

function renderPersonaliseFields(product, data, prefix, showSizeNote) {
    // showSizeNote=true means shared (all items same) — don't show colour per item
    // showSizeNote=false means individual item
    const isIndividual = prefix.startsWith('ind_');
    return `
    <div class="personalise-fields-inner">
        ${product.hasName ? `
        <div class="form-group">
            <label>Name to personalise${showSizeNote ? ' (same for all)' : ''}</label>
            <input type="text" class="pfield" data-prefix="${prefix}" data-field="name" placeholder="e.g. Sarah" value="${data?.name||''}">
        </div>` : ''}
        ${product.hasText ? `
        <div class="form-group">
            <label>Custom text${showSizeNote ? ' (same for all)' : ''}</label>
            <input type="text" class="pfield" data-prefix="${prefix}" data-field="text" placeholder="e.g. Bridesmaid, Best Mum Ever..." value="${data?.text||''}">
        </div>` : ''}
        ${product.hasColour && isIndividual ? `
        <div class="form-group">
            <label>Colour</label>
            <select class="pfield" data-prefix="${prefix}" data-field="colour">
                <option value="">Select colour...</option>
                ${product.colours.map(c => `<option ${data?.colour===c?'selected':''}>${c}</option>`).join('')}
                <option ${data?.colour==='Other'?'selected':''}>Other — specify in notes</option>
            </select>
        </div>` : ''}
        ${product.hasSizes ? `
        <div class="form-group">
            <label>Size</label>
            <select class="pfield" data-prefix="${prefix}" data-field="size">
                <option value="">Select size...</option>
                ${SIZES.map(s => `<option ${data?.size===s?'selected':''}>${s}</option>`).join('')}
            </select>
        </div>` : ''}
    </div>`;
}

function attachPersonalisationListeners() {
    const form = document.getElementById('personalisationForm');

    // QTY PILLS
    form.querySelectorAll('.qty-pill:not(.qty-more)').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            const qty = parseInt(btn.dataset.qty);
            updateQty(id, qty);
        });
    });

    form.querySelectorAll('.qty-more').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            updateQty(id, 11);
        });
    });

    form.querySelectorAll('.qty-manual-input').forEach(input => {
        input.addEventListener('input', () => {
            const id = input.dataset.id;
            const qty = Math.max(11, Math.min(100, parseInt(input.value) || 11));
            basket[id].qty = qty;
            document.getElementById(`linetotal-${id}`).textContent = `£${(basket[id].product.price * qty).toFixed(2)}`;
            if (basket[id].sameForAll === false) {
                basket[id].individual = Array.from({length: qty}, (_, i) => basket[id].individual[i] || {name:'',text:'',size:'',colour:''});
                document.getElementById(`individualFields-${id}`).innerHTML =
                    basket[id].individual.map((ind, i) => `
                    <div class="individual-item-block">
                        <div class="individual-item-label">Item ${i+1} of ${qty}</div>
                        ${renderPersonaliseFields(basket[id].product, ind, `ind_${i}`, false)}
                    </div>`).join('');
                attachPfieldListeners(id);
            }
            updateSameToggleVisibility(id);
        });
    });

    // SAME/DIFFERENT TOGGLE
    form.querySelectorAll('.same-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            const same = btn.dataset.same === 'true';
            basket[id].sameForAll = same;

            form.querySelectorAll(`.same-btn[data-id="${id}"]`).forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const sharedEl = document.getElementById(`sharedFields-${id}`);
            const indEl    = document.getElementById(`individualFields-${id}`);

            const sharedColourEl = document.getElementById(`sharedColour-${id}`);
            if (same) {
                sharedEl.style.display = 'block';
                indEl.style.display = 'none';
                if (sharedColourEl) sharedColourEl.style.display = 'block';
            } else {
                sharedEl.style.display = 'none';
                indEl.style.display = 'block';
                if (sharedColourEl) sharedColourEl.style.display = 'none';
                // Build individual entries if not already
                const qty = basket[id].qty;
                basket[id].individual = Array.from({length: qty}, (_, i) => basket[id].individual[i] || {name:'',text:'',size:'',colour:''});
                indEl.innerHTML = basket[id].individual.map((ind, i) => `
                    <div class="individual-item-block">
                        <div class="individual-item-label">Item ${i+1} of ${qty}</div>
                        ${renderPersonaliseFields(basket[id].product, ind, `ind_${i}`, false)}
                    </div>`).join('');
                attachPfieldListeners(id);
            }
        });
    });

    // COLOUR
    form.querySelectorAll('.colour-select').forEach(sel => {
        sel.addEventListener('change', () => { basket[sel.dataset.id].colour = sel.value; });
    });

    // INSTRUCTIONS
    form.querySelectorAll('[data-field="instructions"]').forEach(el => {
        el.addEventListener('input', () => { basket[el.dataset.id].instructions = el.value; });
    });

    // PFIELDS (shared)
    Object.keys(basket).forEach(id => attachPfieldListeners(id));
}

function attachPfieldListeners(id) {
    const block = document.getElementById(`block-${id}`);
    if (!block) return;
    block.querySelectorAll('.pfield').forEach(el => {
        el.addEventListener('input', () => savePfield(id, el));
        el.addEventListener('change', () => savePfield(id, el));
    });
}

function savePfield(id, el) {
    const prefix = el.dataset.prefix;
    const field  = el.dataset.field;
    if (prefix === 'shared') {
        basket[id].shared[field] = el.value;
    } else if (prefix.startsWith('ind_')) {
        const idx = parseInt(prefix.replace('ind_', ''));
        if (!basket[id].individual[idx]) basket[id].individual[idx] = {};
        basket[id].individual[idx][field] = el.value;
    }
}

function updateQty(id, qty) {
    basket[id].qty = qty;
    basket[id].sameForAll = null;
    basket[id].individual = Array.from({length: qty}, (_, i) => basket[id].individual[i] || {name:'',text:'',size:'',colour:''});

    const block = document.getElementById(`block-${id}`);
    block.innerHTML = renderItemBlock(basket[id].product).replace(/<div class="item-personalise-block"[^>]*>/, '').replace(/<\/div>$/, '');
    const newBlock = document.createElement('div');
    newBlock.className = 'item-personalise-block';
    newBlock.id = `block-${id}`;
    newBlock.innerHTML = document.getElementById(`block-${id}`).innerHTML;

    // Re-render the whole block cleanly
    document.getElementById(`block-${id}`).outerHTML = renderItemBlock(basket[id].product);
    attachPersonalisationListeners();
    updateBasketMini();
}

function updateSameToggleVisibility(id) {
    const wrap = document.getElementById(`sameToggleWrap-${id}`);
    if (wrap) wrap.style.display = basket[id].qty <= 1 ? 'none' : 'block';
    if (basket[id].qty <= 1) {
        const sharedEl = document.getElementById(`sharedFields-${id}`);
        if (sharedEl) sharedEl.style.display = 'block';
        const indEl = document.getElementById(`individualFields-${id}`);
        if (indEl) indEl.style.display = 'none';
        basket[id].sameForAll = true;
    }
}

// ── VALIDATE STEP 2 ──
function validateStep2() {
    let valid = true;
    Object.values(basket).forEach(item => {
        const p = item.product;
        if (!p.hasName && !p.hasText && !p.hasSizes) return;
        if (item.qty <= 1 || item.sameForAll === true) return; // shared — ok
        if (item.qty > 1 && item.sameForAll === null) {
            // They haven't answered same/different
            const wrap = document.getElementById(`sameToggleWrap-${item.product.id}`);
            if (wrap) {
                wrap.style.border = '2px solid #e05a6a';
                wrap.style.borderRadius = '12px';
                wrap.style.padding = '12px';
                wrap.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            valid = false;
        }
    });
    return valid;
}

// ── STEP 3: POSTCODE AUTOCOMPLETE ──
let postcodeTimer = null;
let confirmedPostcode = '';

const postcodeInput = document.getElementById('postcodeInput');
const suggestionsEl = document.getElementById('postcodeSuggestions');
const houseSection  = document.getElementById('houseSection');
const manualWrap    = document.getElementById('manualAddressWrap');
const custAddress   = document.getElementById('custAddress');

// Always-visible manual link
document.getElementById('toggleManual').addEventListener('click', () => {
    manualWrap.style.display = 'block';
    houseSection.style.display = 'none';
    suggestionsEl.style.display = 'none';
    if (confirmedPostcode && !custAddress.value.includes(confirmedPostcode)) {
        custAddress.value = `\n\n${confirmedPostcode}`;
    }
    custAddress.focus();
});

// Autocomplete as they type
postcodeInput.addEventListener('input', () => {
    const val = postcodeInput.value.trim().toUpperCase().replace(/\s+/g,'');
    clearTimeout(postcodeTimer);
    suggestionsEl.innerHTML = '';
    suggestionsEl.style.display = 'none';
    houseSection.style.display = 'none';
    document.getElementById('postcodeError').style.display = 'none';
    if (val.length < 2) return;

    postcodeTimer = setTimeout(async () => {
        try {
            const res  = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(val)}/autocomplete`);
            const data = await res.json();
            const results = (data.result || []).slice(0, 8);
            if (!results.length) return;
            suggestionsEl.innerHTML = results.map(pc =>
                `<div class="postcode-suggestion" data-pc="${pc}">${pc}</div>`
            ).join('');
            suggestionsEl.style.display = 'block';
            suggestionsEl.querySelectorAll('.postcode-suggestion').forEach(el => {
                el.addEventListener('mousedown', e => { e.preventDefault(); selectPostcode(el.dataset.pc); });
            });
        } catch(e) {}
    }, 300);
});

function selectPostcode(pc) {
    confirmedPostcode = pc;
    postcodeInput.value = pc;
    suggestionsEl.style.display = 'none';
    houseSection.style.display = 'block';
    document.getElementById('houseInput').value = '';
    document.getElementById('housePreview').innerHTML = '';
    document.getElementById('postcodeConfirmed').textContent = pc;
    document.getElementById('houseInput').focus();
}

// House number input
document.getElementById('houseInput').addEventListener('input', function() {
    const house = this.value.trim();
    const preview = document.getElementById('housePreview');
    if (!house) { preview.innerHTML = ''; return; }

    const fullAddress = `${house}\n${confirmedPostcode}`;
    preview.innerHTML = `
        <div class="house-preview">
            <div class="house-preview-label">Your delivery address:</div>
            <div class="house-preview-address">${house}<br>${confirmedPostcode}</div>
            <div class="house-preview-actions">
                <button class="btn-confirm-address" id="confirmAddressBtn">✓ Use this address</button>
                <button class="btn-link-subtle" id="notMyAddress">Different address? Enter manually</button>
            </div>
        </div>`;

    document.getElementById('confirmAddressBtn').addEventListener('click', () => {
        custAddress.value = fullAddress;
        manualWrap.style.display = 'block';
        document.getElementById('housePreview').innerHTML = `
            <div class="counter-ok" style="margin-top:8px">
                ✅ Address confirmed — you can edit below if needed.
            </div>`;
    });

    document.getElementById('notMyAddress').addEventListener('click', () => {
        manualWrap.style.display = 'block';
        custAddress.value = `${house}\n\n${confirmedPostcode}`;
        custAddress.focus();
        preview.innerHTML = '';
    });
});

// Hide suggestions on outside click
document.addEventListener('click', e => {
    if (!e.target.closest('.postcode-wrap')) suggestionsEl.style.display = 'none';
});


// ── ORDER SUMMARY ──
function renderOrderSummary() {
    const items = Object.values(basket);
    let total = 0;
    const el = document.getElementById('orderSummaryFinal');
    const lines = items.map(({product, qty}) => {
        const line = product.price * qty;
        total += line;
        return `
        <div class="summary-item">
            <div>
                <div class="summary-item-name">${product.name}</div>
                <div class="summary-item-qty">× ${qty}</div>
            </div>
            <div class="summary-item-price">£${line.toFixed(2)}</div>
        </div>`;
    }).join('');
    el.innerHTML = `<h4>Order Summary</h4>${lines}<div class="summary-total"><span>Estimated Total</span><span>£${total.toFixed(2)}</span></div>`;
}

// ── SUBMIT ──
document.getElementById('submitOrderBtn').addEventListener('click', async () => {
    const name    = document.getElementById('custName').value.trim();
    const email   = document.getElementById('custEmail').value.trim();
    const address = document.getElementById('custAddress').value.trim();

    if (!name)    { alert('Please enter your name.'); return; }
    if (!email)   { alert('Please enter your email address.'); return; }
    if (!address) {
        // Check if they have a postcode + house entered even if not confirmed
        const house = document.getElementById('houseInput')?.value.trim();
        const pc    = document.getElementById('postcodeInput')?.value.trim();
        if (!house && !pc) {
            alert('Please enter your delivery address.'); return;
        }
        // Auto-fill from postcode + house
        if (house && pc) document.getElementById('custAddress').value = `${house}\n${pc}`;
        else if (pc) document.getElementById('custAddress').value = pc;
    }

    const btn = document.getElementById('submitOrderBtn');
    btn.disabled = true;
    document.getElementById('submitText').style.display = 'none';
    document.getElementById('submitSpinner').style.display = 'inline';

    const items = Object.values(basket).map(({product, qty, colour, sameForAll, shared, individual, instructions}) => ({
        productId:   product.id,
        productName: product.name,
        category:    product.cat,
        unitPrice:   product.price,
        qty,
        lineTotal:   product.price * qty,
        colour:      colour || '',
        sameForAll:  qty <= 1 ? true : sameForAll,
        shared:      shared || {},
        individual:  sameForAll === false ? (individual || []) : [],
        instructions: instructions || '',
    }));

    const total = items.reduce((s, i) => s + i.lineTotal, 0);
    const ref   = 'MBK-' + Date.now().toString(36).toUpperCase();

    try {
        await addDoc(collection(db, 'orders'), {
            ref, status: 'pending', createdAt: serverTimestamp(), source: 'website',
            customer: {
                name, email,
                phone:   document.getElementById('custPhone').value.trim(),
                date:    document.getElementById('custDate').value,
                address: document.getElementById('custAddress').value.trim(),
                notes:   document.getElementById('custNotes').value.trim(),
            },
            items, total, paid: false, shipped: false,
        });
        document.getElementById('modalRef').textContent = `Your order ref: ${ref}`;
        document.getElementById('successModal').style.display = 'flex';
        basket = {};
    } catch(err) {
        console.error(err);
        alert('Something went wrong — please try WhatsApp instead.');
        btn.disabled = false;
        document.getElementById('submitText').style.display = 'inline';
        document.getElementById('submitSpinner').style.display = 'none';
    }
});

renderPicker();