// dashboard/dashboard.js
import { db } from '../js/firebase.js';
import {
  getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  collection, onSnapshot, doc, updateDoc, addDoc, deleteDoc, serverTimestamp, query, orderBy
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const auth = getAuth();
let allOrders = [];
let allStock  = [];
let currentFilter = 'all';
let currentSearch = '';
let unsubOrders = null;
let unsubStock  = null;
let editingStockId = null;

// ── GREETING ──
function setGreeting(user) {
    const now = new Date();
    const h = now.getHours();
    const greeting = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
    const name = user.email.split('@')[0];
    const capitalized = name.charAt(0).toUpperCase() + name.slice(1);
    document.getElementById('greetingText').textContent = `${greeting}, ${capitalized} ✨`;
    document.getElementById('greetingDate').textContent = now.toLocaleDateString('en-GB', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
}

// ── AUTH ──
onAuthStateChanged(auth, user => {
    if (user) {
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('dashboardApp').style.display = 'block';
        setGreeting(user);
        startListening();
    } else {
        document.getElementById('loginScreen').style.display = 'flex';
        document.getElementById('dashboardApp').style.display = 'none';
        if (unsubOrders) unsubOrders();
        if (unsubStock)  unsubStock();
    }
});

document.getElementById('loginBtn').addEventListener('click', tryLogin);
document.getElementById('loginPassword').addEventListener('keydown', e => { if (e.key === 'Enter') tryLogin(); });

async function tryLogin() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const btn = document.getElementById('loginBtn');
    const errEl = document.getElementById('loginError');
    if (!email || !password) { errEl.textContent = 'Please enter your email and password.'; errEl.style.display = 'block'; return; }
    btn.disabled = true; btn.textContent = 'Signing in...'; errEl.style.display = 'none';
    try { await signInWithEmailAndPassword(auth, email, password); }
    catch(e) { errEl.textContent = 'Incorrect email or password.'; errEl.style.display = 'block'; btn.disabled = false; btn.textContent = 'Sign In'; }
}

document.getElementById('forgotBtn').addEventListener('click', async () => {
    const email = document.getElementById('loginEmail').value.trim();
    if (!email) { document.getElementById('loginError').textContent = 'Enter your email above first.'; document.getElementById('loginError').style.display = 'block'; return; }
    try { await sendPasswordResetEmail(auth, email); document.getElementById('forgotSent').style.display = 'block'; document.getElementById('loginError').style.display = 'none'; }
    catch(e) { document.getElementById('loginError').textContent = 'Could not send reset email.'; document.getElementById('loginError').style.display = 'block'; }
});

document.getElementById('logoutBtn').addEventListener('click', () => signOut(auth));

// ── NAVIGATION ──
document.querySelectorAll('.dash-nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.dash-nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.querySelectorAll('.dash-page').forEach(p => p.style.display = 'none');
        document.getElementById('page-' + btn.dataset.page).style.display = 'block';
    });
});

document.querySelectorAll('.home-card-link').forEach(btn => {
    btn.addEventListener('click', () => {
        const page = btn.dataset.page;
        document.querySelectorAll('.dash-nav-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.page === page);
        });
        document.querySelectorAll('.dash-page').forEach(p => p.style.display = 'none');
        document.getElementById('page-' + page).style.display = 'block';
    });
});

// ── LIVE LISTENERS ──
function startListening() {
    const oq = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    unsubOrders = onSnapshot(oq, snap => {
        allOrders = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        renderHome();
        renderOrders();
        renderCustomers();
        document.getElementById('ordersLoading').style.display = 'none';
    }, err => {
        console.error(err);
        document.getElementById('ordersLoading').textContent = 'Error loading orders.';
    });

    const sq = query(collection(db, 'stock'), orderBy('name'));
    unsubStock = onSnapshot(sq, snap => {
        allStock = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        renderStock();
        renderLowStockHome();
        document.getElementById('stockLoading').style.display = 'none';
    }, err => { console.error(err); });
}

