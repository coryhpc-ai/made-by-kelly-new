// js/dashboard.js
import { db } from '../js/firebase.js';
import {
  collection, onSnapshot, doc, updateDoc, addDoc, serverTimestamp, query, orderBy
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const DASHBOARD_PASSWORD = 'kelly2024';

let allOrders = [];
let currentFilter = 'all';
let currentSearch = '';
let unsubscribe = null;

// ── LOGIN ──
document.getElementById('loginBtn').addEventListener('click', tryLogin);
document.getElementById('loginPassword').addEventListener('keydown', e => { if (e.key === 'Enter') tryLogin(); });

function tryLogin() {
    const pwd = document.getElementById('loginPassword').value;
    if (pwd === DASHBOARD_PASSWORD) {
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('dashboardApp').style.display = 'block';
        startListening();
    } else {
        document.getElementById('loginError').style.display = 'block';
        document.getElementById('loginPassword').value = '';
        document.getElementById('loginPassword').focus();
    }
}

document.getElementById('logoutBtn').addEventListener('click', () => {
    if (unsubscribe) unsubscribe();
    document.getElementById('dashboardApp').style.display = 'none';
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('loginPassword').value = '';
});

// ── LIVE LISTENER ──
function startListening() {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    unsubscribe = onSnapshot(q, snap => {
        allOrders = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        renderStats();
        renderOrders();
        document.getElementById('ordersLoading').style.display = 'none';
    }, err => {
        console.error(err);
        document.getElementById('ordersLoading').textContent = 'Error loading orders. Check Firestore rules.';
    });
}

// ── STATS ──
function renderStats() {
    const counts = { pending:0, accepted:0, 'in-progress':0, complete:0 };
    let revenue = 0;
    allOrders.forEach(o => {
        if (counts[o.status] !== undefined) counts[o.status]++;
        if (o.status === 'complete' || o.paid) revenue += (o.total || 0);
    });
    document.getElementById('statPending').textContent    = counts.pending;
    document.getElementById('statAccepted').textContent   = counts.accepted;
    document.getElementById('statInProgress').textContent = counts['in-progress'];
    document.getElementById('statDone').textContent       = counts.complete;
    document.getElementById('statRevenue').textContent    = '£' + revenue.toFixed(2);
}

// ── FILTER + SEARCH ──
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

// ── RENDER ORDERS ──
function renderOrders() {
    const list = document.getElementById('ordersList');
    let filtered = allOrders;

    if (currentFilter !== 'all') filtered = filtered.filter(o => o.status === currentFilter);
    if (currentSearch) {
        filtered = filtered.filter(o =>
            (o.customer?.name || '').toLowerCase().includes(currentSearch) ||
            (o.ref || '').toLowerCase().includes(currentSearch) ||
            (o.items || []).some(i => i.productName?.toLowerCase().includes(currentSearch))
        );
    }

    if (filtered.length === 0) {
        list.innerHTML = '<div class="empty-state"><p>No orders found.</p></div>';
        return;
    }

    list.innerHTML = filtered.map(o => {
        const itemPreview = o.items
            ? o.items.map(i => `${i.qty}× ${i.productName}`).join(', ')
            : (o.manualItems || '—');
        const date = o.createdAt?.seconds
            ? new Date(o.createdAt.seconds * 1000).toLocaleDateString('en-GB', {day:'numeric',month:'short',year:'numeric'})
            : '—';
        return `
        <div class="order-row" data-id="${o.id}">
            <div class="order-ref">${o.ref || '—'}</div>
            <div class="order-customer">
                <strong>${o.customer?.name || '—'}</strong>
                <span>${o.customer?.email || ''}</span>
            </div>
            <div class="order-items-preview" title="${itemPreview}">${itemPreview}</div>
            <div class="order-total">£${(o.total || 0).toFixed(2)}</div>
            <div class="order-date">${date}</div>
            <div><span class="status-badge status-${o.status || 'pending'}">${formatStatus(o.status)}</span></div>
        </div>`;
    }).join('');

    list.querySelectorAll('.order-row').forEach(row => {
        row.addEventListener('click', () => openOrder(row.dataset.id));
    });
}

function formatStatus(s) {
    return { pending:'Pending', accepted:'Accepted', 'in-progress':'In Progress', complete:'Complete', rejected:'Rejected' }[s] || s;
}

// ── ORDER DETAIL MODAL ──
function openOrder(id) {
    const o = allOrders.find(x => x.id === id);
    if (!o) return;

    document.getElementById('modalOrderRef').textContent = o.ref || 'Order';
    document.getElementById('modalStatusBadge').innerHTML =
        `<span class="status-badge status-${o.status}">${formatStatus(o.status)}</span>`;

    const date = o.createdAt?.seconds
        ? new Date(o.createdAt.seconds * 1000).toLocaleDateString('en-GB', {weekday:'long',day:'numeric',month:'long',year:'numeric'})
        : '—';

    const itemsHtml = o.items ? o.items.map(item => {
        const custom = item.customisation || {};
        const tags = Object.entries(custom)
            .filter(([,v]) => v)
            .map(([k,v]) => `<span class="modal-item-tag">${k.replace(/_/g,' ')}: ${v}</span>`)
            .join('');
        return `
            <div class="modal-item">
                <div class="modal-item-name">
                    ${item.productName} <span style="color:#8fa88f">× ${item.qty}</span>
                    <span class="modal-item-price">£${item.lineTotal?.toFixed(2) || '—'}</span>
                </div>
                ${tags ? `<div class="modal-item-details">${tags}</div>` : ''}
            </div>`;
    }).join('') : `<p style="color:#888;font-size:0.9rem">${o.manualItems || 'No items recorded.'}</p>`;

    document.getElementById('modalBody').innerHTML = `
        <div class="detail-grid">
            <div class="detail-block">
                <h4>Customer</h4>
                <div class="detail-row"><span class="detail-label">Name</span><span class="detail-val">${o.customer?.name || '—'}</span></div>
                <div class="detail-row"><span class="detail-label">Email</span><span class="detail-val">${o.customer?.email || '—'}</span></div>
                <div class="detail-row"><span class="detail-label">Phone</span><span class="detail-val">${o.customer?.phone || '—'}</span></div>
                <div class="detail-row"><span class="detail-label">Event Date</span><span class="detail-val">${o.customer?.date || '—'}</span></div>
            </div>
            <div class="detail-block">
                <h4>Order Info</h4>
                <div class="detail-row"><span class="detail-label">Placed</span><span class="detail-val">${date}</span></div>
                <div class="detail-row"><span class="detail-label">Source</span><span class="detail-val">${o.source || 'Website'}</span></div>
                <div class="detail-row"><span class="detail-label">Total</span><span class="detail-val" style="font-weight:700;color:#8fa88f">£${(o.total||0).toFixed(2)}</span></div>
                <div class="detail-row"><span class="detail-label">Address</span><span class="detail-val">${o.customer?.address || '—'}</span></div>
            </div>
        </div>

        ${o.customer?.notes ? `<div style="background:#fbf9f5;border:1px solid #ede9e2;border-radius:12px;padding:14px 16px;margin-bottom:24px;font-size:0.9rem;color:#555"><strong style="color:#3f4a3f">Customer notes:</strong> ${o.customer.notes}</div>` : ''}

        <div class="modal-items">
            <h4>Items Ordered</h4>
            ${itemsHtml}
            <div style="text-align:right;font-weight:700;color:#3f4a3f;font-size:1.05rem;margin-top:10px">Total: £${(o.total||0).toFixed(2)}</div>
        </div>

        <div style="margin-bottom:24px">
            <h4 style="font-size:0.75rem;text-transform:uppercase;letter-spacing:0.1em;color:#8fa88f;font-weight:700;margin-bottom:12px">Payment & Fulfilment</h4>
            <div class="toggle-row">
                <label class="toggle"><input type="checkbox" id="togglePaid" ${o.paid ? 'checked':''}><span class="toggle-slider"></span></label>
                <span class="toggle-label">Payment received</span>
            </div>
            <div class="toggle-row">
                <label class="toggle"><input type="checkbox" id="toggleShipped" ${o.shipped ? 'checked':''}><span class="toggle-slider"></span></label>
                <span class="toggle-label">Order shipped / handed over</span>
            </div>
        </div>

        <div style="margin-bottom:24px">
            <h4 style="font-size:0.75rem;text-transform:uppercase;letter-spacing:0.1em;color:#8fa88f;font-weight:700;margin-bottom:8px">Kelly's Notes</h4>
            <textarea class="modal-notes-input" id="kellyNotes" rows="3" placeholder="Add private notes about this order...">${o.kellyNotes || ''}</textarea>
        </div>

        <div class="modal-actions">
            <select class="status-select" id="statusSelect">
                <option value="pending"     ${o.status==='pending'     ?'selected':''}>⏳ Pending</option>
                <option value="accepted"    ${o.status==='accepted'    ?'selected':''}>✅ Accepted</option>
                <option value="in-progress" ${o.status==='in-progress' ?'selected':''}>🔨 In Progress</option>
                <option value="complete"    ${o.status==='complete'    ?'selected':''}>🎉 Complete</option>
                <option value="rejected"    ${o.status==='rejected'    ?'selected':''}>❌ Rejected</option>
            </select>
            <button class="dash-btn dash-btn--green" id="saveOrderBtn">Save Changes</button>
            <a href="mailto:${o.customer?.email}?subject=Your Made by Kelly Order (${o.ref})" class="dash-btn dash-btn--outline">Email Customer</a>
            <a href="https://wa.me/${(o.customer?.phone||'').replace(/\D/g,'')}?text=Hi%20${encodeURIComponent(o.customer?.name||'')}%2C%20this%20is%20Kelly%20regarding%20your%20order%20${o.ref}" target="_blank" class="dash-btn dash-btn--outline">WhatsApp</a>
        </div>
    `;

    document.getElementById('saveOrderBtn').addEventListener('click', async () => {
        const btn = document.getElementById('saveOrderBtn');
        btn.disabled = true;
        btn.textContent = 'Saving...';
        try {
            await updateDoc(doc(db, 'orders', id), {
                status:      document.getElementById('statusSelect').value,
                paid:        document.getElementById('togglePaid').checked,
                shipped:     document.getElementById('toggleShipped').checked,
                kellyNotes:  document.getElementById('kellyNotes').value,
            });
            document.getElementById('orderModal').style.display = 'none';
        } catch(e) {
            console.error(e);
            alert('Error saving. Check console.');
        }
        btn.disabled = false;
        btn.textContent = 'Save Changes';
    });

    document.getElementById('orderModal').style.display = 'flex';
}

document.getElementById('modalClose').addEventListener('click', () => {
    document.getElementById('orderModal').style.display = 'none';
});
document.getElementById('orderModal').addEventListener('click', e => {
    if (e.target === document.getElementById('orderModal'))
        document.getElementById('orderModal').style.display = 'none';
});

// ── MANUAL ORDER ──
document.getElementById('addManualBtn').addEventListener('click', () => {
    document.getElementById('manualModal').style.display = 'flex';
});
document.getElementById('manualClose').addEventListener('click', () => {
    document.getElementById('manualModal').style.display = 'none';
});
document.getElementById('cancelManualBtn').addEventListener('click', () => {
    document.getElementById('manualModal').style.display = 'none';
});
document.getElementById('saveManualBtn').addEventListener('click', async () => {
    const name = document.getElementById('m_name').value.trim();
    if (!name) { alert('Please enter a customer name.'); return; }
    const btn = document.getElementById('saveManualBtn');
    btn.disabled = true;
    btn.textContent = 'Saving...';
    try {
        await addDoc(collection(db, 'orders'), {
            ref: 'MBK-' + Date.now().toString(36).toUpperCase(),
            status: 'pending',
            createdAt: serverTimestamp(),
            source: document.getElementById('m_source').value,
            customer: {
                name,
                email:   document.getElementById('m_email').value.trim(),
                phone:   document.getElementById('m_phone').value.trim(),
                date:    document.getElementById('m_date').value,
                address: document.getElementById('m_address').value.trim(),
                notes:   document.getElementById('m_notes').value.trim(),
            },
            manualItems: document.getElementById('m_items').value.trim(),
            total: parseFloat(document.getElementById('m_total').value) || 0,
            paid: false,
            shipped: false,
        });
        document.getElementById('manualModal').style.display = 'none';
        ['m_name','m_email','m_phone','m_date','m_address','m_items','m_total','m_notes'].forEach(id => {
            document.getElementById(id).value = '';
        });
    } catch(e) {
        console.error(e);
        alert('Error saving order.');
    }
    btn.disabled = false;
    btn.textContent = 'Save Order';
});
document.getElementById('manualModal').addEventListener('click', e => {
    if (e.target === document.getElementById('manualModal'))
        document.getElementById('manualModal').style.display = 'none';
});