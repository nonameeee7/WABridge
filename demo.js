/**
 * WABridge Demo Dashboard JavaScript
 * Interactive demo for WhatsApp Business API verification
 */

document.addEventListener('DOMContentLoaded', function () {
    initSidebarNavigation();
    initProfileSection();
    initBusinessSection();
    initWhatsAppSection();
    initMessagingSection();
    initCatalogSection();
    initModals();
    initToast();
    initLogsPanel();

    // Auto-load profile data on start
    setTimeout(() => {
        fetchProfileData();
        fetchBusinessData();
        fetchWABAData();
        fetchPhoneNumbers();
        fetchCatalogs();
    }, 500);
});

// Demo data store
const demoData = {
    profile: {
        id: '100092847563821',
        name: 'WABridge Admin',
        email: 'admin@wabridge.in'
    },
    business: {
        id: '183726459102847',
        name: 'WABridge Technologies Pvt Ltd',
        type: 'Technology Services',
        country: 'India',
        verified: true,
        created: 'January 2024'
    },
    waba: {
        id: '109283746582019',
        name: 'WABridge Official',
        status: 'Connected'
    },
    phone: {
        number: '+91 98765 43210',
        quality: 'High',
        verified: true
    },
    catalog: {
        id: '294817365028194',
        name: 'Main Product Catalog',
        products: 24
    }
};

// Sidebar Navigation
function initSidebarNavigation() {
    const menuItems = document.querySelectorAll('.sidebar-menu li[data-section]');
    const sections = document.querySelectorAll('.demo-section');

    menuItems.forEach(item => {
        item.addEventListener('click', function () {
            const sectionId = this.dataset.section;

            // Update active menu item
            menuItems.forEach(mi => mi.classList.remove('active'));
            this.classList.add('active');

            // Show corresponding section
            sections.forEach(section => {
                section.classList.remove('active');
                if (section.id === `section-${sectionId}`) {
                    section.classList.add('active');
                }
            });

            // Log the navigation
            addLogEntry('GET', `/${sectionId}/data`, '200 OK', 'success');
        });
    });

    // Handle quick actions
    const actionItems = document.querySelectorAll('.sidebar-menu li[data-action]');
    actionItems.forEach(item => {
        item.addEventListener('click', function () {
            const action = this.dataset.action;
            if (action === 'refresh') {
                refreshAllData();
            } else if (action === 'logs') {
                toggleLogsPanel();
            }
        });
    });
}

// Profile Section
function initProfileSection() {
    const fetchBtn = document.getElementById('fetchProfile');
    if (fetchBtn) {
        fetchBtn.addEventListener('click', fetchProfileData);
    }
}

function fetchProfileData() {
    showLoading('profileDisplay');

    // Simulate API call
    setTimeout(() => {
        document.getElementById('profileId').textContent = demoData.profile.id;
        document.getElementById('profileName').textContent = demoData.profile.name;
        document.getElementById('profileEmail').textContent = demoData.profile.email;

        // Update header user info
        document.querySelector('.user-name').textContent = demoData.profile.name;
        document.querySelector('.user-email').textContent = demoData.profile.email;

        hideLoading('profileDisplay');
        showToast('Profile data fetched successfully!', 'success');
        addLogEntry('GET', '/me?fields=id,name,email', '200 OK', 'success');
    }, 800);
}

// Business Section
function initBusinessSection() {
    const fetchBtn = document.getElementById('fetchBusiness');
    if (fetchBtn) {
        fetchBtn.addEventListener('click', fetchBusinessData);
    }
}

function fetchBusinessData() {
    // Simulate API call
    setTimeout(() => {
        document.getElementById('businessName').textContent = demoData.business.name;
        document.getElementById('businessId').textContent = `ID: ${demoData.business.id}`;
        document.getElementById('businessType').textContent = demoData.business.type;
        document.getElementById('verificationStatus').innerHTML = demoData.business.verified ? '✓ Verified' : 'Pending';
        document.getElementById('businessCountry').textContent = '🇮🇳 ' + demoData.business.country;
        document.getElementById('businessCreated').textContent = demoData.business.created;

        addLogEntry('GET', '/me/businesses?fields=id,name,verification_status', '200 OK', 'success');
    }, 600);
}

