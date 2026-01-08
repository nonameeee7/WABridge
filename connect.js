/**
 * WhatsApp Business API - Embedded Signup Integration
 * 
 * This script handles:
 * 1. Facebook SDK initialization
 * 2. WhatsApp Embedded Signup flow
 * 3. Access token and account data retrieval
 * 4. Message sending functionality
 */

// ============================================
// CONFIGURATION - UPDATE THESE VALUES
// ============================================
const CONFIG = {
    // Your Facebook App ID from Meta Developer Console
    APP_ID: '2704195743293039',

    // Configuration ID from Embedded Signup setup
    // Get this from: https://developers.facebook.com/apps/YOUR_APP_ID/whatsapp-business/embedded-signup/
    CONFIG_ID: '879357534817865',

    // Graph API version
    API_VERSION: 'v21.0',

    // Graph API base URL
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
    code: null // Exchangeable code from embedded signup
};

// ============================================
// FACEBOOK SDK INITIALIZATION
// ============================================
window.fbAsyncInit = function () {
    FB.init({
        appId: CONFIG.APP_ID,
        cookie: true,
        xfbml: true,
        version: CONFIG.API_VERSION
    });

    console.log('Facebook SDK initialized');
};

// ============================================
// EMBEDDED SIGNUP FLOW
// ============================================

/**
 * Launch the WhatsApp Embedded Signup popup
 * This opens the Meta login flow for WhatsApp Business Account setup
 */
function launchWhatsAppSignup() {
    const btn = document.getElementById('connect-btn');
    btn.classList.add('loading');
    btn.disabled = true;

    showStatus('Launching WhatsApp Signup...', 'connecting');

    // Session logging callback for real-time updates
    const sessionInfoListener = (message) => {
        console.log('Session Info:', message);

        if (message.event === 'FINISH') {
            // Signup completed successfully
            handleSignupSuccess(message);
        } else if (message.event === 'CANCEL') {
            handleSignupCancel();
        } else if (message.event === 'ERROR') {
            handleSignupError(message);
        }
    };

    // Launch the embedded signup
    FB.login(
        function (response) {
            if (response.authResponse) {
                console.log('Auth Response:', response.authResponse);

                // Get the exchangeable code (not a permanent token)
                if (response.authResponse.code) {
                    state.code = response.authResponse.code;
                    processSignupResponse(response.authResponse);
                } else if (response.authResponse.accessToken) {
                    // In some cases we get a token directly
                    state.accessToken = response.authResponse.accessToken;
                    fetchAccountDetails();
                }
            } else {
                handleSignupCancel();
            }
        },
        {
            config_id: CONFIG.CONFIG_ID,
            response_type: 'code',
            override_default_response_type: true,
            extras: {
                setup: {},
                featureType: '',
                sessionInfoVersion: '3'
            }
        }
    );

    // Register session info listener for real-time updates
    FB.Event.subscribe('messenger_checkbox', sessionInfoListener);
}

/**
 * Process the response from embedded signup
 */
function processSignupResponse(authResponse) {
    console.log('Processing signup response:', authResponse);

    // The code needs to be exchanged for an access token on your server
    // For demo purposes, we'll show the code and prompt for manual token entry

    if (authResponse.code) {
        showStatus('Signup completed! Exchange code for access token.', 'success');

        // Show a prompt for manual token entry (in production, this would be server-side)
        showTokenExchangePrompt(authResponse.code);
    }
}

/**
 * Show prompt to exchange code for access token
 * In production, this should be done server-side for security
 */
