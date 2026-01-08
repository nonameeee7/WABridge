/**
 * WABridge CRM - WhatsApp Business Manager
 * 
 * A simple CRM for managing WhatsApp Business communications
 */

// ============================================
// CONFIGURATION
// ============================================
const CONFIG = {
    APP_ID: '2704195743293039',
    CONFIG_ID: '879357534817865',
    API_VERSION: 'v20.0',
    API_BASE: 'https://graph.facebook.com'
};

// ============================================
// STATE MANAGEMENT
// ============================================
let state = {
    connected: false,
    accessToken: null,
    wabaId: null,
    phoneNumberId: null,
    phoneNumber: null,
    currentView: 'inbox',
    currentConversation: null,
    conversations: [],
    contacts: [],
    templates: []
};

// Sample data for demo
const sampleConversations = [
    {
        id: '1',
        name: 'John Doe',
        phone: '+1234567890',
        avatar: 'JD',
        lastMessage: 'Thanks for the information!',
        time: '2:30 PM',
        unread: true,
        messages: [
            { id: 1, text: 'Hi, I need help with my order', type: 'incoming', time: '2:25 PM' },
            { id: 2, text: 'Sure! I can help you with that. What is your order number?', type: 'outgoing', time: '2:27 PM' },
            { id: 3, text: 'Order #12345', type: 'incoming', time: '2:28 PM' },
            { id: 4, text: 'I found your order. It will be delivered tomorrow.', type: 'outgoing', time: '2:29 PM' },
            { id: 5, text: 'Thanks for the information!', type: 'incoming', time: '2:30 PM' }
        ]
    },
    {
        id: '2',
        name: 'Sarah Smith',
        phone: '+1987654321',
        avatar: 'SS',
        lastMessage: 'Can I get a quote?',
        time: '1:15 PM',
        unread: true,
        messages: [
            { id: 1, text: 'Hello, I am interested in your services', type: 'incoming', time: '1:10 PM' },
            { id: 2, text: 'Can I get a quote?', type: 'incoming', time: '1:15 PM' }
        ]
    },
    {
        id: '3',
        name: 'Mike Johnson',
        phone: '+1122334455',
        avatar: 'MJ',
        lastMessage: 'Perfect, see you then!',
        time: 'Yesterday',
        unread: false,
        messages: [
            { id: 1, text: 'Hi Mike, just confirming our meeting tomorrow at 10 AM', type: 'outgoing', time: 'Yesterday' },
            { id: 2, text: 'Perfect, see you then!', type: 'incoming', time: 'Yesterday' }
        ]
    }
];

const sampleContacts = [
    { id: '1', name: 'John Doe', phone: '+1234567890', email: 'john@example.com', tags: ['customer', 'vip'] },
    { id: '2', name: 'Sarah Smith', phone: '+1987654321', email: 'sarah@example.com', tags: ['lead'] },
    { id: '3', name: 'Mike Johnson', phone: '+1122334455', email: 'mike@example.com', tags: ['customer'] },
    { id: '4', name: 'Emily Brown', phone: '+1555666777', email: 'emily@example.com', tags: ['partner'] },
    { id: '5', name: 'David Wilson', phone: '+1888999000', email: 'david@example.com', tags: ['customer'] }
];

const sampleTemplates = [
    { id: '1', name: 'hello_world', category: 'UTILITY', status: 'APPROVED', body: 'Hello {{1}}! Welcome to our service.' },
    { id: '2', name: 'order_confirmation', category: 'UTILITY', status: 'APPROVED', body: 'Hi {{1}}, your order #{{2}} has been confirmed. Expected delivery: {{3}}.' },
    { id: '3', name: 'appointment_reminder', category: 'UTILITY', status: 'PENDING', body: 'Reminder: You have an appointment scheduled for {{1}} at {{2}}.' },
    { id: '4', name: 'promotion_offer', category: 'MARKETING', status: 'REJECTED', body: 'Special offer! Get {{1}}% off on your next purchase. Use code: {{2}}' }
];

// ============================================
// FACEBOOK SDK INITIALIZATION
// ============================================
let fbSDKLoaded = false;

