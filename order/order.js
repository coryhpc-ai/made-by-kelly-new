// js/order.js
import { db } from '../js/firebase.js';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ── ALL PRODUCTS ──
const PRODUCTS = [
  { id:'robe',        name:'Custom Robe',                  cat:'Clothing',    price:20,   hasColour:true,  hasSizes:true,  hasName:true,  colours:['Ivory','Blush','Sage','Black','Blue'] },
  { id:'lace-robe',   name:'Lace Edge Robe',               cat:'Clothing',    price:18,   hasColour:true,  hasSizes:true,  hasName:true,  colours:['Ivory','Blush','Lilac'] },
  { id:'slippers',    name:'Personalised Slippers',        cat:'Clothing',    price:9,    hasColour:true,  hasSizes:true,  hasName:true,  colours:['White','Pink','Black'] },
  { id:'socks',       name:'Groomsman Socks',              cat:'Clothing',    price:5,    hasColour:true,  hasSizes:false, hasName:true,  colours:['Black','Navy'] },
  { id:'boxers',      name:'Personalised Boxers',          cat:'Clothing',    price:7.5,  hasColour:false, hasSizes:true,  hasName:true,  colours:[] },
  { id:'scrunchies',  name:'Scrunchies',                   cat:'Clothing',    price:3.5,  hasColour:true,  hasSizes:false, hasName:true,  colours:['Pink','Sage','Lilac','White'] },
  { id:'hanky',       name:'Personalised Handkerchief',    cat:'Clothing',    price:7,    hasColour:false, hasSizes:false, hasName:true,  colours:[] },
  { id:'pjs',         name:'Personalised PJs',             cat:'Clothing',    price:22,   hasColour:true,  hasSizes:true,  hasName:true,  colours:['Pink','Sage','Black'] },
  { id:'apron-a',     name:'Adult Apron',                  cat:'Clothing',    price:11,   hasColour:true,  hasSizes:false, hasName:true,  colours:['Pink','Black','Natural'] },
  { id:'apron-c',     name:'Child Apron',                  cat:'Clothing',    price:9,    hasColour:true,  hasSizes:false, hasName:true,  colours:['Pink','Blue','Natural'] },
  { id:'memorial',    name:'Memorial Cloth',               cat:'Clothing',    price:18,   hasColour:false, hasSizes:false, hasName:false, colours:[] },
  { id:'fans',        name:'Fans',                         cat:'Clothing',    price:3,    hasColour:false, hasSizes:false, hasName:true,  colours:[] },
  { id:'fg-basket',   name:'Flower Girl Basket',           cat:'Accessories', price:15,   hasColour:true,  hasSizes:false, hasName:true,  colours:['Pink','White','Sage','Lilac'] },
  { id:'fg-wand',     name:'Flower Girl Wand',             cat:'Accessories', price:12,   hasColour:true,  hasSizes:false, hasName:true,  colours:['Pink','White','Lilac'] },
  { id:'hanger',      name:'Personalised Hangers',         cat:'Accessories', price:5.5,  hasColour:false, hasSizes:false, hasName:true,  colours:[] },
  { id:'hanger-tag',  name:'Hanger Tags',                  cat:'Accessories', price:5,    hasColour:false, hasSizes:false, hasName:true,  colours:[] },
  { id:'claw-clip',   name:'Claw Clip with Ribbon',        cat:'Accessories', price:4.5,  hasColour:true,  hasSizes:false, hasName:false, colours:['Pink','Sage','White'] },
  { id:'rabbit-p',    name:'Pink Rabbit with Dress',       cat:'Accessories', price:15,   hasColour:false, hasSizes:false, hasName:true,  colours:[] },
  { id:'rabbit-g',    name:'Grey Rabbit',                  cat:'Accessories', price:20,   hasColour:false, hasSizes:false, hasName:true,  colours:[] },
  { id:'teddy',       name:'Teddy Bear with T-Shirt',      cat:'Accessories', price:17,   hasColour:false, hasSizes:false, hasName:true,  colours:[] },
  { id:'noughts',     name:'Noughts & Crosses',            cat:'Accessories', price:4.5,  hasColour:false, hasSizes:false, hasName:false, colours:[] },
  { id:'harmonica',   name:'Wooden Harmonica',             cat:'Accessories', price:5,    hasColour:false, hasSizes:false, hasName:true,  colours:[] },
  { id:'tambourine',  name:'Tambourine',                   cat:'Accessories', price:8.5,  hasColour:false, hasSizes:false, hasName:true,  colours:[] },
  { id:'seat-sign',   name:'Pick a Seat Sign',             cat:'Accessories', price:21,   hasColour:false, hasSizes:false, hasName:false, colours:[] },
  { id:'flutes',      name:'Champagne Flutes',             cat:'Drinkware',   price:5.5,  hasColour:false, hasSizes:false, hasName:true,  colours:[] },
  { id:'wine-glass',  name:'Wine Glass',                   cat:'Drinkware',   price:5.5,  hasColour:false, hasSizes:false, hasName:true,  colours:[] },
  { id:'pint',        name:'Pint Glasses',                 cat:'Drinkware',   price:6.5,  hasColour:false, hasSizes:false, hasName:true,  colours:[] },
  { id:'shot',        name:'Shot Glasses',                 cat:'Drinkware',   price:4,    hasColour:false, hasSizes:false, hasName:true,  colours:[] },
  { id:'flask',       name:'Hip Flask',                    cat:'Drinkware',   price:6,    hasColour:false, hasSizes:false, hasName:true,  colours:[] },
  { id:'flask-box',   name:'Boxed Hip Flask Set',          cat:'Drinkware',   price:15,   hasColour:false, hasSizes:false, hasName:true,  colours:[] },
  { id:'opener',      name:'Bottle Openers',               cat:'Drinkware',   price:4.5,  hasColour:false, hasSizes:false, hasName:true,  colours:[] },
  { id:'tumbler',     name:'Mixer Glass Tumbler',          cat:'Drinkware',   price:5.5,  hasColour:false, hasSizes:false, hasName:true,  colours:[] },
  { id:'plastic-cup', name:'Clear Plastic Tumblers',       cat:'Drinkware',   price:6,    hasColour:false, hasSizes:false, hasName:false, colours:[] },
  { id:'stein',       name:'Beer Steins',                  cat:'Drinkware',   price:10,   hasColour:false, hasSizes:false, hasName:true,  colours:[] },
  { id:'frosted',     name:'Frosted Cups',                 cat:'Drinkware',   price:5,    hasColour:false, hasSizes:false, hasName:true,  colours:[] },
  { id:'gift-bag',    name:'Gift Bags',                    cat:'Gifting',     price:5,    hasColour:true,  hasSizes:false, hasName:false, colours:['Black','White','Clear'] },
  { id:'large-bag',   name:'Large Brown & White Bags',     cat:'Gifting',     price:7,    hasColour:true,  hasSizes:false, hasName:false, colours:['Brown','White'] },
  { id:'mag-box',     name:'Magnetic Gift Box',            cat:'Gifting',     price:12,   hasColour:true,  hasSizes:false, hasName:false, colours:['Black','White','Pink','Sage'] },
  { id:'fold-box',    name:'DIY Fold Out Box',             cat:'Gifting',     price:6,    hasColour:false, hasSizes:false, hasName:false, colours:[] },
  { id:'bm-necklace', name:'Bridesmaid Necklace',          cat:'Bridal',      price:8,    hasColour:false, hasSizes:false, hasName:true,  colours:[] },
  { id:'bm-cards',    name:'Will You Be My Cards',         cat:'Bridal',      price:1.5,  hasColour:false, hasSizes:false, hasName:true,  colours:[] },
];

