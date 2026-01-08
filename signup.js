/**
 * WABridge - WhatsApp Embedded Signup
 * 
 * Handles Facebook SDK initialization and WhatsApp Business API connection flow
 */

// ============================================
// CONFIGURATION
// ============================================
const CONFIG = {
    APP_ID: '2704195743293039',
    CONFIG_ID: '879357534817865',
    API_VERSION: 'v20.0',
    // API endpoint for token exchange (Vercel serverless function)
    TOKEN_EXCHANGE_URL: '/api/exchange-token'
};

// ============================================
// STORED CREDENTIALS
// ============================================
let credentials = {
    accessToken: null,
    wabaId: null,
    phoneNumberId: null,
    phoneNumber: null
};

// ============================================
// FACEBOOK SDK INITIALIZATION
// ============================================
$.getScript('https://connect.facebook.net/en_US/sdk.js', function () {
    FB.init({
        appId: CONFIG.APP_ID,
        cookie: true,
        xfbml: true,
        version: CONFIG.API_VERSION
    });
    console.log('Facebook SDK initialized');
});

// ============================================
// CONNECT BUTTON HANDLER (MANUAL FLOW)
// ============================================
$('#connect-btn').on('click', function (e) {
    e.preventDefault();

    // Show loader
    showLoader();
    hideStatus();

    // Construct the Manual OAuth URL
    // We MUST use a specific redirect_uri in the manual flow
    const redirectUri = window.location.href.split('?')[0];
    const scope = 'public_profile,business_management,whatsapp_business_management,whatsapp_business_messaging,catalog_management';

    const authUrl = `https://www.facebook.com/${CONFIG.API_VERSION}/dialog/oauth?` +
        `client_id=${CONFIG.APP_ID}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_type=code` +
        `&config_id=${CONFIG.CONFIG_ID}` +
        `&scope=${scope}` +
        `&state=signup_init`; // State parameter for security/tracking

    console.log('Redirecting to Facebook OAuth:', authUrl);

    // Redirect the current window to Facebook
    window.location.href = authUrl;
});

// Check for Authorization Code on Page Load
$(document).ready(function () {
    // Check if we have 'code' in the URL query params
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');

    if (code) {
        console.log('Authorization code found:', code);
        // Exchange code for token
        exchangeCodeForToken(code);

        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
    } else if (error) {
        const errorMsg = urlParams.get('error_message') || 'Login failed';
        showStatus('error', errorMsg);
    }
});

// ============================================
// TOKEN EXCHANGE
// ============================================
function exchangeCodeForToken(code) {
    showStatus('loading', 'Exchanging authorization code...');

    // Use exactly the same redirect_uri as in the OAuth request
    const redirectUri = window.location.href.split('?')[0];

    $.ajax({
        type: 'POST',
        url: CONFIG.TOKEN_EXCHANGE_URL,
        contentType: 'application/json',
        data: JSON.stringify({
            code: code,
            redirect_uri: redirectUri
        }),
        dataType: 'json',
        success: function (response) {
            console.log('Token exchange response:', response);

            if (response.error) {
                hideLoader();
                showStatus('error', response.error);
                return;
            }

            // Store credentials
            credentials.accessToken = response.access_token;
            credentials.wabaId = response.whatsapp_business_account_id;
            credentials.phoneNumberId = response.phone_number_id;
            credentials.phoneNumber = response.formatted_phone_number;

            // Send data to parent window
            sendDataToParent({
                appId: CONFIG.APP_ID,
                accessToken: credentials.accessToken,
                whatsappBusinessAccountId: credentials.wabaId,
                phoneNumberId: credentials.phoneNumberId,
                formattedPhoneNumber: credentials.phoneNumber
            });

            // Show success view
            hideLoader();
            showSuccessView();
        },
        error: function (xhr, status, error) {
            console.error('Token exchange error:', xhr.responseText);
            hideLoader();

            // Try to parse error response
            let errorMsg = 'Failed to exchange token';
            try {
                const resp = JSON.parse(xhr.responseText);
                if (resp.error) {
                    errorMsg = resp.error;
                }
            } catch (e) {
                errorMsg = error || 'Unknown error';
            }

            showStatus('error', errorMsg);
        }
    });
}

