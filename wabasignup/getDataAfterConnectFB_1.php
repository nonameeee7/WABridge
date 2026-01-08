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
?>