const SIZES = ['XS','S','M','L','XL','XXL','Size 3','Size 4','Size 5','Size 6','Size 7','Size 8'];

let basket = {}; // id -> { product, qty, customisation:{} }

// ── RENDER PRODUCT PICKER ──
function renderPicker(filter = '') {
  const picker = document.getElementById('productPicker');
  const filtered = PRODUCTS.filter(p =>
    p.name.toLowerCase().includes(filter.toLowerCase()) ||
    p.cat.toLowerCase().includes(filter.toLowerCase())
  );

  const cats = [...new Set(filtered.map(p => p.cat))];
  picker.innerHTML = cats.map(cat => `
    <div class="picker-category" style="grid-column:1/-1">
      <p style="font-size:0.75rem;letter-spacing:0.1em;text-transform:uppercase;color:#8fa88f;font-weight:700;margin:8px 0 10px;">${cat}</p>
    </div>
    ${filtered.filter(p=>p.cat===cat).map(p => `
      <div class="picker-card ${basket[p.id] ? 'selected':''}" data-id="${p.id}">
        <div class="picker-card-check">✓</div>
        <div class="picker-card-cat">${p.cat}</div>
        <div class="picker-card-name">${p.name}</div>
        <div class="picker-card-price">£${p.price.toFixed(2)}</div>
        ${basket[p.id] ? `
        <div class="picker-card-qty">
          <button class="qty-btn" data-action="minus" data-id="${p.id}">−</button>
          <span class="qty-num">${basket[p.id].qty}</span>
          <button class="qty-btn" data-action="plus" data-id="${p.id}">+</button>
        </div>` : ''}
      </div>
    `).join('')}
  `).join('');

  // Click to add/remove
  picker.querySelectorAll('.picker-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.qty-btn')) return;
      const id = card.dataset.id;
      const product = PRODUCTS.find(p => p.id === id);
      if (basket[id]) {
        delete basket[id];
      } else {
        basket[id] = { product, qty: 1, customisation: {} };
      }
      renderPicker(document.getElementById('productSearch').value);
      renderBasket();
      renderCustomFields();
      updateRightPanel();
    });
  });

  // Qty buttons
  picker.querySelectorAll('.qty-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      if (!basket[id]) return;
      if (btn.dataset.action === 'plus') {
        basket[id].qty++;
      } else {
        basket[id].qty--;
        if (basket[id].qty <= 0) delete basket[id];
      }
      renderPicker(document.getElementById('productSearch').value);
      renderBasket();
      renderCustomFields();
      updateRightPanel();
    });
  });
}