// ── HOME PAGE ──
function renderHome() {
    const now = new Date();
    const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - now.getDay()); startOfWeek.setHours(0,0,0,0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let weekRev = 0, monthRev = 0, pending = 0, inProgress = 0, toShip = 0;

    allOrders.forEach(o => {
        const created = o.createdAt?.seconds ? new Date(o.createdAt.seconds * 1000) : null;
        if (o.paid) {
            if (created >= startOfWeek) weekRev += o.total || 0;
            if (created >= startOfMonth) monthRev += o.total || 0;
        }
        if (o.status === 'pending') pending++;
        if (o.status === 'in-progress') inProgress++;
        if (o.status === 'accepted' && !o.shipped) toShip++;
    });

    document.getElementById('hStatPending').textContent = pending;
    document.getElementById('hStatInProgress').textContent = inProgress;
    document.getElementById('hStatShipping').textContent = toShip;
    document.getElementById('hStatWeekRev').textContent = '£' + weekRev.toFixed(2);
    document.getElementById('hStatMonthRev').textContent = '£' + monthRev.toFixed(2);

    // Urgent — pending orders
    const urgentEl = document.getElementById('urgentOrders');
    const urgentOrders = allOrders.filter(o => o.status === 'pending').slice(0, 5);
    document.getElementById('urgentCount').textContent = urgentOrders.length || '';
    urgentEl.innerHTML = urgentOrders.length ? urgentOrders.map(o => `
        <div class="home-list-item" data-id="${o.id}">
            <div class="home-list-item-left">
                <div class="home-list-item-name">${o.customer?.name || '—'}</div>
                <div class="home-list-item-sub">${o.ref} · £${(o.total||0).toFixed(2)}</div>
            </div>
            <span class="status-badge status-pending">Pending</span>
        </div>`).join('') : '<div class="home-empty">No pending orders 🎉</div>';

    // Deadlines
    const deadlineEl = document.getElementById('upcomingDeadlines');
    const withDates = allOrders
        .filter(o => o.customer?.date && !['complete','rejected'].includes(o.status))
        .map(o => ({ ...o, eventDate: new Date(o.customer.date) }))
        .sort((a,b) => a.eventDate - b.eventDate)
        .slice(0, 6);

    deadlineEl.innerHTML = withDates.length ? withDates.map(o => {
        const days = Math.ceil((o.eventDate - now) / (1000*60*60*24));
        const cls = days <= 7 ? 'deadline-urgent' : days <= 14 ? 'deadline-soon' : '';
        const label = days < 0 ? 'Passed' : days === 0 ? 'Today!' : `${days} days`;
        return `
        <div class="home-list-item" data-id="${o.id}">
            <div class="home-list-item-left">
                <div class="home-list-item-name">${o.customer?.name || '—'}</div>
                <div class="home-list-item-sub">${o.customer.date}</div>
            </div>
            <span class="${cls}" style="font-size:0.85rem;font-weight:600">${label}</span>
        </div>`;
    }).join('') : '<div class="home-empty">No upcoming deadlines</div>';

    // Recent orders
    const recentEl = document.getElementById('recentOrders');
    recentEl.innerHTML = allOrders.slice(0, 6).map(o => {
        const date = o.createdAt?.seconds ? new Date(o.createdAt.seconds*1000).toLocaleDateString('en-GB',{day:'numeric',month:'short'}) : '—';
        return `
        <div class="home-list-item" data-id="${o.id}">
            <div class="home-list-item-left">
                <div class="home-list-item-name">${o.customer?.name || '—'}</div>
                <div class="home-list-item-sub">${o.ref} · ${date}</div>
            </div>
            <div style="display:flex;align-items:center;gap:10px">
                <span style="font-weight:700;color:#3f4a3f">£${(o.total||0).toFixed(2)}</span>
                <span class="status-badge status-${o.status||'pending'}">${formatStatus(o.status)}</span>
            </div>
        </div>`;
    }).join('');

    // Motivation
    const totalOrders = allOrders.filter(o => o.status === 'complete').length;
    const monthOrders = allOrders.filter(o => {
        const d = o.createdAt?.seconds ? new Date(o.createdAt.seconds*1000) : null;
        return d && d >= startOfMonth;
    }).length;
    document.getElementById('motivationContent').innerHTML = `
        <div class="motivation-stat">
            <div class="motivation-num">${monthOrders}</div>
            <div class="motivation-label">orders this month</div>
            <div class="motivation-sub">${totalOrders} completed all time 🎉</div>
        </div>`;

    // Click handlers on home list items
    document.querySelectorAll('.home-list-item[data-id]').forEach(item => {
        item.addEventListener('click', () => openOrder(item.dataset.id));
    });
}

function renderLowStockHome() {
    const lowEl = document.getElementById('lowStockList');
    const low = allStock.filter(s => s.qty <= s.lowAt).slice(0, 5);
    lowEl.innerHTML = low.length ? low.map(s => `
        <div class="home-list-item">
            <div class="home-list-item-left">
                <div class="home-list-item-name">${s.name}</div>
                <div class="home-list-item-sub">${s.category}</div>
            </div>
            <span style="font-size:0.85rem;font-weight:700;color:#e05a6a">${s.qty} ${s.unit||''} left</span>
        </div>`).join('') : '<div class="home-empty">All stock levels OK ✅</div>';
}

// ── ORDERS PAGE ──
document.querySelectorAll('.filter-chip').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        renderOrders();
    });
});
document.getElementById('dashSearch').addEventListener('input', e => {
    currentSearch = e.target.value.toLowerCase();
    renderOrders();
});

function renderOrders() {
    const list = document.getElementById('ordersList');
    let filtered = allOrders;
    if (currentFilter !== 'all') filtered = filtered.filter(o => o.status === currentFilter);
    if (currentSearch) filtered = filtered.filter(o =>
        (o.customer?.name||'').toLowerCase().includes(currentSearch) ||
        (o.ref||'').toLowerCase().includes(currentSearch) ||
        (o.items||[]).some(i => i.productName?.toLowerCase().includes(currentSearch))
    );
    if (!filtered.length) { list.innerHTML = '<div class="empty-state"><p>No orders found.</p></div>'; return; }
    list.innerHTML = filtered.map(o => {
        const preview = o.items ? o.items.map(i=>`${i.qty}× ${i.productName}`).join(', ') : (o.manualItems||'—');
        const date = o.createdAt?.seconds ? new Date(o.createdAt.seconds*1000).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}) : '—';
        return `
        <div class="order-row" data-id="${o.id}">
            <div class="order-ref">${o.ref||'—'}</div>
            <div class="order-customer"><strong>${o.customer?.name||'—'}</strong><span>${o.customer?.email||''}</span></div>
            <div class="order-items-preview" title="${preview}">${preview}</div>
            <div class="order-total">£${(o.total||0).toFixed(2)}</div>
            <div class="order-date">${date}</div>
            <div><span class="status-badge status-${o.status||'pending'}">${formatStatus(o.status)}</span></div>
        </div>`;
    }).join('');
    list.querySelectorAll('.order-row').forEach(row => row.addEventListener('click', () => openOrder(row.dataset.id)));
}