window.fbAsyncInit = function () {
    FB.init({
        appId: CONFIG.APP_ID,
        cookie: true,
        xfbml: true,
        version: CONFIG.API_VERSION
    });

    fbSDKLoaded = true;
    console.log('Facebook SDK initialized');
};

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', function () {
    // Load saved state
    loadState();

    // Initialize navigation
    initNavigation();

    // Load sample data
    state.conversations = sampleConversations;
    state.contacts = sampleContacts;
    state.templates = sampleTemplates;

    // Render initial view
    renderConversations();
    renderContacts();
    renderTemplates();

    // Setup event listeners
    setupEventListeners();

    // Update connection status UI
    updateConnectionUI();
});

// ============================================
// NAVIGATION
// ============================================
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item[data-view]');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const view = item.dataset.view;
            switchView(view);
        });
    });
}

function switchView(viewName) {
    // Update state
    state.currentView = viewName;

    // Update nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.view === viewName) {
            item.classList.add('active');
        }
    });

    // Update views
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });

    const targetView = document.getElementById(`${viewName}-view`);
    if (targetView) {
        targetView.classList.add('active');
    }
}

// ============================================
// INBOX / CONVERSATIONS
// ============================================
function renderConversations() {
    const container = document.getElementById('conversations-list');

    if (state.conversations.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="padding: 2rem;">
                <p>No conversations yet</p>
            </div>
        `;
        return;
    }

    container.innerHTML = state.conversations.map(conv => `
        <div class="conversation-item ${conv.unread ? 'unread' : ''} ${state.currentConversation?.id === conv.id ? 'active' : ''}" 
             onclick="openConversation('${conv.id}')">
            <div class="avatar">${conv.avatar}</div>
            <div class="conversation-info">
                <div class="conversation-header">
                    <span class="conversation-name">${conv.name}</span>
                    <span class="conversation-time">${conv.time}</span>
                </div>
                <div class="conversation-preview">${conv.lastMessage}</div>
            </div>
            ${conv.unread ? '<div class="unread-badge"></div>' : ''}
        </div>
    `).join('');
}

function openConversation(id) {
    const conversation = state.conversations.find(c => c.id === id);
    if (!conversation) return;

    state.currentConversation = conversation;

    // Mark as read
    conversation.unread = false;
    updateInboxBadge();

    // Update UI
    renderConversations();

    // Show chat content
    document.querySelector('.chat-placeholder').classList.add('hidden');
    document.getElementById('chat-content').classList.remove('hidden');

    // Update chat header
    document.getElementById('chat-avatar').textContent = conversation.avatar;
    document.getElementById('chat-name').textContent = conversation.name;
    document.getElementById('chat-phone').textContent = conversation.phone;

    // Render messages
    renderMessages(conversation.messages);
}

function renderMessages(messages) {
    const container = document.getElementById('messages-container');

    container.innerHTML = messages.map(msg => `
        <div class="message ${msg.type}">
            ${msg.text}
            <span class="message-time">${msg.time}</span>
        </div>
    `).join('');

    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
}

function sendChatMessage() {
    const input = document.getElementById('message-input');
    const text = input.value.trim();

    if (!text || !state.currentConversation) return;

    // Add message to conversation
    const newMessage = {
        id: Date.now(),
        text: text,
        type: 'outgoing',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    state.currentConversation.messages.push(newMessage);
    state.currentConversation.lastMessage = text;
    state.currentConversation.time = 'Just now';

    // Clear input
    input.value = '';

    // Re-render
    renderMessages(state.currentConversation.messages);
    renderConversations();

    // If connected, send via API
    if (state.connected && state.accessToken) {
        sendWhatsAppMessage(state.currentConversation.phone, text);
    }
}

function updateInboxBadge() {
    const unreadCount = state.conversations.filter(c => c.unread).length;
    const badge = document.getElementById('inbox-badge');

    if (unreadCount > 0) {
        badge.textContent = unreadCount;
        badge.style.display = 'block';
    } else {
        badge.style.display = 'none';
    }
}

function refreshInbox() {
    showToast('Refreshing inbox...', 'info');

    // Simulate refresh
    setTimeout(() => {
        showToast('Inbox updated', 'success');
    }, 1000);
}

// ============================================
// CONTACTS
// ============================================
function renderContacts() {
    const container = document.getElementById('contacts-grid');

    if (state.contacts.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="64" height="64">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                </svg>
                <h3>No contacts yet</h3>
                <p>Add your first contact to start messaging</p>
                <button class="btn-primary" onclick="openAddContact()">Add Contact</button>
            </div>
        `;
        return;
    }

    container.innerHTML = state.contacts.map(contact => `
        <div class="contact-card" onclick="viewContact('${contact.id}')">
            <div class="contact-card-header">
                <div class="avatar">${getInitials(contact.name)}</div>
                <div class="contact-card-info">
                    <h3>${contact.name}</h3>
                    <span>${contact.phone}</span>
                </div>
            </div>
            <div class="contact-card-actions">
                <button class="btn-secondary" onclick="event.stopPropagation(); startChat('${contact.phone}')">
                    Message
                </button>
            </div>
        </div>
    `).join('');
}

