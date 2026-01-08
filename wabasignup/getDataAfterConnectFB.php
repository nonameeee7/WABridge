<?php
$clientId = $_POST['client_id'];
$clientSecret = $_POST['client_secret'];
$code = $_POST['code'];

$appAccessToken = $clientId . '|' . $clientSecret;
$apiUrl = 'https://graph.facebook.com/v17.0/';

$accessTokenURL = $apiUrl.'oauth/access_token?';
$accessTokenURL .= 'client_id='.$clientId.'&client_secret='.$clientSecret.'&code='.$code;

$responseAccessToken = executeGetCurl($accessTokenURL);
$accessToken = $responseAccessToken['access_token'];

$refreshTokenApiUrl = 'https://graph.facebook.com/v17.0/oauth/access_token?';
$params = http_build_query([
      'grant_type' => 'fb_exchange_token',
      'client_id' => $clientId,
      'client_secret' => $clientSecret,
      'fb_exchange_token' => $accessToken,
    ]);

$refreshTokenApiUrl = $refreshTokenApiUrl . $params;
$resultRefreshTokenApiUrl = executeGetCurl($refreshTokenApiUrl);
$accessToken = $resultRefreshTokenApiUrl['access_token'];   

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
}//end of if

$whatsAppBusinessAccountId = !empty($whatsAppBusinessAccountIds) ? $whatsAppBusinessAccountIds[0] : null; 
$getBusinessProfileUrl = $apiUrl . $whatsAppBusinessAccountId.'/phone_numbers?access_token=' . $accessToken;
$responseBusinessProfile = executeGetCurl($getBusinessProfileUrl);

if (isset($responseBusinessProfile['data'][0]['display_phone_number'])) {
    $phoneNumber = $responseBusinessProfile['data'][0]['display_phone_number'];
    $phoneNumberId = $responseBusinessProfile['data'][0]['id'];
    $formattedNumber = preg_replace('/\D/', '', $phoneNumber);
}//end of if

$dataArray = [
    'access_token' => $accessToken,
    'whatsapp_business_account_id' => $whatsAppBusinessAccountId,
    'phone_number_id' => $phoneNumberId,
    'formatted_phone_number' => $formattedNumber        
];

$getRegisterPhoneNumberUrl = $apiUrl.$phoneNumberId.'/register';    
$registerPhoneNumberData = array('messaging_product' => 'whatsapp', 'pin' => '212834');

$resultRegisterPhoneNumber = executePostCurl($getRegisterPhoneNumberUrl, $registerPhoneNumberData, $accessToken);

$getSubscribeWebhookUrl = $apiUrl . $whatsAppBusinessAccountId.'/subscribed_apps';
$resultSubscribeWebhook = executePostCurl($getSubscribeWebhookUrl, '', $accessToken);

$curlGetSubscribeWebhook = curl_init();
        curl_setopt_array($curlGetSubscribeWebhook, array(
            CURLOPT_URL => $getSubscribeWebhookUrl,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_ENCODING => "",
            CURLOPT_MAXREDIRS => 10,
            CURLOPT_TIMEOUT => 10,
            CURLOPT_CONNECTTIMEOUT => 0,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
            CURLOPT_SSL_VERIFYHOST => 0,
            CURLOPT_SSL_VERIFYPEER => 0,
            CURLOPT_CUSTOMREQUEST => "GET",
            CURLOPT_HTTPHEADER => array(
                'Authorization: Bearer ' . $accessToken,
                'Content-Type: application/json',
            ),
            CURLOPT_USERAGENT => 'Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.8.1.13) Gecko/20080311 Firefox/2.0.0.13',
        ));

$resultGetSubscribeWebhook = curl_exec($curlGetSubscribeWebhook);
$responseGetSubscribeWebhook = json_decode($resultGetSubscribeWebhook, true);
if (subscribeWhatsappWebhook($whatsAppBusinessAccountId, $accessToken)) {
    // echo "✅ Webhook subscribed successfully!";
} else {
    // echo "❌ Failed to subscribe webhook. Check whatsapp_subscription_log.txt for details.";
    file_put_contents('whatsapp_subscription_log.txt', date('Y-m-d H:i:s')."❌ Failed to subscribe webhook for $whatsAppBusinessAccountId ." . PHP_EOL, FILE_APPEND);
}

echo json_encode($dataArray); 
die();

function executeGetCurl($url){
    $curl = curl_init();
    curl_setopt_array($curl, array(
    CURLOPT_URL => $url,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_ENCODING => "",
    CURLOPT_MAXREDIRS => 10,
    CURLOPT_TIMEOUT => 10,
    CURLOPT_CONNECTTIMEOUT => 0,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
    CURLOPT_SSL_VERIFYHOST => 0,
    CURLOPT_SSL_VERIFYPEER => 0,
    CURLOPT_CUSTOMREQUEST => "GET",
    CURLOPT_USERAGENT=>'Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.8.1.13) Gecko/20080311 Firefox/2.0.0.13',
    ));

    $result = curl_exec($curl);
    $response = json_decode($result, true);
    return $response;
}//end of curl function

function executePostCurl($getUrl, $data, $accessToken){
    $curl = curl_init();
    curl_setopt_array($curl, array(
        CURLOPT_URL => $getUrl,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_ENCODING => "",
        CURLOPT_MAXREDIRS => 10,
        CURLOPT_TIMEOUT => 10,
        CURLOPT_CONNECTTIMEOUT => 0,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
        CURLOPT_SSL_VERIFYHOST => 0,
        CURLOPT_SSL_VERIFYPEER => 0,
        CURLOPT_CUSTOMREQUEST => "POST",
        CURLOPT_POSTFIELDS => json_encode($data), // Convert data array to JSON
        CURLOPT_HTTPHEADER => array(
            'Content-Type: application/json',
            'Authorization: Bearer ' . $accessToken
        ),
    ));
    $result = curl_exec($curl);
    return $result;
}//end of curl function
function subscribeWhatsappWebhook($wabaId, $accessToken) {
    $url = "https://graph.facebook.com/v21.0/{$wabaId}/subscribed_apps";

    // Fields you want webhook events for
    $fields = [
        'subscribed_fields' => 'messages,message_template_status_update'
    ];

    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $url . '?' . http_build_query($fields),
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $accessToken
        ],
        CURLOPT_RETURNTRANSFER => true,
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    // Optional logging for debugging
    // file_put_contents('whatsapp_subscription_log1.txt', date('Y-m-d H:i:s') . " | WABA: {$wabaId} | HTTP: {$httpCode} | Response: {$response}\n", FILE_APPEND);

    if ($httpCode === 200) {
        $result = json_decode($response, true);
        if (isset($result['success']) && $result['success'] === true) {
            return true; // ✅ Subscription success
        }
    }
    return false; // ❌ Failed
}
?>