function formatStatus(s) {
    return {pending:'Pending',accepted:'Accepted','in-progress':'In Progress',complete:'Complete',rejected:'Rejected'}[s]||s;
}

// ── STOCK PAGE ──
function renderStock() {
    const grid = document.getElementById('stockGrid');
    if (!allStock.length) { grid.innerHTML = '<div class="empty-state"><p>No stock items yet. Add your first item!</p></div>'; return; }
    grid.innerHTML = allStock.map(s => {
        const isLow = s.qty <= s.lowAt;
        return `
        <div class="stock-card ${isLow ? 'stock-card--low' : 'stock-card--ok'}">
            <div class="stock-card-cat">${s.category||'Other'}</div>
            <div class="stock-card-name">${s.name}</div>
            ${isLow ? `<div class="stock-low-warning">⚠️ Low stock — reorder needed</div>` : ''}
            <div class="stock-qty-row">
                <button class="stock-qty-btn" data-id="${s.id}" data-action="minus">−</button>
                <span class="stock-qty-val">${s.qty}</span>
                <span class="stock-qty-unit">${s.unit||''}</span>
                <button class="stock-qty-btn" data-id="${s.id}" data-action="plus">+</button>
            </div>
            ${s.notes ? `<div class="stock-notes">${s.notes}</div>` : ''}
            <div class="stock-card-actions">
                <button class="dash-btn dash-btn--outline dash-btn--sm" data-edit="${s.id}">Edit</button>
                <button class="dash-btn dash-btn--ghost dash-btn--sm" data-delete="${s.id}">Delete</button>
            </div>
        </div>`;
    }).join('');

    // Qty buttons
    grid.querySelectorAll('.stock-qty-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.dataset.id;
            const item = allStock.find(s => s.id === id);
            if (!item) return;
            const newQty = btn.dataset.action === 'plus' ? item.qty + 1 : Math.max(0, item.qty - 1);
            await updateDoc(doc(db, 'stock', id), { qty: newQty });
        });
    });

    // Edit buttons
    grid.querySelectorAll('[data-edit]').forEach(btn => {
        btn.addEventListener('click', () => openStockModal(btn.dataset.edit));
    });

    // Delete buttons
    grid.querySelectorAll('[data-delete]').forEach(btn => {
        btn.addEventListener('click', async () => {
            if (confirm('Delete this stock item?')) await deleteDoc(doc(db, 'stock', btn.dataset.delete));
        });
    });
}

// Stock modal
document.getElementById('addStockBtn').addEventListener('click', () => openStockModal(null));

function openStockModal(id) {
    editingStockId = id;
    const item = id ? allStock.find(s => s.id === id) : null;
    document.getElementById('stockModalTitle').textContent = id ? 'Edit Stock Item' : 'Add Stock Item';
    document.getElementById('s_name').value = item?.name || '';
    document.getElementById('s_cat').value  = item?.category || 'Materials';
    document.getElementById('s_qty').value  = item?.qty ?? '';
    document.getElementById('s_low').value  = item?.lowAt ?? 5;
    document.getElementById('s_unit').value = item?.unit || '';
    document.getElementById('s_notes').value = item?.notes || '';
    document.getElementById('stockModal').style.display = 'flex';
}

document.getElementById('saveStockBtn').addEventListener('click', async () => {
    const name = document.getElementById('s_name').value.trim();
    if (!name) { alert('Please enter an item name.'); return; }
    const data = {
        name,
        category: document.getElementById('s_cat').value,
        qty:   parseInt(document.getElementById('s_qty').value) || 0,
        lowAt: parseInt(document.getElementById('s_low').value) || 5,
        unit:  document.getElementById('s_unit').value.trim(),
        notes: document.getElementById('s_notes').value.trim(),
    };
    if (editingStockId) {
        await updateDoc(doc(db, 'stock', editingStockId), data);
    } else {
        await addDoc(collection(db, 'stock'), data);
    }
    document.getElementById('stockModal').style.display = 'none';
});

document.getElementById('stockModalClose').addEventListener('click', () => document.getElementById('stockModal').style.display = 'none');
document.getElementById('cancelStockBtn').addEventListener('click', () => document.getElementById('stockModal').style.display = 'none');

// ── CUSTOMERS PAGE ──
function renderCustomers() {
    const search = document.getElementById('customerSearch')?.value.toLowerCase() || '';
    const map = {};
    allOrders.forEach(o => {
        const email = o.customer?.email || o.customer?.name || 'unknown';
        if (!map[email]) map[email] = { name: o.customer?.name, email: o.customer?.email, phone: o.customer?.phone, orders: 0, spent: 0, last: null };
        map[email].orders++;
        map[email].spent += o.total || 0;
        const d = o.createdAt?.seconds ? new Date(o.createdAt.seconds*1000) : null;
        if (d && (!map[email].last || d > map[email].last)) map[email].last = d;
    });

    let customers = Object.values(map).sort((a,b) => b.spent - a.spent);
    if (search) customers = customers.filter(c => (c.name||'').toLowerCase().includes(search) || (c.email||'').toLowerCase().includes(search));

    const list = document.getElementById('customersList');
    list.innerHTML = customers.length ? customers.map(c => `
        <div class="customer-row">
            <div>
                <div class="customer-name">${c.name||'—'}</div>
                <div class="customer-email">${c.email||c.phone||''}</div>
            </div>
            <div class="customer-orders">${c.orders} order${c.orders!==1?'s':''}</div>
            <div class="customer-spent">£${c.spent.toFixed(2)}</div>
            <div class="customer-last">${c.last ? c.last.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}) : '—'}</div>
            <div style="display:flex;gap:8px">
                ${c.email ? `<a href="mailto:${c.email}" class="dash-btn dash-btn--outline dash-btn--sm">✉️</a>` : ''}
                ${c.phone ? `<a href="https://wa.me/${c.phone.replace(/\D/g,'')}" target="_blank" class="dash-btn dash-btn--outline dash-btn--sm">💬</a>` : ''}
            </div>
        </div>`).join('') : '<div class="empty-state"><p>No customers found.</p></div>';
}

