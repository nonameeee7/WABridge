const showPermissions = () => {
    document.getElementById('login-card').classList.add('hidden');
    document.getElementById('permission-card').classList.remove('hidden');
};

const completeLogin = () => {
    document.getElementById('auth-flow').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
};

const showView = (viewName) => {
    // Update Views
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(`view-${viewName}`).classList.add('active');

    // Update Sidebar
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    document.getElementById(`nav-${viewName}`).classList.add('active');
};

const sendMessage = () => {
    const input = document.getElementById('msg-input');
    if (!input.value) return;

    const msgList = document.getElementById('message-list');
    const msg = document.createElement('div');
    msg.className = 'msg sent';
    msg.innerText = input.value;
    msgList.appendChild(msg);
    input.value = '';
    msgList.scrollTop = msgList.scrollHeight;
};

const sendTemplate = () => {
    const msgList = document.getElementById('message-list');
    const msg = document.createElement('div');
    msg.className = 'msg sent';
    msg.innerHTML = `<strong>Order Confirmation:</strong> Hi John, your order #5920 has been confirmed and will be delivered within 3 working days. Thank you for shopping with us!`;
    msgList.appendChild(msg);
    msgList.scrollTop = msgList.scrollHeight;
};

const syncCatalog = () => {
    const grid = document.getElementById('product-grid');
    grid.innerHTML = '<div class="catalog-empty">Fetching your catalog from Meta...</div>';

    setTimeout(() => {
        grid.innerHTML = `
            <div class="product-card">
                <div class="product-img">📱</div>
                <div class="product-info">
                    <h4>iPhone 15 Pro</h4>
                    <p class="price">₹1,34,900</p>
                </div>
            </div>
            <div class="product-card">
                <div class="product-img">🎧</div>
                <div class="product-info">
                    <h4>AirPods Pro (2nd Gen)</h4>
                    <p class="price">₹24,900</p>
                </div>
            </div>
            <div class="product-card">
                <div class="product-img">⌚</div>
                <div class="product-info">
                    <h4>Apple Watch Ultra</h4>
                    <p class="price">₹89,900</p>
                </div>
            </div>
            <div class="product-card">
                <div class="product-img">💻</div>
                <div class="product-info">
                    <h4>MacBook Air M3</h4>
                    <p class="price">₹1,14,900</p>
                </div>
            </div>
        `;
    }, 1500);
};

// Enter key for messaging
document.getElementById('msg-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});