// ── BASKET ──
function renderBasket() {
  const section = document.getElementById('basketSection');
  const itemsEl = document.getElementById('basketItems');
  const totalEl = document.getElementById('basketTotal');
  const items = Object.values(basket);

  if (items.length === 0) { section.style.display = 'none'; return; }
  section.style.display = 'block';

  let total = 0;
  itemsEl.innerHTML = items.map(({product, qty}) => {
    const lineTotal = product.price * qty;
    total += lineTotal;
    return `
      <div class="basket-item">
        <div class="basket-item-info">
          <div class="basket-item-name">${product.name}</div>
          <div class="basket-item-qty">Qty: ${qty}</div>
        </div>
        <span class="basket-item-price">£${lineTotal.toFixed(2)}</span>
        <button class="basket-remove" data-id="${product.id}" title="Remove">✕</button>
      </div>`;
  }).join('');

  totalEl.textContent = `£${total.toFixed(2)}`;

  itemsEl.querySelectorAll('.basket-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      delete basket[btn.dataset.id];
      renderPicker(document.getElementById('productSearch').value);
      renderBasket();
      renderCustomFields();
      updateRightPanel();
    });
  });
}

// ── CUSTOM FIELDS ──
function renderCustomFields() {
  const section = document.getElementById('customSection');
  const fieldsEl = document.getElementById('customFields');
  const items = Object.values(basket);

  if (items.length === 0) { section.style.display = 'none'; return; }
  section.style.display = 'block';

  fieldsEl.innerHTML = items.map(({product, qty}) => `
    <div class="custom-item-block">
      <h3>${product.name} <span style="color:#8fa88f;font-weight:400">× ${qty}</span></h3>
      ${product.hasName ? `
      <div class="custom-row">
        ${Array.from({length: Math.min(qty, 6)}, (_,i) => `
          <div class="form-group">
            <label>Name ${qty > 1 ? `#${i+1}` : ''}</label>
            <input type="text" data-id="${product.id}" data-field="name_${i}" placeholder="e.g. Sarah">
          </div>`).join('')}
      </div>` : ''}
      ${product.hasColour ? `
      <div class="form-group">
        <label>Colour</label>
        <select data-id="${product.id}" data-field="colour">
          <option value="">Select colour...</option>
          ${product.colours.map(c => `<option>${c}</option>`).join('')}
          <option>Other (specify in notes)</option>
        </select>
      </div>` : ''}
      ${product.hasSizes ? `
      <div class="custom-row">
        ${Array.from({length: Math.min(qty, 6)}, (_,i) => `
          <div class="form-group">
            <label>Size ${qty > 1 ? `#${i+1}` : ''}</label>
            <select data-id="${product.id}" data-field="size_${i}">
              <option value="">Select size...</option>
              ${SIZES.map(s => `<option>${s}</option>`).join('')}
            </select>
          </div>`).join('')}
      </div>` : ''}
      <div class="form-group custom-row full">
        <label>Special instructions for this item</label>
        <textarea data-id="${product.id}" data-field="instructions" rows="2" placeholder="Font style, exact wording, any special requests..."></textarea>
      </div>
    </div>
  `).join('');

  // Save customisation as user types
  fieldsEl.querySelectorAll('input,select,textarea').forEach(el => {
    el.addEventListener('input', () => {
      const id = el.dataset.id;
      const field = el.dataset.field;
      if (basket[id]) {
        if (!basket[id].customisation) basket[id].customisation = {};
        basket[id].customisation[field] = el.value;
      }
      updateSummaryBox();
    });
  });
}

// ── RIGHT PANEL ──
function updateRightPanel() {
  const right = document.getElementById('orderRight');
  right.style.display = Object.keys(basket).length > 0 ? 'block' : 'none';
  updateSummaryBox();
}

function updateSummaryBox() {
  const box = document.getElementById('orderSummaryBox');
  const items = Object.values(basket);
  if (items.length === 0) { box.classList.remove('visible'); return; }

  let total = 0;
  const lines = items.map(({product, qty}) => {
    const line = product.price * qty;
    total += line;
    return `<div class="summary-line"><span>${product.name} × ${qty}</span><span>£${line.toFixed(2)}</span></div>`;
  }).join('');

  box.innerHTML = `<h4>Order Summary</h4>${lines}<div class="summary-line"><span>Estimated Total</span><span>£${total.toFixed(2)}</span></div>`;
  box.classList.add('visible');
}

// ── SUBMIT ──
document.getElementById('submitOrderBtn').addEventListener('click', async () => {
  const name    = document.getElementById('custName').value.trim();
  const email   = document.getElementById('custEmail').value.trim();
  const address = document.getElementById('custAddress').value.trim();

  if (!name || !email || !address) {
    alert('Please fill in your name, email and delivery address.');
    return;
  }
  if (Object.keys(basket).length === 0) {
    alert('Please add at least one item to your basket.');
    return;
  }

  const btn = document.getElementById('submitOrderBtn');
  btn.disabled = true;
  document.getElementById('submitBtnText').style.display = 'none';
  document.getElementById('submitBtnSpinner').style.display = 'inline';

  const items = Object.values(basket).map(({product, qty, customisation}) => ({
    productId:   product.id,
    productName: product.name,
    category:    product.cat,
    unitPrice:   product.price,
    qty,
    lineTotal:   product.price * qty,
    customisation: customisation || {}
  }));

  const total = items.reduce((s, i) => s + i.lineTotal, 0);

  const orderData = {
    ref: 'MBK-' + Date.now().toString(36).toUpperCase(),
    status: 'pending',
    createdAt: serverTimestamp(),
    customer: {
      name,
      email,
      phone:   document.getElementById('custPhone').value.trim(),
      date:    document.getElementById('custDate').value,
      address,
      notes:   document.getElementById('custNotes').value.trim(),
    },
    items,
    total,
    paid: false,
    shipped: false,
    source: 'website'
  };

  try {
    await addDoc(collection(db, 'orders'), orderData);
    document.getElementById('modalRef').textContent = `Your order ref: ${orderData.ref}`;
    document.getElementById('successModal').style.display = 'flex';
    basket = {};
  } catch (err) {
    console.error(err);
    alert('Something went wrong — please try WhatsApp instead.');
    btn.disabled = false;
    document.getElementById('submitBtnText').style.display = 'inline';
    document.getElementById('submitBtnSpinner').style.display = 'none';
  }
});

// ── SEARCH ──
document.getElementById('productSearch').addEventListener('input', e => {
  renderPicker(e.target.value);
});

// ── INIT ──
renderPicker();