// WhatsApp Section
function initWhatsAppSection() {
    document.getElementById('fetchWABA')?.addEventListener('click', fetchWABAData);
    document.getElementById('fetchPhones')?.addEventListener('click', fetchPhoneNumbers);
    document.getElementById('fetchTemplates')?.addEventListener('click', fetchTemplates);
    document.getElementById('createTemplate')?.addEventListener('click', openTemplateModal);
}

function fetchWABAData() {
    setTimeout(() => {
        document.getElementById('wabaName').textContent = demoData.waba.name;
        document.getElementById('wabaId').textContent = `WABA ID: ${demoData.waba.id}`;
        document.getElementById('wabaStatus').textContent = demoData.waba.status;

        addLogEntry('GET', `/${demoData.business.id}/owned_whatsapp_business_accounts`, '200 OK', 'success');
        showToast('WABA data loaded!', 'success');
    }, 500);
}

function fetchPhoneNumbers() {
    setTimeout(() => {
        document.getElementById('phoneDisplay').textContent = demoData.phone.number;
        document.getElementById('phoneQuality').innerHTML = `Quality: <span class="quality-high">${demoData.phone.quality}</span>`;

        addLogEntry('GET', `/${demoData.waba.id}/phone_numbers?fields=display_phone_number,quality_rating`, '200 OK', 'success');
    }, 400);
}

function fetchTemplates() {
    showToast('Templates refreshed!', 'success');
    addLogEntry('GET', `/${demoData.waba.id}/message_templates?fields=name,category,language,status`, '200 OK', 'success');
}

// Messaging Section
function initMessagingSection() {
    const form = document.getElementById('sendMessageForm');
    const messageType = document.getElementById('messageType');
    const templateSelect = document.getElementById('templateSelect');
    const textInput = document.getElementById('textInput');

    if (messageType) {
        messageType.addEventListener('change', function () {
            if (this.value === 'template') {
                templateSelect.classList.remove('hidden');
                textInput.classList.add('hidden');
            } else {
                templateSelect.classList.add('hidden');
                textInput.classList.remove('hidden');
            }
        });
    }

    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            sendMessage();
        });
    }

    // Time filter buttons
    const timeButtons = document.querySelectorAll('.time-btn');
    timeButtons.forEach(btn => {
        btn.addEventListener('click', function () {
            timeButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            updateStats(this.textContent);
        });
    });
}