function showTokenExchangePrompt(code) {
    const btn = document.getElementById('connect-btn');
    btn.classList.remove('loading');
    btn.disabled = false;

    // Create a modal for token entry
    const modal = document.createElement('div');
    modal.className = 'token-modal';
    modal.innerHTML = `
        <div class="modal-overlay" onclick="closeTokenModal()"></div>
        <div class="modal-content">
            <h3>Complete Connection</h3>
            <p>The signup was successful. To complete the connection, you need to exchange the code for an access token.</p>
            
            <div class="form-group">
                <label>Exchangeable Code (for server-side exchange)</label>
                <textarea readonly style="height: 80px; font-size: 0.75rem;">${code}</textarea>
            </div>
            
            <div class="form-group">
                <label>Access Token (paste your token here)</label>
                <input type="password" id="manual-token" placeholder="Enter your access token" />
                <small>Get this from your server after exchanging the code, or from Meta Developer Console for testing.</small>
            </div>
            
            <div class="form-group">
                <label>WABA ID</label>
                <input type="text" id="manual-waba" placeholder="Your WhatsApp Business Account ID" />
            </div>
            
            <div class="form-group">
                <label>Phone Number ID</label>
                <input type="text" id="manual-phone-id" placeholder="Your Phone Number ID" />
            </div>
            
            <div class="modal-actions">
                <button class="btn-secondary" onclick="closeTokenModal()">Cancel</button>
                <button class="btn-primary" onclick="completeManualConnection()">Connect</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Add modal styles
    addModalStyles();
}

/**
 * Complete connection with manually entered credentials
 */
function completeManualConnection() {
    const token = document.getElementById('manual-token').value.trim();
    const wabaId = document.getElementById('manual-waba').value.trim();
    const phoneId = document.getElementById('manual-phone-id').value.trim();

    if (!token) {
        showToast('Please enter an access token', 'error');
        return;
    }

    if (!wabaId || !phoneId) {
        showToast('Please enter WABA ID and Phone Number ID', 'error');
        return;
    }

    state.accessToken = token;
    state.wabaId = wabaId;
    state.phoneNumberId = phoneId;

    closeTokenModal();
    showConnectedView();
    fetchPhoneNumber();
}

/**
 * Close the token modal
 */
function closeTokenModal() {
    const modal = document.querySelector('.token-modal');
    if (modal) {
        modal.remove();
    }
    resetConnectButton();
}

/**
 * Fetch account details using the access token
 */
async function fetchAccountDetails() {
    showStatus('Fetching account details...', 'connecting');

    try {
        // Fetch WABA details
        const response = await fetch(
            `${CONFIG.API_BASE}/${CONFIG.API_VERSION}/me/whatsapp_business_accounts?access_token=${state.accessToken}`
        );

        const data = await response.json();

        if (data.data && data.data.length > 0) {
            state.wabaId = data.data[0].id;

            // Fetch phone numbers
            await fetchPhoneNumbers();

            showConnectedView();
        } else {
            throw new Error('No WhatsApp Business Account found');
        }
    } catch (error) {
        console.error('Error fetching account details:', error);
        showStatus(`Error: ${error.message}`, 'error');
        resetConnectButton();
    }
}

/**
 * Fetch phone numbers for the WABA
 */
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
        console.error('Error fetching phone numbers:', error);
    }
}

/**
 * Fetch phone number details
 */
async function fetchPhoneNumber() {
    try {
        const response = await fetch(
            `${CONFIG.API_BASE}/${CONFIG.API_VERSION}/${state.phoneNumberId}?fields=display_phone_number,verified_name&access_token=${state.accessToken}`
        );

        const data = await response.json();

        if (data.display_phone_number) {
            state.phoneNumber = data.display_phone_number;
            document.getElementById('phone-number').textContent = state.phoneNumber;
        }
    } catch (error) {
        console.error('Error fetching phone number:', error);
    }
}

// ============================================
// MESSAGE SENDING
// ============================================

/**
 * Send a WhatsApp message
 */
async function sendMessage() {
    const recipientNumber = document.getElementById('recipient-number').value.trim();
    const messageType = document.getElementById('message-type').value;

    if (!recipientNumber) {
        showToast('Please enter a recipient phone number', 'error');
        return;
    }

    // Clean phone number (remove spaces, dashes, etc.)
    const cleanNumber = recipientNumber.replace(/[^0-9]/g, '');

    const btn = document.getElementById('send-btn');
    btn.classList.add('loading');
    btn.disabled = true;

    try {
        let payload;

        if (messageType === 'text') {
            const messageText = document.getElementById('message-text').value.trim();

            if (!messageText) {
                showToast('Please enter a message', 'error');
                resetSendButton();
                return;
            }

            payload = {
                messaging_product: 'whatsapp',
                to: cleanNumber,
                type: 'text',
                text: {
                    preview_url: false,
                    body: messageText
                }
            };
        } else {
            const templateName = document.getElementById('template-name').value.trim();

            if (!templateName) {
                showToast('Please enter a template name', 'error');
                resetSendButton();
                return;
            }

            payload = {
                messaging_product: 'whatsapp',
                to: cleanNumber,
                type: 'template',
                template: {
                    name: templateName,
                    language: {
                        code: 'en'
                    }
                }
            };
        }

        const response = await fetch(
            `${CONFIG.API_BASE}/${CONFIG.API_VERSION}/${state.phoneNumberId}/messages`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${state.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            }
        );

        const data = await response.json();

        // Show response
        showApiResponse(data);

        if (data.messages && data.messages.length > 0) {
            showToast('Message sent successfully!', 'success');
        } else if (data.error) {
            showToast(`Error: ${data.error.message}`, 'error');
        }

    } catch (error) {
        console.error('Error sending message:', error);
        showToast(`Error: ${error.message}`, 'error');
        showApiResponse({ error: error.message });
    }

    resetSendButton();
}

/**
 * Show API response
 */
function showApiResponse(data) {
    const responseSection = document.getElementById('response-section');
    const responseEl = document.getElementById('api-response');

    responseSection.classList.remove('hidden');
    responseEl.textContent = JSON.stringify(data, null, 2);
}

// ============================================
// UI HELPERS
// ============================================

/**
 * Handle successful signup
 */
function handleSignupSuccess(message) {
    if (message.data) {
        state.wabaId = message.data.waba_id;
        state.phoneNumberId = message.data.phone_number_id;
    }
    showStatus('Connection successful!', 'success');
}

/**
 * Handle signup cancellation
 */
function handleSignupCancel() {
    showStatus('Signup cancelled', 'error');
    resetConnectButton();
    showToast('Connection cancelled', 'error');
}

/**
 * Handle signup error
 */
function handleSignupError(message) {
    showStatus(`Error: ${message.error_message || 'Unknown error'}`, 'error');
    resetConnectButton();
    showToast('Connection failed', 'error');
}

/**
 * Show status message
 */
function showStatus(message, type) {
    const section = document.getElementById('status-section');
    const indicator = document.getElementById('status-indicator');
    const text = document.getElementById('status-text');

    section.classList.remove('hidden');
    indicator.className = `status-indicator ${type}`;
    text.textContent = message;
}

/**
 * Reset connect button
 */
function resetConnectButton() {
    const btn = document.getElementById('connect-btn');
    btn.classList.remove('loading');
    btn.disabled = false;
}

/**
 * Reset send button
 */
function resetSendButton() {
    const btn = document.getElementById('send-btn');
    btn.classList.remove('loading');
    btn.disabled = false;
}

/**
 * Show connected view
 */
function showConnectedView() {
    state.connected = true;

    // Update UI with account info
    document.getElementById('waba-id').textContent = state.wabaId || '-';
    document.getElementById('phone-number-id').textContent = state.phoneNumberId || '-';
    document.getElementById('phone-number').textContent = state.phoneNumber || 'Loading...';
    document.getElementById('access-token').textContent = state.accessToken ?
        (state.accessToken.substring(0, 30) + '...' + state.accessToken.slice(-10)) : '-';

    // Switch views
    document.getElementById('connect-view').classList.remove('active');
    document.getElementById('connected-view').classList.add('active');

    // Save state to localStorage
    saveState();
}

/**
 * Disconnect account
 */
function disconnect() {
    if (confirm('Are you sure you want to disconnect your WhatsApp Business Account?')) {
        // Clear state
        state = {
            connected: false,
            accessToken: null,
            wabaId: null,
            phoneNumberId: null,
            phoneNumber: null,
            code: null
        };

        // Clear localStorage
        localStorage.removeItem('wabridge_state');

        // Switch views
        document.getElementById('connected-view').classList.remove('active');
        document.getElementById('connect-view').classList.add('active');

        // Reset status
        document.getElementById('status-section').classList.add('hidden');

        showToast('Account disconnected', 'success');
    }
}

/**
 * Copy to clipboard
 */
function copyToClipboard(elementId) {
    const element = document.getElementById(elementId);
    let text;

    if (elementId === 'access-token') {
        text = state.accessToken;
    } else {
        text = element.textContent;
    }

    navigator.clipboard.writeText(text).then(() => {
        showToast('Copied to clipboard!', 'success');
    }).catch(() => {
        showToast('Failed to copy', 'error');
    });
}

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

/**
 * Save state to localStorage
 */
function saveState() {
    localStorage.setItem('wabridge_state', JSON.stringify(state));
}

/**
 * Load state from localStorage
 */
function loadState() {
    const saved = localStorage.getItem('wabridge_state');
    if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.connected && parsed.accessToken) {
            state = parsed;
            showConnectedView();
        }
    }
}

/**
 * Add modal styles dynamically
 */
function addModalStyles() {
    if (document.getElementById('modal-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'modal-styles';
    styles.textContent = `
        .token-modal {
            position: fixed;
            inset: 0;
            z-index: 1001;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
        }
        
        .modal-overlay {
            position: absolute;
            inset: 0;
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(4px);
        }
        
        .modal-content {
            position: relative;
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: var(--radius-lg);
            padding: 2rem;
            max-width: 500px;
            width: 100%;
            max-height: 90vh;
            overflow-y: auto;
        }
        
        .modal-content h3 {
            margin-bottom: 0.5rem;
            font-size: 1.25rem;
        }
        
        .modal-content > p {
            color: var(--text-secondary);
            margin-bottom: 1.5rem;
            font-size: 0.9rem;
        }
        
        .modal-actions {
            display: flex;
            gap: 1rem;
            margin-top: 1.5rem;
        }
        
        .modal-actions button {
            flex: 1;
        }
        
        .btn-secondary {
            background: transparent;
            border: 1px solid var(--border-color);
            color: var(--text-primary);
            padding: 0.875rem 1.5rem;
            border-radius: var(--radius-md);
            cursor: pointer;
            font-size: 0.95rem;
            font-weight: 500;
            transition: var(--transition);
        }
        
        .btn-secondary:hover {
            border-color: var(--text-secondary);
        }
    `;
    document.head.appendChild(styles);
}

// ============================================
// MESSAGE TYPE TOGGLE
// ============================================
document.addEventListener('DOMContentLoaded', function () {
    // Load saved state
    loadState();

    // Message type toggle
    const messageTypeSelect = document.getElementById('message-type');
    if (messageTypeSelect) {
        messageTypeSelect.addEventListener('change', function () {
            const textGroup = document.getElementById('text-input-group');
            const templateGroup = document.getElementById('template-input-group');

            if (this.value === 'text') {
                textGroup.classList.remove('hidden');
                templateGroup.classList.add('hidden');
            } else {
                textGroup.classList.add('hidden');
                templateGroup.classList.remove('hidden');
            }
        });
    }
});


