/* Chanchala Golden Crust: menu, cart, checkout and local order manager */
document.addEventListener('DOMContentLoaded', function () {
  const whatsappNumber = '919973052333';
  const upiId = 'chanchalagoldencrust@ptyes';
  const remoteClient = window.CGC_SUPABASE_URL && window.CGC_SUPABASE_ANON_KEY && window.supabase ? window.supabase.createClient(window.CGC_SUPABASE_URL, window.CGC_SUPABASE_ANON_KEY) : null;
  const catalog = [
    ['Bread', 40], ['Cakes', 500], ['Puffs', 30], ['Cookies', 120], ['Buns & Rolls', 35],
    ['Snacks', 80], ['Rusk', 90], ['Muffins', 50], ['Biscuits', 100]
  ];
  let cart = JSON.parse(localStorage.getItem('cgc-cart') || '[]');
  let orders = JSON.parse(localStorage.getItem('cgc-orders') || '[]');

  const $ = function (selector) { return document.querySelector(selector); };
  const format = function (amount) { return '₹' + amount.toLocaleString('en-IN'); };
  const escapeHtml = function (value) { return String(value).replace(/[&<>'"]/g, function (char) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]; }); };
  const saveCart = function () { localStorage.setItem('cgc-cart', JSON.stringify(cart)); };
  const saveOrders = function () { localStorage.setItem('cgc-orders', JSON.stringify(orders)); };

  // Turn the existing product showcase into a usable menu without changing product photos.
  document.querySelectorAll('.product-card').forEach(function (card, index) {
    const item = catalog[index];
    if (!item) return;
    const oldText = card.querySelector('p');
    oldText.insertAdjacentHTML('afterend', '<div class="product-buy"><span>Starting at <strong>' + format(item[1]) + '</strong></span><button type="button" class="add-to-cart" data-name="' + item[0] + '" data-price="' + item[1] + '">Add <i class="fa-solid fa-plus"></i></button></div>');
  });

  function updateCounts() {
    const count = cart.reduce(function (sum, item) { return sum + item.qty; }, 0);
    document.querySelectorAll('.cart-count').forEach(function (el) { el.textContent = count; });
  }

  function cartTotal() { return cart.reduce(function (sum, item) { return sum + item.price * item.qty; }, 0); }

  function renderCart() {
    const target = $('#cart-items');
    const total = cartTotal();
    if (!cart.length) {
      target.innerHTML = '<div class="empty-cart"><i class="fa-solid fa-basket-shopping"></i><p>Aapka cart abhi khali hai.</p><small>Products section se apne favourites add karein.</small></div>';
    } else {
      target.innerHTML = cart.map(function (item) {
        return '<div class="cart-line"><div><strong>' + escapeHtml(item.name) + '</strong><span>' + format(item.price) + ' each</span></div><div class="quantity"><button type="button" data-cart-action="minus" data-name="' + escapeHtml(item.name) + '" aria-label="Remove one">−</button><b>' + item.qty + '</b><button type="button" data-cart-action="plus" data-name="' + escapeHtml(item.name) + '" aria-label="Add one">+</button></div><strong>' + format(item.price * item.qty) + '</strong></div>';
      }).join('');
    }
    $('#cart-total').textContent = format(total);
    $('#checkout-upi-link').href = 'upi://pay?pa=' + encodeURIComponent(upiId) + '&pn=Chanchala%20Golden%20Crust&am=' + total + '&cu=INR&tn=Website%20Order';
    updateCounts();
  }

  async function openCart() {
    if (remoteClient) {
      const session = await remoteClient.auth.getUser();
      if (!session.data.user) { openAuth(); $('#auth-note').textContent = 'Order karne se pehle login ya account create karein.'; return; }
    }
    $('#order-modal').classList.add('is-open'); $('#order-modal').setAttribute('aria-hidden', 'false'); document.body.classList.add('modal-open'); renderCart();
  }
  function closeCart() { $('#order-modal').classList.remove('is-open'); $('#order-modal').setAttribute('aria-hidden', 'true'); document.body.classList.remove('modal-open'); }

  function renderOrders() {
    const target = $('#owner-orders');
    if (!orders.length) { target.innerHTML = '<p class="empty-orders">Abhi is browser mein koi order nahi hai.</p>'; return; }
    target.innerHTML = orders.slice().reverse().map(function (order) {
      const items = order.items.map(function (item) { return escapeHtml(item.name) + ' × ' + item.qty; }).join(', ');
      return '<article class="order-card"><div class="order-card-top"><div><span class="order-id">' + escapeHtml(order.id) + '</span><h3>' + escapeHtml(order.name) + '</h3><p>' + escapeHtml(order.phone) + ' · ' + escapeHtml(order.type) + '</p></div><strong>' + format(order.total) + '</strong></div><p class="order-items">' + items + '</p><p class="order-meta">' + escapeHtml(order.payment) + (order.transaction ? ' · Txn: ' + escapeHtml(order.transaction) : '') + ' · ' + escapeHtml(order.created) + '</p><label class="status-label">Status <select data-order-id="' + escapeHtml(order.id) + '" class="order-status"><option' + (order.status === 'New' ? ' selected' : '') + '>New</option><option' + (order.status === 'Confirmed' ? ' selected' : '') + '>Confirmed</option><option' + (order.status === 'Preparing' ? ' selected' : '') + '>Preparing</option><option' + (order.status === 'Ready' ? ' selected' : '') + '>Ready</option><option' + (order.status === 'Completed' ? ' selected' : '') + '>Completed</option></select></label></article>';
    }).join('');
  }

  async function syncRemoteData() {
    if (!remoteClient) return;
    const userResult = await remoteClient.auth.getUser();
    if (!userResult.data.user) return;
    const remoteOrders = await remoteClient.from('orders').select('id, customer_name, customer_phone, order_type, payment_method, transaction_id, total, status, created_at, order_items(product_name, price, quantity)').order('created_at', { ascending: false });
    if (!remoteOrders.error && remoteOrders.data) {
      orders = remoteOrders.data.map(function (item) { return { id: item.id, name: item.customer_name, phone: item.customer_phone, type: item.order_type, payment: item.payment_method, transaction: item.transaction_id, total: Number(item.total), status: item.status, created: new Date(item.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }), items: (item.order_items || []).map(function (line) { return { name: line.product_name, price: Number(line.price), qty: line.quantity }; }) }; });
      saveOrders(); renderOrders();
    }
    const remoteCustomers = await remoteClient.from('profiles').select('full_name, phone, created_at').order('created_at', { ascending: false });
    if (!remoteCustomers.error && remoteCustomers.data && remoteCustomers.data.length) {
      $('#registered-customers').innerHTML = remoteCustomers.data.map(function (customer) { return '<article class="customer-card"><h3>' + escapeHtml(customer.full_name) + '</h3><p>' + escapeHtml(customer.phone) + '</p><small>Registered: ' + escapeHtml(new Date(customer.created_at).toLocaleString('en-IN')) + '</small></article>'; }).join('');
    }
  }

  document.addEventListener('click', function (event) {
    const add = event.target.closest('.add-to-cart');
    if (add) {
      const found = cart.find(function (item) { return item.name === add.dataset.name; });
      if (found) found.qty += 1; else cart.push({ name: add.dataset.name, price: Number(add.dataset.price), qty: 1 });
      saveCart(); updateCounts(); add.innerHTML = 'Added <i class="fa-solid fa-check"></i>'; setTimeout(function () { add.innerHTML = 'Add <i class="fa-solid fa-plus"></i>'; }, 1000); return;
    }
    const action = event.target.closest('[data-cart-action]');
    if (action) {
      const item = cart.find(function (entry) { return entry.name === action.dataset.name; });
      if (action.dataset.cartAction === 'plus') item.qty += 1;
      if (action.dataset.cartAction === 'minus') { item.qty -= 1; if (item.qty === 0) cart = cart.filter(function (entry) { return entry !== item; }); }
      saveCart(); renderCart(); return;
    }
    if (event.target.closest('.open-cart')) openCart();
    if (event.target.closest('.close-cart') || event.target === $('#order-modal')) closeCart();
  });

  $('#order-type').addEventListener('change', function () { $('#address-field').hidden = this.value !== 'Delivery'; $('#order-address').required = this.value === 'Delivery'; });
  document.querySelectorAll('input[name="payment"]').forEach(function (input) { input.addEventListener('change', function () { $('#upi-checkout').hidden = this.value !== 'UPI'; }); });
  $('#checkout-form').addEventListener('submit', async function (event) {
    event.preventDefault();
    const note = $('#checkout-note');
    if (!cart.length) { note.textContent = 'Order bhejne se pehle cart mein product add karein.'; return; }
    const payment = document.querySelector('input[name="payment"]:checked').value;
    const transaction = $('#transaction-id').value.trim();
    if (payment === 'UPI' && !transaction) { note.textContent = 'UPI payment ke baad transaction ID bharein.'; return; }
    const order = { id: 'CGC-' + Date.now().toString().slice(-6), name: $('#order-name').value.trim(), phone: $('#order-phone').value.trim(), type: $('#order-type').value, address: $('#order-address').value.trim(), note: $('#order-note').value.trim(), payment: payment, transaction: transaction, items: cart, total: cartTotal(), status: 'New', created: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) };
    if (remoteClient) {
      const session = await remoteClient.auth.getUser();
      if (session.data.user) {
        const saved = await remoteClient.from('orders').insert({ customer_id: session.data.user.id, customer_name: order.name, customer_phone: order.phone, order_type: order.type, address: order.address, note: order.note, payment_method: order.payment, transaction_id: order.transaction, total: order.total }).select('id').single();
        if (!saved.error && saved.data) { order.id = saved.data.id; await remoteClient.from('order_items').insert(order.items.map(function (item) { return { order_id: saved.data.id, product_name: item.name, price: item.price, quantity: item.qty }; })); }
      }
    }
    orders.push(order); saveOrders(); renderOrders();
    const itemText = order.items.map(function (item) { return item.name + ' x ' + item.qty + ' = ' + format(item.price * item.qty); }).join('\n');
    const message = 'NEW WEBSITE ORDER: ' + order.id + '\n\nCustomer: ' + order.name + '\nPhone: ' + order.phone + '\nType: ' + order.type + (order.address ? '\nAddress: ' + order.address : '') + '\n\nItems:\n' + itemText + '\n\nTotal: ' + format(order.total) + '\nPayment: ' + order.payment + (order.transaction ? '\nTransaction ID: ' + order.transaction : '') + (order.note ? '\nNote: ' + order.note : '') + '\n\nPlease confirm this order.';
    note.textContent = 'Order ' + order.id + ' ready hai. WhatsApp khul raha hai…';
    window.open('https://wa.me/' + whatsappNumber + '?text=' + encodeURIComponent(message), '_blank', 'noopener');
    cart = []; saveCart(); renderCart(); $('#checkout-form').reset(); setTimeout(closeCart, 1200);
  });

  $('#owner-orders').addEventListener('change', async function (event) { if (!event.target.matches('.order-status')) return; const order = orders.find(function (entry) { return entry.id === event.target.dataset.orderId; }); order.status = event.target.value; saveOrders(); if (remoteClient) await remoteClient.from('orders').update({ status: order.status }).eq('id', order.id); });
  $('#clear-orders').addEventListener('click', function () { if (orders.length && window.confirm('Is device ke saare saved orders delete karne hain?')) { orders = []; saveOrders(); renderOrders(); } });

  // General enquiry form still goes straight to the business WhatsApp.
  $('#contact-form').addEventListener('submit', function (event) {
    event.preventDefault();
    const name = $('#name').value.trim(); const phone = $('#phone').value.trim(); const message = $('#message').value.trim();
    if (!name || !phone || !message) { $('#form-note').textContent = 'Kripya sabhi fields bharen.'; return; }
    $('#form-note').textContent = 'WhatsApp khul raha hai…';
    window.open('https://wa.me/' + whatsappNumber + '?text=' + encodeURIComponent('Website enquiry\\nName: ' + name + '\\nPhone: ' + phone + '\\nMessage: ' + message), '_blank', 'noopener');
    this.reset();
  });

  let customers = JSON.parse(localStorage.getItem('cgc-customers') || '[]');
  let activeCustomer = JSON.parse(localStorage.getItem('cgc-active-customer') || 'null');
  const saveCustomers = function () { localStorage.setItem('cgc-customers', JSON.stringify(customers)); };
  async function hashPassword(password) { const bytes = new TextEncoder().encode(password); const digest = await crypto.subtle.digest('SHA-256', bytes); return Array.from(new Uint8Array(digest)).map(function (byte) { return byte.toString(16).padStart(2, '0'); }).join(''); }
  function renderCustomers() { const target = $('#registered-customers'); if (!customers.length) { target.innerHTML = '<p class="empty-orders">Abhi koi customer registered nahi hai.</p>'; return; } target.innerHTML = customers.slice().reverse().map(function (customer) { return '<article class="customer-card"><h3>' + escapeHtml(customer.name) + '</h3><p>' + escapeHtml(customer.email) + ' · ' + escapeHtml(customer.phone) + '</p><small>Registered: ' + escapeHtml(customer.created) + '</small></article>'; }).join(''); }
  function setActive(customer) { activeCustomer = customer; if (customer) localStorage.setItem('cgc-active-customer', JSON.stringify(customer)); else localStorage.removeItem('cgc-active-customer'); $('#account-label').textContent = customer ? customer.name.split(' ')[0] : 'Login'; }
  function openAuth() { $('#auth-modal').classList.add('is-open'); $('#auth-modal').setAttribute('aria-hidden', 'false'); document.body.classList.add('modal-open'); }
  function closeAuth() { $('#auth-modal').classList.remove('is-open'); $('#auth-modal').setAttribute('aria-hidden', 'true'); document.body.classList.remove('modal-open'); }
  $('#account-button').addEventListener('click', openAuth); $('.close-auth').addEventListener('click', closeAuth); $('#auth-modal').addEventListener('click', function (event) { if (event.target === this) closeAuth(); });
  document.querySelectorAll('.auth-tab').forEach(function (button) { button.addEventListener('click', function () { const signup = button.dataset.authView === 'signup'; document.querySelectorAll('.auth-tab').forEach(function (item) { item.classList.toggle('active', item === button); }); $('#login-form').hidden = signup; $('#signup-form').hidden = !signup; $('#auth-note').textContent = ''; }); });
  $('#signup-form').addEventListener('submit', async function (event) { event.preventDefault(); const customer = { name: $('#signup-name').value.trim(), email: $('#signup-email').value.trim().toLowerCase(), phone: $('#signup-phone').value.trim(), passwordHash: await hashPassword($('#signup-password').value), created: new Date().toLocaleString('en-IN') }; if (remoteClient) { const result = await remoteClient.auth.signUp({ email: customer.email, password: $('#signup-password').value }); if (result.error) { $('#auth-note').textContent = result.error.message; return; } const user = result.data.user; if (user) await remoteClient.from('profiles').insert({ id: user.id, full_name: customer.name, phone: customer.phone }); } else { if (customers.some(function (item) { return item.email === customer.email; })) { $('#auth-note').textContent = 'Is email se account pehle se bana hua hai. Login karein.'; return; } customers.push(customer); saveCustomers(); } setActive(customer); renderCustomers(); $('#auth-note').textContent = remoteClient ? 'Account create ho gaya. Email verify karke login karein.' : 'Account create ho gaya. Ab aap order kar sakte hain.'; setTimeout(closeAuth, 1000); });
  $('#login-form').addEventListener('submit', async function (event) { event.preventDefault(); const email = $('#login-email').value.trim().toLowerCase(); let found; if (remoteClient) { const result = await remoteClient.auth.signInWithPassword({ email: email, password: $('#login-password').value }); if (result.error) { $('#auth-note').textContent = result.error.message; return; } const profile = await remoteClient.from('profiles').select('full_name, phone').eq('id', result.data.user.id).single(); found = { name: profile.data ? profile.data.full_name : email, email: email, phone: profile.data ? profile.data.phone : '' }; } else { const passwordHash = await hashPassword($('#login-password').value); found = customers.find(function (item) { return item.email === email && item.passwordHash === passwordHash; }); if (!found) { $('#auth-note').textContent = 'Email ya password galat hai.'; return; } } setActive(found); await syncRemoteData(); $('#auth-note').textContent = 'Login successful.'; setTimeout(closeAuth, 600); });

  // Existing site behaviour
  const hamburger = $('#hamburger'); const mainNav = $('#main-nav');
  hamburger.addEventListener('click', function () { hamburger.classList.toggle('open'); mainNav.classList.toggle('open'); });
  mainNav.querySelectorAll('a').forEach(function (link) { link.addEventListener('click', function () { hamburger.classList.remove('open'); mainNav.classList.remove('open'); }); });
  const scrollTopBtn = $('#scroll-top'); window.addEventListener('scroll', function () { scrollTopBtn.classList.toggle('visible', window.scrollY > 400); }); scrollTopBtn.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
  $('#year').textContent = new Date().getFullYear();
  updateCounts(); renderOrders(); renderCustomers(); if (activeCustomer) { setActive(activeCustomer); syncRemoteData(); }
});