document.getElementById('customerSearch')?.addEventListener('input', renderCustomers);

// ── ORDER DETAIL MODAL ──
function openOrder(id) {
    const o = allOrders.find(x => x.id === id);
    if (!o) return;

    document.getElementById('modalOrderRef').textContent = o.ref || 'Order';
    document.getElementById('modalStatusBadge').innerHTML = `<span class="status-badge status-${o.status}">${formatStatus(o.status)}</span>`;

    const date = o.createdAt?.seconds ? new Date(o.createdAt.seconds*1000).toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'}) : '—';
    const itemsHtml = o.items ? o.items.map(item => {
        // Build clear personalisation block
        let personalisationHtml = '';

        if (item.colour) {
            personalisationHtml += `<div class="item-detail-row"><span class="item-detail-label">Colour</span><span class="item-detail-val">${item.colour}</span></div>`;
        }

        if (item.sameForAll === true || item.qty <= 1) {
            // Same for all — show shared details
            const shared = item.shared || item.customisation || {};
            const sharedLines = [
                shared.name ? `<div class="item-detail-row"><span class="item-detail-label">Name</span><span class="item-detail-val">${shared.name}</span></div>` : '',
                shared.text ? `<div class="item-detail-row"><span class="item-detail-label">Text</span><span class="item-detail-val">${shared.text}</span></div>` : '',
                shared.size ? `<div class="item-detail-row"><span class="item-detail-label">Size</span><span class="item-detail-val">${shared.size}</span></div>` : '',
            ].filter(Boolean).join('');
            if (sharedLines) {
                personalisationHtml += `
                <div class="item-same-badge">✅ Same personalisation on all ${item.qty} item${item.qty>1?'s':''}</div>
                ${sharedLines}`;
            }
        } else if (item.sameForAll === false && item.individual?.length) {
            // Individual — show each one clearly
            personalisationHtml += `<div class="item-same-badge item-same-badge--diff">✏️ Each item is different — ${item.qty} individual items</div>`;
            item.individual.forEach((ind, i) => {
                const lines = [
                    ind.name ? `<span class="ind-tag">Name: <strong>${ind.name}</strong></span>` : '',
                    ind.text ? `<span class="ind-tag">Text: <strong>${ind.text}</strong></span>` : '',
                    ind.size ? `<span class="ind-tag">Size: <strong>${ind.size}</strong></span>` : '',
                ].filter(Boolean).join('');
                if (lines) {
                    personalisationHtml += `
                    <div class="item-individual-row">
                        <span class="item-individual-num">Item ${i+1}</span>
                        <div class="item-individual-details">${lines}</div>
                    </div>`;
                }
            });
        } else {
            // Legacy orders — show old customisation tags
            const custom = item.customisation || {};
            const tags = Object.entries(custom).filter(([,v])=>v).map(([k,v])=>`<div class="item-detail-row"><span class="item-detail-label">${k.replace(/_/g,' ')}</span><span class="item-detail-val">${v}</span></div>`).join('');
            if (tags) personalisationHtml += tags;
        }

        if (item.instructions) {
            personalisationHtml += `<div class="item-detail-row item-detail-row--note"><span class="item-detail-label">Notes</span><span class="item-detail-val">${item.instructions}</span></div>`;
        }

        return `
        <div class="modal-item">
            <div class="modal-item-header">
                <div class="modal-item-name">${item.productName}</div>
                <div class="modal-item-meta">
                    <span class="modal-item-qty">× ${item.qty}</span>
                    <span class="modal-item-price">£${item.lineTotal?.toFixed(2)||'—'}</span>
                </div>
            </div>
            ${personalisationHtml ? `<div class="modal-item-personalisation">${personalisationHtml}</div>` : '<div class="modal-item-no-custom">No personalisation details</div>'}
        </div>`;
    }).join('') : `<p style="color:#888;font-size:0.9rem">${o.manualItems||'No items.'}</p>`;

    document.getElementById('modalBody').innerHTML = `
        <div class="detail-grid">
            <div class="detail-block">
                <h4>Customer</h4>
                <div class="detail-row"><span class="detail-label">Name</span><span class="detail-val">${o.customer?.name||'—'}</span></div>
                <div class="detail-row"><span class="detail-label">Email</span><span class="detail-val">${o.customer?.email||'—'}</span></div>
                <div class="detail-row"><span class="detail-label">Phone</span><span class="detail-val">${o.customer?.phone||'—'}</span></div>
                <div class="detail-row"><span class="detail-label">Event Date</span><span class="detail-val">${o.customer?.date||'—'}</span></div>
                <div class="detail-row"><span class="detail-label">Address</span><span class="detail-val">${o.customer?.address||'—'}</span></div>
            </div>
            <div class="detail-block">
                <h4>Order Info</h4>
                <div class="detail-row"><span class="detail-label">Ref</span><span class="detail-val">${o.ref||'—'}</span></div>
                <div class="detail-row"><span class="detail-label">Placed</span><span class="detail-val">${date}</span></div>
                <div class="detail-row"><span class="detail-label">Source</span><span class="detail-val">${o.source||'Website'}</span></div>
                <div class="detail-row"><span class="detail-label">Total</span><span class="detail-val" style="font-weight:700;color:#8fa88f">£${(o.total||0).toFixed(2)}</span></div>
            </div>
        </div>
        ${o.customer?.notes ? `<div style="background:#fbf9f5;border:1px solid #ede9e2;border-radius:12px;padding:14px 16px;margin-bottom:24px;font-size:0.9rem;color:#555"><strong style="color:#3f4a3f">Customer notes:</strong> ${o.customer.notes}</div>` : ''}
        <div class="modal-items"><h4>Items Ordered</h4>${itemsHtml}<div style="text-align:right;font-weight:700;color:#3f4a3f;font-size:1.05rem;margin-top:10px">Total: £${(o.total||0).toFixed(2)}</div></div>

        <!-- SHIPPING PANEL -->
        <div class="shipping-panel">
            <div class="shipping-panel-header"><h4>📦 Royal Mail Shipping</h4><span class="shipping-coming-soon">Coming Soon</span></div>
            <div class="shipping-address-box"><strong>${o.customer?.name||'—'}</strong>${(o.customer?.address||'No address').replace(/\n/g,'<br>')}</div>
            <div class="shipping-weight-row">
                <div class="shipping-field"><label>Est. Weight</label><input type="text" value="${estimateWeight(o.items)}" disabled></div>
                <div class="shipping-field"><label>Parcel Size</label><select disabled><option>${estimateSize(o.items)}</option></select></div>
                <div class="shipping-field"><label>Items</label><input type="text" value="${o.items?o.items.reduce((s,i)=>s+i.qty,0):'—'}" disabled></div>
            </div>
            <div class="shipping-services">
                <div class="shipping-service"><div class="shipping-service-name">Tracked 24</div><div class="shipping-service-desc">Next day</div><div class="shipping-service-price">~£4.49</div></div>
                <div class="shipping-service"><div class="shipping-service-name">Tracked 48</div><div class="shipping-service-desc">2-3 days</div><div class="shipping-service-price">~£3.49</div></div>
                <div class="shipping-service"><div class="shipping-service-name">1st Class</div><div class="shipping-service-desc">Standard</div><div class="shipping-service-price">~£1.35</div></div>
                <div class="shipping-service"><div class="shipping-service-name">2nd Class</div><div class="shipping-service-desc">Standard</div><div class="shipping-service-price">~£1.10</div></div>
            </div>
            <button class="btn-ship" disabled>🔒 Pay & Generate Label <span class="ship-lock">(Royal Mail API coming soon)</span></button>
        </div>

        <div style="margin-bottom:24px">
            <h4 style="font-size:0.75rem;text-transform:uppercase;letter-spacing:0.1em;color:#8fa88f;font-weight:700;margin-bottom:12px">Payment & Fulfilment</h4>
            <div class="toggle-row"><label class="toggle"><input type="checkbox" id="togglePaid" ${o.paid?'checked':''}><span class="toggle-slider"></span></label><span class="toggle-label">Payment received</span></div>
            <div class="toggle-row"><label class="toggle"><input type="checkbox" id="toggleShipped" ${o.shipped?'checked':''}><span class="toggle-slider"></span></label><span class="toggle-label">Order shipped / handed over</span></div>
        </div>
        <div style="margin-bottom:24px">
            <h4 style="font-size:0.75rem;text-transform:uppercase;letter-spacing:0.1em;color:#8fa88f;font-weight:700;margin-bottom:8px">Kelly's Notes</h4>
            <textarea class="modal-notes-input" id="kellyNotes" rows="3" placeholder="Add private notes...">${o.kellyNotes||''}</textarea>
        </div>
        <div class="modal-actions">
            <select class="status-select" id="statusSelect">
                <option value="pending"      ${o.status==='pending'     ?'selected':''}>⏳ Pending</option>
                <option value="accepted"     ${o.status==='accepted'    ?'selected':''}>✅ Accepted</option>
                <option value="in-progress"  ${o.status==='in-progress' ?'selected':''}>🔨 In Progress</option>
                <option value="complete"     ${o.status==='complete'    ?'selected':''}>🎉 Complete</option>
                <option value="rejected"     ${o.status==='rejected'    ?'selected':''}>❌ Rejected</option>
            </select>
            <button class="dash-btn dash-btn--green" id="saveOrderBtn">Save Changes</button>
            <a href="mailto:${o.customer?.email}?subject=Your Made by Kelly Order (${o.ref})" class="dash-btn dash-btn--outline">✉️ Email</a>
            <a href="https://wa.me/${(o.customer?.phone||'').replace(/\D/g,'')}?text=Hi%20${encodeURIComponent(o.customer?.name||'')}%2C%20this%20is%20Kelly%20regarding%20your%20order%20${o.ref}" target="_blank" class="dash-btn dash-btn--outline">💬 WhatsApp</a>
            <div class="order-more-wrap" style="margin-left:auto;position:relative">
                <button class="dash-btn dash-btn--ghost dash-btn--sm" id="moreOptionsBtn">⋯</button>
                <div class="order-more-menu" id="moreOptionsMenu" style="display:none">
                    <button class="more-menu-item" id="duplicateOrderBtn">📋 Duplicate Order</button>
                    <button class="more-menu-item more-menu-item--danger" id="deleteOrderBtn">🗑️ Delete Order</button>
                </div>
            </div>
        </div>

        <!-- DELETE CONFIRM -->
        <div id="deleteConfirmBox" style="display:none;margin-top:16px;background:#fff5f5;border:1.5px solid #fca5a5;border-radius:12px;padding:16px 18px">
            <p style="font-size:0.88rem;color:#991b1b;margin-bottom:10px;font-weight:600">⚠️ This will permanently delete this order. Type <strong>DELETE</strong> to confirm.</p>
            <div style="display:flex;gap:10px;align-items:center">
                <input type="text" id="deleteConfirmInput" placeholder="Type DELETE here" style="flex:1;padding:9px 14px;border:1.5px solid #fca5a5;border-radius:8px;font-size:0.9rem;font-family:'Inter',sans-serif;outline:none">
                <button class="dash-btn dash-btn--red" id="confirmDeleteBtn">Delete Order</button>
                <button class="dash-btn dash-btn--ghost" id="cancelDeleteBtn">Cancel</button>
            </div>
        </div>`;

    document.getElementById('saveOrderBtn').addEventListener('click', async () => {
        const btn = document.getElementById('saveOrderBtn');
        btn.disabled = true; btn.textContent = 'Saving...';
        try {
            await updateDoc(doc(db, 'orders', id), {
                status:     document.getElementById('statusSelect').value,
                paid:       document.getElementById('togglePaid').checked,
                shipped:    document.getElementById('toggleShipped').checked,
                kellyNotes: document.getElementById('kellyNotes').value,
            });
            document.getElementById('orderModal').style.display = 'none';
        } catch(e) { alert('Error saving.'); }
        btn.disabled = false; btn.textContent = 'Save Changes';
    });

    document.getElementById('printBtn').onclick = () => printInvoice(o);

    // ⋯ More options menu
    const moreBtn = document.getElementById('moreOptionsBtn');
    const moreMenu = document.getElementById('moreOptionsMenu');
    moreBtn.addEventListener('click', e => {
        e.stopPropagation();
        moreMenu.style.display = moreMenu.style.display === 'none' ? 'block' : 'none';
    });
    document.addEventListener('click', () => { moreMenu.style.display = 'none'; }, { once: true });

    // Duplicate order
    document.getElementById('duplicateOrderBtn').addEventListener('click', async () => {
        moreMenu.style.display = 'none';
        if (!confirm('Duplicate this order?')) return;
        try {
            const { id: _id, ref: _ref, createdAt: _ca, ...rest } = o;
            await addDoc(collection(db, 'orders'), {
                ...rest,
                ref: 'MBK-' + Date.now().toString(36).toUpperCase(),
                status: 'pending',
                createdAt: serverTimestamp(),
                paid: false,
                shipped: false,
            });
            document.getElementById('orderModal').style.display = 'none';
        } catch(e) { alert('Error duplicating order.'); }
    });

    // Delete order
    document.getElementById('deleteOrderBtn').addEventListener('click', () => {
        moreMenu.style.display = 'none';
        document.getElementById('deleteConfirmBox').style.display = 'block';
        document.getElementById('deleteConfirmInput').focus();
    });
    document.getElementById('cancelDeleteBtn').addEventListener('click', () => {
        document.getElementById('deleteConfirmBox').style.display = 'none';
        document.getElementById('deleteConfirmInput').value = '';
    });
    document.getElementById('confirmDeleteBtn').addEventListener('click', async () => {
        const val = document.getElementById('deleteConfirmInput').value.trim();
        if (val !== 'DELETE') {
            document.getElementById('deleteConfirmInput').style.borderColor = '#e05a6a';
            document.getElementById('deleteConfirmInput').placeholder = 'Must type DELETE exactly';
            return;
        }
        try {
            await deleteDoc(doc(db, 'orders', id));
            document.getElementById('orderModal').style.display = 'none';
        } catch(e) { alert('Error deleting order.'); }
    });
    document.getElementById('deleteConfirmInput').addEventListener('input', function() {
        this.style.borderColor = '#fca5a5';
    });

    document.getElementById('orderModal').style.display = 'flex';
}