function sendMessage() {
    const btn = document.getElementById('sendMsgBtn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span class="btn-icon">⏳</span> Sending...';
    btn.disabled = true;

    setTimeout(() => {
        // Add message to chat preview
        const chatMessages = document.getElementById('chatMessages');
        const messageType = document.getElementById('messageType').value;
        const templateName = document.getElementById('templateName')?.value || 'welcome_message';

        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

        const newMessage = document.createElement('div');
        newMessage.className = 'message-bubble sent' + (messageType === 'template' ? ' template' : '');
        newMessage.innerHTML = `
      ${messageType === 'template' ? `<div class="template-header">📋 Template: ${templateName}</div>` : ''}
      <div class="message-content">
        <p>${messageType === 'template' ? 'Hello! Welcome to WABridge. Thank you for your interest! 🎉' : document.getElementById('messageText')?.value || 'Custom message'}</p>
      </div>
      <div class="message-meta">
        <span class="message-time">${timeStr}</span>
        <span class="message-status">✓</span>
      </div>
    `;

        chatMessages.appendChild(newMessage);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // Update status
        document.getElementById('previewStatus').textContent = 'Message Sent';

        // Animate message status
        setTimeout(() => {
            newMessage.querySelector('.message-status').textContent = '✓✓';
            newMessage.querySelector('.message-status').style.color = '#53bdeb';
            document.getElementById('previewStatus').textContent = 'Delivered';
        }, 1000);

        btn.innerHTML = originalText;
        btn.disabled = false;

        showToast('Message sent successfully!', 'success');
        addLogEntry('POST', `/${demoData.phone.number.replace(/\s/g, '')}/messages`, '200 OK', 'success');

        // Update stats
        const sentStat = document.getElementById('statSent');
        sentStat.textContent = (parseInt(sentStat.textContent.replace(',', '')) + 1).toLocaleString();
    }, 1200);
}

function updateStats(period) {
    const multipliers = {
        'Today': 1,
        'This Week': 7,
        'This Month': 30
    };

    const base = {
        sent: 1247,
        delivered: 1215,
        read: 987,
        received: 342
    };

    const mult = multipliers[period] || 1;

    animateNumber('statSent', base.sent * mult);
    animateNumber('statDelivered', base.delivered * mult);
    animateNumber('statRead', base.read * mult);
    animateNumber('statReceived', base.received * mult);
}

function animateNumber(elementId, target) {
    const element = document.getElementById(elementId);
    const current = parseInt(element.textContent.replace(/,/g, ''));
    const diff = target - current;
    const steps = 20;
    const stepValue = diff / steps;
    let step = 0;

    const interval = setInterval(() => {
        step++;
        if (step >= steps) {
            element.textContent = target.toLocaleString();
            clearInterval(interval);
        } else {
            element.textContent = Math.round(current + stepValue * step).toLocaleString();
        }
    }, 30);
}

// Catalog Section
function initCatalogSection() {
    document.getElementById('fetchCatalogs')?.addEventListener('click', fetchCatalogs);
    document.getElementById('syncCatalog')?.addEventListener('click', () => {
        showToast('Catalog syncing...', 'success');
        addLogEntry('POST', `/${demoData.catalog.id}/batch`, '200 OK', 'success');
        setTimeout(() => showToast('Catalog synced successfully!', 'success'), 2000);
    });
    document.getElementById('addProduct')?.addEventListener('click', openProductModal);
    document.getElementById('addNewProduct')?.addEventListener('click', openProductModal);
    document.getElementById('bulkUpload')?.addEventListener('click', () => {
        showToast('Bulk upload feature - Select a CSV file to upload', 'success');
    });
    document.getElementById('exportCatalog')?.addEventListener('click', () => {
        showToast('Exporting catalog...', 'success');
        addLogEntry('GET', `/${demoData.catalog.id}/products?limit=all`, '200 OK', 'success');
        setTimeout(() => showToast('Catalog exported to CSV!', 'success'), 1500);
    });

    // Product search
    const searchInput = document.getElementById('productSearch');
    if (searchInput) {
        searchInput.addEventListener('input', function () {
            const query = this.value.toLowerCase();
            const products = document.querySelectorAll('.product-card');
            products.forEach(product => {
                const name = product.querySelector('h4').textContent.toLowerCase();
                product.style.display = name.includes(query) ? 'block' : 'none';
            });
        });
    }
}

function fetchCatalogs() {
    setTimeout(() => {
        document.getElementById('catalogName').textContent = demoData.catalog.name;
        document.getElementById('catalogId').textContent = `ID: ${demoData.catalog.id}`;
        document.getElementById('productCount').textContent = `${demoData.catalog.products} Products`;

        showToast('Catalog data loaded!', 'success');
        addLogEntry('GET', `/${demoData.business.id}/owned_product_catalogs`, '200 OK', 'success');
    }, 500);
}

// Modals
function initModals() {
    // Template Modal
    const templateModal = document.getElementById('modalOverlay');
    const closeModal = document.getElementById('closeModal');
    const cancelTemplate = document.getElementById('cancelTemplate');
    const submitTemplate = document.getElementById('submitTemplate');

    closeModal?.addEventListener('click', closeTemplateModal);
    cancelTemplate?.addEventListener('click', closeTemplateModal);
    templateModal?.addEventListener('click', function (e) {
        if (e.target === this) closeTemplateModal();
    });
    submitTemplate?.addEventListener('click', createTemplate);

    // Product Modal
    const productModal = document.getElementById('productModalOverlay');
    const closeProductModal = document.getElementById('closeProductModal');
    const cancelProduct = document.getElementById('cancelProduct');
    const submitProduct = document.getElementById('submitProduct');

    closeProductModal?.addEventListener('click', closeProductModalFunc);
    cancelProduct?.addEventListener('click', closeProductModalFunc);
    productModal?.addEventListener('click', function (e) {
        if (e.target === this) closeProductModalFunc();
    });
    submitProduct?.addEventListener('click', addProduct);
}

function openTemplateModal() {
    document.getElementById('modalOverlay').classList.add('show');
}

function closeTemplateModal() {
    document.getElementById('modalOverlay').classList.remove('show');
    document.getElementById('createTemplateForm').reset();
}

function createTemplate() {
    const name = document.getElementById('newTemplateName').value;
    if (!name) {
        showToast('Please enter a template name', 'error');
        return;
    }

    // Add to table
    const tableBody = document.getElementById('templatesList');
    const newRow = document.createElement('div');
    newRow.className = 'table-row';
    newRow.innerHTML = `
    <span class="template-name">${name}</span>
    <span class="template-category">${document.getElementById('newTemplateCategory').value}</span>
    <span>${document.getElementById('newTemplateLanguage').value}</span>
    <span class="status-badge pending">Pending</span>
    <span class="row-actions">
      <button class="btn-mini" title="View">👁</button>
      <button class="btn-mini" title="Edit">✏️</button>
    </span>
  `;
    tableBody.insertBefore(newRow, tableBody.firstChild);

    closeTemplateModal();
    showToast(`Template "${name}" created and submitted for review!`, 'success');
    addLogEntry('POST', `/${demoData.waba.id}/message_templates`, '200 OK', 'success');
}

function openProductModal() {
    document.getElementById('productModalOverlay').classList.add('show');
}

function closeProductModalFunc() {
    document.getElementById('productModalOverlay').classList.remove('show');
    document.getElementById('addProductForm').reset();
}

function addProduct() {
    const name = document.getElementById('productName').value;
    const sku = document.getElementById('productSku').value;
    const price = document.getElementById('productPrice').value;

    if (!name || !price) {
        showToast('Please fill in required fields', 'error');
        return;
    }

    // Add to grid
    const grid = document.getElementById('productsGrid');
    const newProduct = document.createElement('div');
    newProduct.className = 'product-card';
    newProduct.innerHTML = `
    <div class="product-image">📦</div>
    <div class="product-info">
      <h4>${name}</h4>
      <p class="product-sku">SKU: ${sku || 'NEW-001'}</p>
      <p class="product-price">₹${parseInt(price).toLocaleString()}</p>
      <span class="stock-badge in-stock">In Stock</span>
    </div>
  `;
    grid.insertBefore(newProduct, grid.firstChild);

    // Update count
    demoData.catalog.products++;
    document.getElementById('productCount').textContent = `${demoData.catalog.products} Products`;

    closeProductModalFunc();
    showToast(`Product "${name}" added to catalog!`, 'success');
    addLogEntry('POST', `/${demoData.catalog.id}/products`, '200 OK', 'success');
}

// Toast Notifications
function initToast() {
    // Toast already in HTML
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const icon = toast.querySelector('.toast-icon');
    const msg = toast.querySelector('.toast-message');

    icon.textContent = type === 'success' ? '✓' : '✕';
    msg.textContent = message;
    toast.className = 'toast ' + type + ' show';

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Logs Panel
function initLogsPanel() {
    document.getElementById('closeLogs')?.addEventListener('click', toggleLogsPanel);
}

function toggleLogsPanel() {
    document.getElementById('logsPanel').classList.toggle('open');
}

function addLogEntry(method, endpoint, status, type) {
    const logsContent = document.getElementById('logsContent');
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour12: false });

    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.innerHTML = `
    <span class="log-time">${timeStr}</span>
    <span class="log-method">${method}</span>
    <span class="log-endpoint">${endpoint}</span>
    <span class="log-status">${status}</span>
  `;

    logsContent.insertBefore(entry, logsContent.firstChild);

    // Keep only last 50 entries
    while (logsContent.children.length > 50) {
        logsContent.removeChild(logsContent.lastChild);
    }
}

// Utility Functions
function showLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.style.opacity = '0.5';
    }
}

function hideLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.style.opacity = '1';
    }
}

function refreshAllData() {
    showToast('Refreshing all data...', 'success');
    fetchProfileData();
    fetchBusinessData();
    fetchWABAData();
    fetchPhoneNumbers();
    fetchCatalogs();
    fetchTemplates();

    setTimeout(() => {
        showToast('All data refreshed!', 'success');
    }, 1500);
}

// Keyboard shortcuts
document.addEventListener('keydown', function (e) {
    // ESC to close modals
    if (e.key === 'Escape') {
        closeTemplateModal();
        closeProductModalFunc();
        document.getElementById('logsPanel').classList.remove('open');
    }

    // Ctrl+L to toggle logs
    if (e.ctrlKey && e.key === 'l') {
        e.preventDefault();
        toggleLogsPanel();
    }
});
