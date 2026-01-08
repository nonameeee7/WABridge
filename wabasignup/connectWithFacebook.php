<?php
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: GET, POST");
    header("Access-Control-Allow-Headers: Content-Type");
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Connect WhatsApp Business API</title>
    <style>
        /* Basic Reset */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: Arial, sans-serif;
        }
        body {
            background-color: #f4f6f8;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
        }
        .container {
            max-width: 500px;
            background-color: #fff;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            text-align: center;
        }
        h3 {
            font-size: 1.8rem;
            color: #333;
            margin-bottom: 15px;
        }
        p {
            color: #555;
            line-height: 1.6;
            font-size: 1rem;
            margin-bottom: 20px;
        }
        .note {
            color: #333;
            font-size: 0.9rem;
            background-color: #f9f9f9;
            padding: 10px;
            border-radius: 4px;
            margin-top: 15px;
        }
        .button-container {
            text-align: center;
            margin-top: 20px;
        }
        .button-container button {
            background-color: #007bff;
            color: white;
            padding: 12px 25px;
            border: none;
            border-radius: 5px;
            font-size: 1rem;
            cursor: pointer;
            transition: background-color 0.3s;
        }
        .button-container button:hover {
            background-color: #0056b3;
        }
        #loader {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 9999; /* Ensure the loader is above all content */
            display: none; /* Initially hidden */
        }

        .spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #3498db;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            animation: spin 2s linear infinite;
        }

        /* Animation for the spinner */
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

    </style>
</head>
<body>
    <div class="container">
        <div id="loader" style="display: none;">
            <div class="spinner"></div>
        </div>
        <h3>Connect WhatsApp Business API</h3>
        <p>By clicking the button below, you're authorizing <strong>www.saleshiker.com</strong> to connect to your META account to add a WhatsApp Number.</p>
        <div class="note">
            <strong>Note:</strong> Saleshiker.com doesn't store any personal information of customers.
        </div>
        <div class="button-container">
            <button type="button" id="connect_now">Connect Now</button>
        </div>
    </div>
</body>
</html>
    
<script type="text/javascript" src="/jquery.min.js"></script>
<script type="text/javascript" src="/CTWhatsAppBusinessFB.js"></script>