document.getElementById('modalClose').addEventListener('click', () => document.getElementById('orderModal').style.display = 'none');
document.getElementById('orderModal').addEventListener('click', e => { if (e.target===document.getElementById('orderModal')) document.getElementById('orderModal').style.display='none'; });

// ── MANUAL ORDER ──
document.getElementById('addManualBtn').addEventListener('click', () => document.getElementById('manualModal').style.display='flex');
document.getElementById('addManualBtnHome').addEventListener('click', () => document.getElementById('manualModal').style.display='flex');
document.getElementById('manualClose').addEventListener('click', () => document.getElementById('manualModal').style.display='none');
document.getElementById('cancelManualBtn').addEventListener('click', () => document.getElementById('manualModal').style.display='none');
document.getElementById('saveManualBtn').addEventListener('click', async () => {
    const name = document.getElementById('m_name').value.trim();
    if (!name) { alert('Please enter a customer name.'); return; }
    const btn = document.getElementById('saveManualBtn');
    btn.disabled=true; btn.textContent='Saving...';
    try {
        await addDoc(collection(db,'orders'), {
            ref: 'MBK-'+Date.now().toString(36).toUpperCase(),
            status: 'pending', createdAt: serverTimestamp(),
            source: document.getElementById('m_source').value,
            customer: { name, email:document.getElementById('m_email').value.trim(), phone:document.getElementById('m_phone').value.trim(), date:document.getElementById('m_date').value, address:document.getElementById('m_address').value.trim(), notes:document.getElementById('m_notes').value.trim() },
            manualItems: document.getElementById('m_items').value.trim(),
            total: parseFloat(document.getElementById('m_total').value)||0,
            paid:false, shipped:false,
        });
        document.getElementById('manualModal').style.display='none';
        ['m_name','m_email','m_phone','m_date','m_address','m_items','m_total','m_notes'].forEach(id=>document.getElementById(id).value='');
    } catch(e) { alert('Error saving.'); }
    btn.disabled=false; btn.textContent='Save Order';
});
document.getElementById('manualModal').addEventListener('click', e=>{ if(e.target===document.getElementById('manualModal')) document.getElementById('manualModal').style.display='none'; });