// ============================================
// DIRECT TOKEN HANDLING (Fallback)
// ============================================
function handleDirectToken(accessToken) {
    showStatus('loading', 'Fetching account details...');

    // Fetch WABA details
    $.ajax({
        type: 'GET',
        url: `https://graph.facebook.com/${CONFIG.API_VERSION}/me/whatsapp_business_accounts`,
        data: { access_token: accessToken },
        dataType: 'json',
        success: function (response) {
            if (response.data && response.data.length > 0) {
                credentials.accessToken = accessToken;
                credentials.wabaId = response.data[0].id;

                // Fetch phone numbers
                fetchPhoneNumbers(accessToken, credentials.wabaId);
            } else {
                hideLoader();
                showStatus('error', 'No WhatsApp Business Account found');
            }
        },
        error: function (xhr, status, error) {
            hideLoader();
            showStatus('error', 'Failed to fetch account: ' + error);
        }
    });
}

function fetchPhoneNumbers(accessToken, wabaId) {
    $.ajax({
        type: 'GET',
        url: `https://graph.facebook.com/${CONFIG.API_VERSION}/${wabaId}/phone_numbers`,
        data: { access_token: accessToken },
        dataType: 'json',
        success: function (response) {
            if (response.data && response.data.length > 0) {
                credentials.phoneNumberId = response.data[0].id;
                credentials.phoneNumber = response.data[0].display_phone_number;
            }

            // Send data to parent window
            sendDataToParent({
                appId: CONFIG.APP_ID,
                accessToken: credentials.accessToken,
                whatsappBusinessAccountId: credentials.wabaId,
                phoneNumberId: credentials.phoneNumberId,
                formattedPhoneNumber: credentials.phoneNumber
            });

            hideLoader();
            showSuccessView();
        },
        error: function () {
            hideLoader();
            showSuccessView(); // Show success even if phone fetch fails
        }
    });
}

// ============================================
// PARENT WINDOW COMMUNICATION
// ============================================
function sendDataToParent(data) {
    // Check if window.opener exists (meaning the parent window is open)
    if (window.opener) {
        // Use postMessage to securely send the data to the parent window
        window.opener.postMessage(data, '*');
        console.log('Data sent to parent window:', data);
    } else {
        console.log('No parent window to send data to');
    }
}

// ============================================
// UI HELPERS
// ============================================
function showLoader() {
    $('#loader').removeClass('hidden');
}

function hideLoader() {
    $('#loader').addClass('hidden');
}

function showStatus(type, message) {
    const $status = $('#status-message');
    const $icon = $('#status-icon');
    const $text = $('#status-text');

    $status.removeClass('hidden success error loading').addClass(type);

    if (type === 'success') {
        $icon.text('✓');
    } else if (type === 'error') {
        $icon.text('✕');
    } else if (type === 'loading') {
        $icon.text('⟳');
    }

    $text.text(message);
}

function hideStatus() {
    $('#status-message').addClass('hidden');
}

function showSuccessView() {
    // Hide main card
    $('.card:first').addClass('hidden');

    // Update credential values
    $('#waba-id').text(credentials.wabaId || '-');
    $('#phone-id').text(credentials.phoneNumberId || '-');
    $('#phone-number').text(credentials.phoneNumber || '-');
    $('#access-token').text(credentials.accessToken ?
        credentials.accessToken.substring(0, 30) + '...' : '-');

    // Show success card
    $('#success-card').removeClass('hidden');
}

function copyValue(elementId) {
    let text;

    if (elementId === 'access-token') {
        text = credentials.accessToken;
    } else if (elementId === 'waba-id') {
        text = credentials.wabaId;
    } else if (elementId === 'phone-id') {
        text = credentials.phoneNumberId;
    } else if (elementId === 'phone-number') {
        text = credentials.phoneNumber;
    }

    if (text) {
        navigator.clipboard.writeText(text).then(function () {
            alert('Copied to clipboard!');
        }).catch(function () {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            alert('Copied to clipboard!');
        });
    }
}

function closeWindow() {
    window.close();
}

// ============================================
// INITIALIZATION
// ============================================
$(document).ready(function () {
    // Hide loader on page load
    hideLoader();

    console.log('WABridge Signup initialized');
    console.log('App ID:', CONFIG.APP_ID);
    console.log('Config ID:', CONFIG.CONFIG_ID);
});
