jQuery.getScript('https://connect.facebook.net/en_US/sdk.js', function () {
    FB.init({
        appId: '2704195743293039', // Facebook App ID
        cookie: true, // enable cookies
        xfbml: true, // parse social plugins on this page
        version: 'v20.0' //Graph API version
    });
});

jQuery('#connect_now').on('click', function (e) {
    showLoader();
    FB.login(function (response) {
        console.log(response);
        if (response.authResponse) {
            const code = response.authResponse.code;
            const appId = '2704195743293039';
            const appSecretId = '6a4cd52ef4b49c489b92642cc54de9b8';

            var params = {
                'client_id': appId, //app_id
                'client_secret': appSecretId, //App secret
                'code': code
            }

            $.ajax({
                type: "POST",
                url: '/api/exchange-token.php',
                contentType: 'application/json',
                data: JSON.stringify({
                    code: code,
                    // When using FB.login, the redirect_uri is the current page URL
                    redirect_uri: window.location.href.split('#')[0]
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

                    sendDataToParent({
                        appId: appId,
                        accessToken: accessToken,
                        whatsappBusinessAccountId: whatsappBusinessAccountId,
                        phoneNumberId: phoneNumberId,
                        formattedPhoneNumber: formattedPhoneNumber,
                        phoneNumbers: response.phone_numbers || []
                    });
                    hideLoader();
                    window.close();
                },
                error: function (xhr, status, error) {
                    console.error('Token exchange error:', xhr.responseText);
                    hideLoader();
                    alert('Connection failed: ' + (xhr.responseJSON?.error || error));
                }
            });
        } else {
            hideLoader();
            if (response.error) {
                alert('Login failed: ' + response.error.message);
            } else {
                alert('Login failed');
            }
        }
    },
        {
            // config_id: '1264392078061570',
            // response_type: 'code',
            // override_default_response_type: true,
            // scope: 'public_profile, business_management, whatsapp_business_management, whatsapp_business_messaging, catalog_management',
            // extras: {
            //     "feature": "whatsapp_embedded_signup",
            //     "sessionInfoVersion": 3  //  Receive Session Logging Info
            // }
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
// config_id: "1264392078061570",
// response_type: "code",
// override_default_response_type: true,
// scope: "public_profile, business_management, whatsapp_business_management, whatsapp_business_messaging, catalog_management",
// extras: {
//   setup: {},
//   featureType: "whatsapp_business_app_onboarding",
//   sessionInfoVersion: "3"
// }

function sendDataToParent(data) {
    // Check if window.opener exists (meaning the parent window is open)
    if (window.opener) {
        // Use postMessage to securely send the data to the parent window
        window.opener.postMessage(data, '*'); // Use '*' to allow any origin, but it's better to specify the parent's origin if known
    }
}

function showLoader() {
    $('#loader').show();  // Display the loader
}

function hideLoader() {
    $('#loader').hide();  // Hide the loader
}