// ── WEIGHT / SIZE ──
const PRODUCT_WEIGHTS = { 'robe':500,'lace-robe':480,'slippers':300,'socks':80,'boxers':120,'scrunchies':30,'hanky':40,'pjs':600,'apron-a':300,'apron-c':250,'memorial':50,'fans':60,'fg-basket':400,'fg-wand':200,'hanger':150,'hanger-tag':30,'claw-clip':40,'rabbit-p':350,'rabbit-g':400,'teddy':380,'noughts':120,'harmonica':80,'tambourine':300,'seat-sign':250,'flutes':400,'wine-glass':380,'pint':450,'shot':120,'flask':200,'flask-box':350,'opener':60,'tumbler':350,'plastic-cup':80,'stein':600,'frosted':200,'gift-bag':60,'large-bag':100,'mag-box':300,'fold-box':150,'bm-necklace':50,'bm-cards':20 };
function estimateWeight(items) { if(!items?.length) return '—'; const g=items.reduce((t,i)=>t+(PRODUCT_WEIGHTS[i.productId]||200)*i.qty,0); return g>=1000?`${(g/1000).toFixed(2)}kg`:`${g}g`; }
function estimateSize(items) { if(!items?.length) return 'Small Parcel'; const g=items.reduce((t,i)=>t+(PRODUCT_WEIGHTS[i.productId]||200)*i.qty,0); if(g<=100) return 'Letter'; if(g<=750) return 'Large Letter'; if(g<=2000) return 'Small Parcel'; return 'Medium Parcel'; }

