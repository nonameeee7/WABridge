<?php
// API endpoint for WhatsApp OAuth token exchange
// This runs on Vercel using vercel-php runtime

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle CORS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Get input
$input = json_decode(file_get_contents('php://input'), true);

// If JSON parsing fails, try form data
if (!$input) {
    $input = $_POST;
}

$clientId = $input['client_id'] ?? '2704195743293039';
$clientSecret = $input['client_secret'] ?? getenv('FB_APP_SECRET') ?: '494585bd885e60111e50ce31dcf2ba7a';
$code = $input['code'] ?? null;

if (!$code) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing authorization code']);
    exit;
}

$appAccessToken = $clientId . '|' . $clientSecret;
$apiUrl = 'https://graph.facebook.com/v20.0/';

// Step 1: Exchange code for short-lived token
$accessTokenURL = $apiUrl . 'oauth/access_token?' . http_build_query([
    'client_id' => $clientId,
    'client_secret' => $clientSecret,
    'code' => $code
]);

$responseAccessToken = executeGetCurl($accessTokenURL);
if (!isset($responseAccessToken['access_token'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Failed to exchange code', 'details' => $responseAccessToken]);
    exit;
}
$accessToken = $responseAccessToken['access_token'];

// Step 2: Exchange for long-lived token
$refreshTokenApiUrl = $apiUrl . 'oauth/access_token?' . http_build_query([
    'grant_type' => 'fb_exchange_token',
    'client_id' => $clientId,
    'client_secret' => $clientSecret,
    'fb_exchange_token' => $accessToken
]);

$resultRefreshTokenApiUrl = executeGetCurl($refreshTokenApiUrl);
if (isset($resultRefreshTokenApiUrl['access_token'])) {
    $accessToken = $resultRefreshTokenApiUrl['access_token'];
}

// Step 3: Get WABA ID from debug_token
$getBusinessIdUrl = $apiUrl . 'debug_token?input_token=' . $accessToken . '&access_token=' . $appAccessToken;
$responseBusinessId = executeGetCurl($getBusinessIdUrl);

$whatsAppBusinessAccountIds = [];
if (isset($responseBusinessId['data']['granular_scopes'])) {
    foreach ($responseBusinessId['data']['granular_scopes'] as $scope) {
        if (isset($scope['target_ids'])) {
            foreach ($scope['target_ids'] as $targetId) {
                $whatsAppBusinessAccountIds[] = $targetId;
            }
        }
    }
}

$whatsAppBusinessAccountId = !empty($whatsAppBusinessAccountIds) ? $whatsAppBusinessAccountIds[0] : null;

if (!$whatsAppBusinessAccountId) {
    http_response_code(400);
    echo json_encode(['error' => 'No WhatsApp Business Account found']);
    exit;
}

// Step 4: Get phone numbers
$getBusinessProfileUrl = $apiUrl . $whatsAppBusinessAccountId . '/phone_numbers?access_token=' . $accessToken;
$responseBusinessProfile = executeGetCurl($getBusinessProfileUrl);

$phoneNumberId = null;
$formattedNumber = null;

if (isset($responseBusinessProfile['data'][0]['display_phone_number'])) {
    $phoneNumber = $responseBusinessProfile['data'][0]['display_phone_number'];
    $phoneNumberId = $responseBusinessProfile['data'][0]['id'];
    $formattedNumber = preg_replace('/\D/', '', $phoneNumber);
}

// Step 5: Register phone number
if ($phoneNumberId) {
    $getRegisterPhoneNumberUrl = $apiUrl . $phoneNumberId . '/register';
    $registerPhoneNumberData = ['messaging_product' => 'whatsapp', 'pin' => '212834'];
    executePostCurl($getRegisterPhoneNumberUrl, $registerPhoneNumberData, $accessToken);
}

// Step 6: Subscribe to webhooks
if ($whatsAppBusinessAccountId) {
    $getSubscribeWebhookUrl = $apiUrl . $whatsAppBusinessAccountId . '/subscribed_apps';
    executePostCurl($getSubscribeWebhookUrl, '', $accessToken);
    
    // Subscribe with specific fields
    subscribeWhatsappWebhook($whatsAppBusinessAccountId, $accessToken);
}

// Return response
$dataArray = [
    'access_token' => $accessToken,
    'whatsapp_business_account_id' => $whatsAppBusinessAccountId,
    'phone_number_id' => $phoneNumberId,
    'formatted_phone_number' => $formattedNumber
];

echo json_encode($dataArray);
exit;

// Helper functions
function executeGetCurl($url) {
    $curl = curl_init();
    curl_setopt_array($curl, [
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_ENCODING => "",
        CURLOPT_MAXREDIRS => 10,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
        CURLOPT_SSL_VERIFYHOST => 0,
        CURLOPT_SSL_VERIFYPEER => 0,
        CURLOPT_CUSTOMREQUEST => "GET",
        CURLOPT_USERAGENT => 'Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.8.1.13) Gecko/20080311 Firefox/2.0.0.13',
    ]);
    
    $result = curl_exec($curl);
    curl_close($curl);
    return json_decode($result, true);
}

function executePostCurl($url, $data, $accessToken) {
    $curl = curl_init();
    curl_setopt_array($curl, [
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_ENCODING => "",
        CURLOPT_MAXREDIRS => 10,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
        CURLOPT_SSL_VERIFYHOST => 0,
        CURLOPT_SSL_VERIFYPEER => 0,
        CURLOPT_CUSTOMREQUEST => "POST",
        CURLOPT_POSTFIELDS => is_array($data) ? json_encode($data) : $data,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $accessToken
        ],
    ]);
    
    $result = curl_exec($curl);
    curl_close($curl);
    return $result;
}

function subscribeWhatsappWebhook($wabaId, $accessToken) {
    $url = "https://graph.facebook.com/v21.0/{$wabaId}/subscribed_apps";
    $fields = ['subscribed_fields' => 'messages,message_template_status_update'];
    
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $url . '?' . http_build_query($fields),
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => ['Authorization: Bearer ' . $accessToken],
        CURLOPT_RETURNTRANSFER => true,
    ]);
    
    $response = curl_exec($ch);
    curl_close($ch);
    return $response;
}
?>