function openAddContact() {
    openModal('add-contact-modal');
}

function saveContact() {
    const name = document.getElementById('contact-name').value.trim();
    const phone = document.getElementById('contact-phone').value.trim();
    const email = document.getElementById('contact-email').value.trim();
    const tagsInput = document.getElementById('contact-tags').value.trim();

    if (!name || !phone) {
        showToast('Name and phone number are required', 'error');
        return;
    }

    const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()) : [];

    const newContact = {
        id: Date.now().toString(),
        name,
        phone,
        email,
        tags
    };

    state.contacts.push(newContact);
    renderContacts();
    closeModal();
    showToast('Contact added successfully', 'success');

    // Clear form
    document.getElementById('contact-name').value = '';
    document.getElementById('contact-phone').value = '';
    document.getElementById('contact-email').value = '';
    document.getElementById('contact-tags').value = '';
}

function importContacts() {
    showToast('Import feature coming soon', 'info');
}

function viewContact(id) {
    const contact = state.contacts.find(c => c.id === id);
    if (contact) {
        showToast(`Viewing ${contact.name}`, 'info');
    }
}

function startChat(phone) {
    switchView('inbox');
    openNewChat();
    document.getElementById('new-chat-phone').value = phone;
}

// ============================================
// TEMPLATES
// ============================================
function renderTemplates() {
    const container = document.getElementById('templates-container');

    if (state.templates.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="64" height="64">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
                <h3>No templates yet</h3>
                <p>Create or sync templates from your Meta Business account</p>
                <button class="btn-primary" onclick="syncTemplates()">Sync from Meta</button>
            </div>
        `;
        return;
    }

    container.innerHTML = state.templates.map(template => `
        <div class="template-card">
            <div class="template-header">
                <span class="template-name">${template.name}</span>
                <span class="template-status ${template.status.toLowerCase()}">${template.status}</span>
            </div>
            <div class="template-category">${template.category}</div>
            <div class="template-body">${template.body}</div>
            <div class="template-actions">
                <button class="btn-secondary" onclick="useTemplate('${template.id}')">Use</button>
                <button class="btn-secondary" onclick="editTemplate('${template.id}')">Edit</button>
            </div>
        </div>
    `).join('');
}

function syncTemplates() {
    if (!state.connected) {
        showToast('Please connect your WhatsApp Business Account first', 'error');
        return;
    }

    showToast('Syncing templates from Meta...', 'info');

    // Simulate sync
    setTimeout(() => {
        showToast('Templates synced successfully', 'success');
    }, 1500);
}

function openCreateTemplate() {
    showToast('Template creation coming soon', 'info');
}

function useTemplate(id) {
    const template = state.templates.find(t => t.id === id);
    if (template) {
        switchView('inbox');
        openNewChat();
        document.getElementById('new-chat-type').value = 'template';
        toggleNewChatType();
    }
}

function editTemplate(id) {
    showToast('Template editing coming soon', 'info');
}

// ============================================
// CAMPAIGNS
// ============================================
function openCreateCampaign() {
    showToast('Campaign creation coming soon', 'info');
}

// ============================================
// NEW CHAT
// ============================================
function openNewChat() {
    openModal('new-chat-modal');
}

function toggleNewChatType() {
    const type = document.getElementById('new-chat-type').value;
    const templateGroup = document.getElementById('new-chat-template-group');
    const textGroup = document.getElementById('new-chat-text-group');

    if (type === 'template') {
        templateGroup.classList.remove('hidden');
        textGroup.classList.add('hidden');
    } else {
        templateGroup.classList.add('hidden');
        textGroup.classList.remove('hidden');
    }
}

function startNewChat() {
    const phone = document.getElementById('new-chat-phone').value.trim();
    const type = document.getElementById('new-chat-type').value;

    if (!phone) {
        showToast('Please enter a phone number', 'error');
        return;
    }

    // Create or find conversation
    let conversation = state.conversations.find(c => c.phone === phone);

    if (!conversation) {
        conversation = {
            id: Date.now().toString(),
            name: phone,
            phone: phone,
            avatar: phone.slice(-2),
            lastMessage: 'New conversation',
            time: 'Just now',
            unread: false,
            messages: []
        };
        state.conversations.unshift(conversation);
    }

    closeModal();
    openConversation(conversation.id);

    // If template message, send it
    if (type === 'template') {
        const templateName = document.getElementById('new-chat-template').value;
        showToast(`Sending template: ${templateName}`, 'info');
    }
}

// ============================================
// WHATSAPP EMBEDDED SIGNUP (NEW FLOW)
// ============================================
function launchWhatsAppSignup() {
    // Open the new signup flow in a popup
    const width = 600;
    const height = 750;
    const left = (window.innerWidth / 2) - (width / 2);
    const top = (window.innerHeight / 2) - (height / 2);

    const signupWindow = window.open(
        'signup.html',
        'WhatsAppSignup',
        `width=${width},height=${height},left=${left},top=${top},status=no,menubar=no,toolbar=no`
    );

    if (!signupWindow) {
        showToast('Popup blocked! Please allow popups for this site.', 'error');
        return;
    }

    // Connect to the window to receive messages
    const messageListener = function (event) {
        // For security, checking origin is recommended
        // if (event.origin !== window.location.origin) return;

        console.log('Received message from signup popup:', event.data);

        // Check if the message contains the expected data
        if (event.data && event.data.accessToken && event.data.whatsappBusinessAccountId) {
            const data = event.data;

            // Update state with base credentials
            state.accessToken = data.accessToken;
            state.wabaId = data.whatsappBusinessAccountId;

            // Handle Phone Numbers
            if (data.phoneNumbers && data.phoneNumbers.length > 0) {
                if (data.phoneNumbers.length === 1) {
                    // Auto-select the only number
                    const phone = data.phoneNumbers[0];
                    state.phoneNumberId = phone.id;
                    state.phoneNumber = phone.formatted_phone_number || phone.display_phone_number;
                    state.connected = true;

                    updateConnectionUI();
                    saveState();
                    showToast('Connected successfully!', 'success');
                } else {
                    // Show selection modal
                    showPhoneNumberSelectionModal(data.phoneNumbers);
                }
            } else {
                // Fallback for unexpected data structure or no numbers
                if (data.phoneNumberId) {
                    state.phoneNumberId = data.phoneNumberId;
                    state.phoneNumber = data.formattedPhoneNumber;
                    state.connected = true;
                    updateConnectionUI();
                    saveState();
                    showToast('Connected successfully!', 'success');
                } else {
                    showToast('No phone numbers found associated with this account.', 'error');
                }
            }

            // Remove the listener after success
            window.removeEventListener('message', messageListener);
        }
    };

    window.addEventListener('message', messageListener);
}

function showTokenModal(code) {
    const btn = document.getElementById('connect-btn');
    btn.textContent = 'Connect Account';
    btn.disabled = false;

    const modal = document.createElement('div');
    modal.id = 'token-modal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-header">
            <h2>Complete Connection</h2>
            <button class="close-btn" onclick="closeTokenModal()">&times;</button>
        </div>
        <div class="modal-body">
            <p style="color: var(--text-secondary); margin-bottom: 1rem;">Enter your credentials to complete the connection.</p>
            
            <div class="form-group">
                <label>Exchangeable Code</label>
                <textarea readonly style="height: 60px; font-size: 0.75rem;">${code}</textarea>
            </div>
            
            <div class="form-group">
                <label>Access Token</label>
                <input type="password" id="modal-token" placeholder="Enter your access token">
            </div>
            
            <div class="form-group">
                <label>WABA ID</label>
                <input type="text" id="modal-waba" placeholder="WhatsApp Business Account ID">
            </div>
            
            <div class="form-group">
                <label>Phone Number ID</label>
                <input type="text" id="modal-phone-id" placeholder="Phone Number ID">
            </div>
        </div>
        <div class="modal-footer">
            <button class="btn-secondary" onclick="closeTokenModal()">Cancel</button>
            <button class="btn-primary" onclick="completeConnection()">Connect</button>
        </div>
    `;

    document.getElementById('modal-overlay').classList.remove('hidden');
    document.body.appendChild(modal);
}

function closeTokenModal() {
    const modal = document.getElementById('token-modal');
    if (modal) modal.remove();
    document.getElementById('modal-overlay').classList.add('hidden');
}

function completeConnection() {
    const token = document.getElementById('modal-token').value.trim();
    const wabaId = document.getElementById('modal-waba').value.trim();
    const phoneId = document.getElementById('modal-phone-id').value.trim();

    if (!token || !wabaId || !phoneId) {
        showToast('All fields are required', 'error');
        return;
    }

    state.accessToken = token;
    state.wabaId = wabaId;
    state.phoneNumberId = phoneId;
    state.connected = true;

    closeTokenModal();
    updateConnectionUI();
    saveState();
    fetchPhoneNumber();

    showToast('Connected successfully!', 'success');
}

async function fetchAccountDetails() {
    try {
        const response = await fetch(
            `${CONFIG.API_BASE}/${CONFIG.API_VERSION}/me/whatsapp_business_accounts?access_token=${state.accessToken}`
        );

        const data = await response.json();

        if (data.data && data.data.length > 0) {
            state.wabaId = data.data[0].id;
            state.connected = true;

            await fetchPhoneNumbers();
            updateConnectionUI();
            saveState();

            showToast('Connected successfully!', 'success');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Failed to fetch account details', 'error');
    }

    document.getElementById('connect-btn').textContent = 'Connect Account';
    document.getElementById('connect-btn').disabled = false;
}

async function fetchPhoneNumbers() {
    try {
        const response = await fetch(
            `${CONFIG.API_BASE}/${CONFIG.API_VERSION}/${state.wabaId}/phone_numbers?access_token=${state.accessToken}`
        );

        const data = await response.json();

        if (data.data && data.data.length > 0) {
            state.phoneNumberId = data.data[0].id;
            state.phoneNumber = data.data[0].display_phone_number;
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

async function fetchPhoneNumber() {
    if (!state.phoneNumberId) return;

    try {
        const response = await fetch(
            `${CONFIG.API_BASE}/${CONFIG.API_VERSION}/${state.phoneNumberId}?fields=display_phone_number&access_token=${state.accessToken}`
        );

        const data = await response.json();

        if (data.display_phone_number) {
            state.phoneNumber = data.display_phone_number;
            document.getElementById('phone-number').textContent = state.phoneNumber;
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

function disconnect() {
    if (!confirm('Are you sure you want to disconnect?')) return;

    state.connected = false;
    state.accessToken = null;
    state.wabaId = null;
    state.phoneNumberId = null;
    state.phoneNumber = null;

    localStorage.removeItem('wabridge_crm_state');
    updateConnectionUI();
    showToast('Disconnected', 'success');
}

function updateConnectionUI() {
    const statusDot = document.querySelector('.connection-status .status-dot');
    const statusText = document.querySelector('.connection-status span:last-child');
    const connectBtn = document.getElementById('connect-btn');
    const connectionInfo = document.getElementById('connection-info');
    const accountDetails = document.getElementById('account-details');

    if (state.connected) {
        statusDot.classList.remove('disconnected');
        statusDot.classList.add('connected');
        statusText.textContent = 'Connected';

        connectBtn.style.display = 'none';
        connectionInfo.textContent = 'Your WhatsApp Business Account is connected';
        accountDetails.classList.remove('hidden');

        document.getElementById('waba-id').textContent = state.wabaId || '-';
        document.getElementById('phone-number-id').textContent = state.phoneNumberId || '-';
        document.getElementById('phone-number').textContent = state.phoneNumber || 'Loading...';
        document.getElementById('access-token').textContent = state.accessToken ?
            state.accessToken.substring(0, 20) + '...' : '-';
    } else {
        statusDot.classList.add('disconnected');
        statusDot.classList.remove('connected');
        statusText.textContent = 'Not Connected';

        connectBtn.style.display = 'inline-flex';
        connectionInfo.textContent = 'Connect your WhatsApp Business Account to start messaging';
        accountDetails.classList.add('hidden');
    }
}

// ============================================
// WHATSAPP API
// ============================================
async function sendWhatsAppMessage(to, text) {
    if (!state.connected || !state.accessToken) return;

    const phone = to.replace(/[^0-9]/g, '');

    try {
        const response = await fetch(
            `${CONFIG.API_BASE}/${CONFIG.API_VERSION}/${state.phoneNumberId}/messages`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${state.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    messaging_product: 'whatsapp',
                    to: phone,
                    type: 'text',
                    text: { body: text }
                })
            }
        );

        const data = await response.json();

        if (data.messages) {
            console.log('Message sent:', data);
        } else if (data.error) {
            console.error('API Error:', data.error);
            showToast(`Error: ${data.error.message}`, 'error');
        }
    } catch (error) {
        console.error('Error sending message:', error);
    }
}

// ============================================
// MODALS
// ============================================
function openModal(modalId) {
    document.getElementById('modal-overlay').classList.remove('hidden');
    document.getElementById(modalId).classList.remove('hidden');
}

function closeModal() {
    document.getElementById('modal-overlay').classList.add('hidden');
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.add('hidden');
    });
}

// ============================================
// UTILITIES
// ============================================
function getInitials(name) {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

function copyToClipboard(elementId) {
    const element = document.getElementById(elementId);
    let text = element.textContent;

    if (elementId === 'access-token') {
        text = state.accessToken;
    }

    navigator.clipboard.writeText(text).then(() => {
        showToast('Copied to clipboard', 'success');
    });
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function saveState() {
    const saveData = {
        connected: state.connected,
        accessToken: state.accessToken,
        wabaId: state.wabaId,
        phoneNumberId: state.phoneNumberId,
        phoneNumber: state.phoneNumber
    };
    localStorage.setItem('wabridge_crm_state', JSON.stringify(saveData));
}

function loadState() {
    const saved = localStorage.getItem('wabridge_crm_state');
    if (saved) {
        const data = JSON.parse(saved);
        Object.assign(state, data);
    }
}

function setupEventListeners() {
    // Message input enter key
    document.getElementById('message-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendChatMessage();
        }
    });

    // New chat type toggle
    document.getElementById('new-chat-type').addEventListener('change', toggleNewChatType);

    // Search conversations
    document.getElementById('search-conversations').addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const filtered = sampleConversations.filter(c =>
            c.name.toLowerCase().includes(query) ||
            c.phone.includes(query)
        );
        state.conversations = filtered;
        renderConversations();
    });

    // Search contacts
    document.getElementById('search-contacts').addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const filtered = sampleContacts.filter(c =>
            c.name.toLowerCase().includes(query) ||
            c.phone.includes(query)
        );
        state.contacts = filtered;
        renderContacts();
    });
}