// ── PRINT INVOICE ──
function printInvoice(o) {
    const date = o.createdAt?.seconds ? new Date(o.createdAt.seconds*1000).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'}) : '—';
    const sc = {pending:{bg:'#fff8e6',color:'#b45309'},accepted:{bg:'#ecfdf5',color:'#065f46'},'in-progress':{bg:'#eff6ff',color:'#1d4ed8'},complete:{bg:'#f0fdf4',color:'#166534'},rejected:{bg:'#fef2f2',color:'#991b1b'}}[o.status]||{bg:'#f3f4f6',color:'#374151'};
    const itemRows = o.items ? o.items.map((item,i)=>{
        let details = '';
        if (item.colour) details += `Colour: <strong>${item.colour}</strong> &nbsp;·&nbsp; `;
        if (item.sameForAll === true || item.qty <= 1) {
            const s = item.shared || item.customisation || {};
            if (s.name) details += `Name: <strong>${s.name}</strong> &nbsp;·&nbsp; `;
            if (s.text) details += `Text: <strong>${s.text}</strong> &nbsp;·&nbsp; `;
            if (s.size) details += `Size: <strong>${s.size}</strong> &nbsp;·&nbsp; `;
            details = details.replace(/ &nbsp;·&nbsp; $/, '');
        } else if (item.sameForAll === false && item.individual?.length) {
            details += item.individual.map((ind,i)=>{
                const parts = [ind.name?`Name: <strong>${ind.name}</strong>`:'', ind.text?`Text: <strong>${ind.text}</strong>`:'', ind.size?`Size: <strong>${ind.size}</strong>`:''].filter(Boolean).join(' · ');
                return parts ? `<div style="margin:3px 0"><span style="background:#3f4a3f;color:white;border-radius:4px;padding:1px 6px;font-size:0.75rem;margin-right:6px">Item ${i+1}</span>${parts}</div>` : '';
            }).join('');
        } else {
            const custom=item.customisation||{};
            details = Object.entries(custom).filter(([,v])=>v).map(([k,v])=>`${k.replace(/_/g,' ')}: <strong>${v}</strong>`).join(' · ');
        }
        if (item.instructions) details += `${details?'<br>':''}📝 ${item.instructions}`;
        return `<tr style="background:${i%2===0?'#fff':'#fafaf9'}"><td><div style="font-weight:600;color:#1a1a1a;margin-bottom:${details?'6px':'0'}">${item.productName}</div>${details?`<div style="font-size:0.78rem;color:#555;line-height:1.7">${details}</div>`:''}</td><td style="text-align:center;color:#555">${item.qty}</td><td style="text-align:right;color:#555">£${item.unitPrice?.toFixed(2)}</td><td style="text-align:right;font-weight:600;color:#3f4a3f">£${item.lineTotal?.toFixed(2)}</td></tr>`;
    }).join('') : `<tr><td colspan="4">${o.manualItems||'—'}</td></tr>`;

    const win=window.open('','_blank');
    win.document.write(`<!DOCTYPE html><html><head><title>Invoice ${o.ref}</title><link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet"><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Inter',sans-serif;color:#2c2c2c;background:white}.page{max-width:780px;margin:0 auto;padding:56px 56px 48px}.inv-header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:32px;margin-bottom:40px;border-bottom:1px solid #e8e2d9}.inv-brand{font-family:'Playfair Display',serif;font-size:2rem;color:#3f4a3f}.inv-brand span{color:#8fa88f}.inv-brand-sub{font-size:0.8rem;color:#aaa;margin-top:4px;font-family:'Inter',sans-serif;letter-spacing:.08em;text-transform:uppercase}.inv-meta{text-align:right}.inv-meta-title{font-family:'Playfair Display',serif;font-size:2.2rem;color:#3f4a3f;margin-bottom:12px;line-height:1}.inv-meta-row{font-size:.88rem;color:#666;margin-bottom:4px}.status-pill{display:inline-block;padding:4px 14px;border-radius:50px;font-size:.78rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;background:${sc.bg};color:${sc.color};margin-top:6px}.accent-bar{height:4px;background:linear-gradient(to right,#3f4a3f,#8fa88f,#c9d8c9);border-radius:2px;margin-bottom:40px}.two-col{display:grid;grid-template-columns:1fr 1fr;gap:48px;margin-bottom:40px}.info-block-label{font-size:.7rem;text-transform:uppercase;letter-spacing:.14em;color:#8fa88f;font-weight:700;margin-bottom:12px}.info-block-name{font-size:1.05rem;font-weight:700;color:#1a1a1a;margin-bottom:4px}.info-block-line{font-size:.88rem;color:#666;line-height:1.8}.info-pill{display:inline-flex;align-items:center;gap:5px;background:#f3f4f6;border-radius:6px;padding:3px 10px;font-size:.8rem;color:#444;margin:3px 3px 0 0}.info-pill.green{background:#ecfdf5;color:#065f46}.info-pill.amber{background:#fffbeb;color:#92400e}.items-label{font-size:.7rem;text-transform:uppercase;letter-spacing:.14em;color:#8fa88f;font-weight:700;margin-bottom:14px}table{width:100%;border-collapse:collapse}thead tr{background:#3f4a3f}thead th{color:white;font-size:.75rem;font-weight:600;letter-spacing:.06em;text-transform:uppercase;padding:12px 16px;text-align:left}thead th:nth-child(2){text-align:center}thead th:nth-child(3),thead th:nth-child(4){text-align:right}tbody td{padding:14px 16px;font-size:.9rem;vertical-align:top;border-bottom:1px solid #f0ece5}tbody td:nth-child(2){text-align:center}tbody td:nth-child(3){text-align:right}tbody td:nth-child(4){text-align:right;font-weight:600;color:#3f4a3f}.total-section{display:flex;justify-content:flex-end;margin-top:20px}.total-box{background:#3f4a3f;color:white;border-radius:14px;padding:18px 28px;display:flex;align-items:center;gap:32px;min-width:260px;justify-content:space-between}.total-box-label{font-size:.82rem;opacity:.8;text-transform:uppercase;letter-spacing:.08em}.total-box-amount{font-family:'Playfair Display',serif;font-size:1.8rem;font-weight:700}.notes-section{background:#fbf9f5;border-left:3px solid #8fa88f;border-radius:0 10px 10px 0;padding:14px 18px;margin-bottom:16px;font-size:.88rem;color:#555;line-height:1.7}.notes-section strong{color:#3f4a3f;display:block;margin-bottom:4px;font-size:.75rem;text-transform:uppercase;letter-spacing:.08em}.inv-footer{margin-top:48px;padding-top:24px;border-top:1px solid #e8e2d9;display:flex;justify-content:space-between;align-items:center}.inv-footer-brand{font-family:'Playfair Display',serif;font-size:1rem;color:#3f4a3f}.inv-footer-brand span{color:#8fa88f}.inv-footer-text{font-size:.78rem;color:#bbb}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}.page{padding:32px 40px}}</style></head><body><div class="page"><div class="inv-header"><div><div class="inv-brand">Made by <span>Kelly</span></div><div class="inv-brand-sub">madebykelly.uk · UK Handcrafted Gifts</div></div><div class="inv-meta"><div class="inv-meta-title">Invoice</div><div class="inv-meta-row">Ref: <strong>${o.ref}</strong></div><div class="inv-meta-row">Date: <strong>${date}</strong></div><div><span class="status-pill">${formatStatus(o.status)}</span></div></div></div><div class="accent-bar"></div><div class="two-col"><div><div class="info-block-label">Bill To</div><div class="info-block-name">${o.customer?.name||'—'}</div><div class="info-block-line">${o.customer?.email?`${o.customer.email}<br>`:''} ${o.customer?.phone?`${o.customer.phone}<br>`:''} ${(o.customer?.address||'').replace(/\n/g,'<br>')}</div></div><div><div class="info-block-label">Order Details</div>${o.customer?.date?`<div class="info-block-line" style="margin-bottom:10px">🗓️ Event: <strong>${o.customer.date}</strong></div>`:''}<div style="margin-bottom:6px"><span class="info-pill ${o.paid?'green':'amber'}">${o.paid?'✓ Payment received':'⏳ Payment pending'}</span></div><div><span class="info-pill ${o.shipped?'green':'amber'}">${o.shipped?'✓ Shipped':'⏳ Not yet shipped'}</span></div></div></div><div class="items-section"><div class="items-label">Items Ordered</div><table><thead><tr><th>Item & Personalisation</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead><tbody>${itemRows}</tbody></table><div class="total-section"><div class="total-box"><span class="total-box-label">Order Total</span><span class="total-box-amount">£${(o.total||0).toFixed(2)}</span></div></div></div>${o.customer?.notes?`<div class="notes-section"><strong>Customer Notes</strong>${o.customer.notes}</div>`:''} ${o.kellyNotes?`<div class="notes-section"><strong>Internal Notes</strong>${o.kellyNotes}</div>`:''}<div class="inv-footer"><div class="inv-footer-brand">Made by <span>Kelly</span></div><div class="inv-footer-text">Handcrafted with love in the UK · madebykelly.uk</div></div></div><script>window.onload=()=>{window.print()}<\/script></body></html>`);
    win.document.close();
}