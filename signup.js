/**
 * WABridge - WhatsApp Embedded Signup
 * Based on CTWhatsAppBusinessFB.js
 */

// Initialize Facebook SDK
jQuery.getScript('https://connect.facebook.net/en_US/sdk.js', function () {
    FB.init({
        appId: '2704195743293039', // Facebook App ID
        cookie: true, // enable cookies
        xfbml: true, // parse social plugins on this page
        version: 'v20.0' //Graph API version
    });
    console.log('Facebook SDK initialized');
});

// Connect button handler - uses #connect-btn from signup.html
jQuery('#connect-btn').on('click', function (e) {
    showLoader();
    FB.login(function (response) {
        console.log('FB.login response:', response);
        if (response.authResponse) {
            const code = response.authResponse.code;
            const appId = '2704195743293039';

            $.ajax({
                type: "POST",
                url: '/api/exchange-token',
                contentType: 'application/json',
                data: JSON.stringify({
                    code: code
                }),
                dataType: 'json',
                success: function (response) {
                    console.log('Token exchange response:', response);
                    var accessToken = response.access_token;
                    var whatsappBusinessAccountId = response.whatsapp_business_account_id;

                    // Handle phone numbers array
                    var phoneNumberId = null;
                    var formattedPhoneNumber = null;
                    if (response.phone_numbers && response.phone_numbers.length > 0) {
                        phoneNumberId = response.phone_numbers[0].id;
                        formattedPhoneNumber = response.phone_numbers[0].formatted_phone_number || response.phone_numbers[0].display_phone_number;
                    }

                    // Send data to parent window
                    sendDataToParent({
                        appId: appId,
                        accessToken: accessToken,
                        whatsappBusinessAccountId: whatsappBusinessAccountId,
                        phoneNumberId: phoneNumberId,
                        formattedPhoneNumber: formattedPhoneNumber,
                        phoneNumbers: response.phone_numbers || []
                    });

                    // Update UI and show success
                    hideLoader();
                    showSuccessView(accessToken, whatsappBusinessAccountId, phoneNumberId, formattedPhoneNumber);
                },
                error: function (xhr, status, error) {
                    console.error('Token exchange error:', xhr.responseText);
                    hideLoader();
                    showStatus('error', 'Connection failed: ' + (xhr.responseJSON?.error || error));
                }
            });
        } else {
            hideLoader();
            if (response.error) {
                showStatus('error', 'Login failed: ' + response.error.message);
            } else {
                showStatus('error', 'Login was cancelled');
            }
        }
    },
        {
            config_id: "879357534817865",
            response_type: "code",
            override_default_response_type: true,
            scope: "public_profile, business_management, whatsapp_business_management, whatsapp_business_messaging, catalog_management",
            extras: {
                setup: {},
                featureType: "whatsapp_business_app_onboarding",
                sessionInfoVersion: "3"
            }
        });
});

// Send data to parent window (CRM)
function sendDataToParent(data) {
    if (window.opener) {
        window.opener.postMessage(data, '*');
        console.log('Data sent to parent window:', data);
    }
}

// Show loader
function showLoader() {
    $('#loader').removeClass('hidden').show();
}

// Hide loader
function hideLoader() {
    $('#loader').addClass('hidden').hide();
}

// Show status message
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

// Show success view with credentials
function showSuccessView(accessToken, wabaId, phoneNumberId, phoneNumber) {
    // Hide main card
    $('.card:first').addClass('hidden');

    // Update credential values
    $('#waba-id').text(wabaId || '-');
    $('#phone-id').text(phoneNumberId || '-');
    $('#phone-number').text(phoneNumber || '-');
    $('#access-token').text(accessToken ? accessToken.substring(0, 30) + '...' : '-');

    // Show success card
    $('#success-card').removeClass('hidden');
}

// Copy value to clipboard
function copyValue(elementId) {
    let text;
    const $el = $('#' + elementId);

    if (elementId === 'access-token') {
        // For access token, we need the full value
        text = window.fullAccessToken;
    } else {
        text = $el.text();
    }

    if (text && text !== '-') {
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

// Close window
function closeWindow() {
    window.close();
}

// Store full access token for copying
window.fullAccessToken = null;

// Initialize on document ready
$(document).ready(function () {
    hideLoader();
    console.log('WABridge Signup initialized');
});