// Update inbox badge on load
setTimeout(updateInboxBadge, 100);

// ============================================
// PHONE NUMBER SELECTION
// ============================================
function showPhoneNumberSelectionModal(phoneNumbers) {
    // Check if modal exists
    let modal = document.getElementById('phone-selection-modal');

    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'phone-selection-modal';
        modal.className = 'modal';
        document.body.appendChild(modal);
    }

    window.tempPhoneNumbers = phoneNumbers;

    const listHtml = phoneNumbers.map((p, index) => `
        <div onclick="selectPhoneNumber(${index})" 
             style="padding: 15px; border: 1px solid #ddd; border-radius: 8px; margin-bottom: 10px; cursor: pointer; transition: background 0.2s;">
            <div style="font-weight: bold; color: var(--text-primary);">${p.display_phone_number}</div>
            <div style="font-size: 0.85rem; color: var(--text-secondary);">ID: ${p.id}</div>
        </div>
    `).join('');

    modal.innerHTML = `
        <div class="modal-header">
            <h2>Select WhatsApp Number</h2>
        </div>
        <div class="modal-body" style="max-height: 400px; overflow-y: auto;">
            <p style="margin-bottom: 15px; color: var(--text-secondary);">Multiple numbers found. Select one to connect:</p>
            ${listHtml}
        </div>
    `;

    modal.classList.remove('hidden');
}

function selectPhoneNumber(index) {
    const phones = window.tempPhoneNumbers;
    if (phones && phones[index]) {
        const phone = phones[index];
        state.phoneNumberId = phone.id;
        state.phoneNumber = phone.formatted_phone_number || phone.display_phone_number;
        state.connected = true;

        updateConnectionUI();
        saveState();
        showToast('Connected successfully!', 'success');

        // Hide/Remove modal
        const modal = document.getElementById('phone-selection-modal');
        if (modal) modal.remove();
        delete window.tempPhoneNumbers;
    }
}
