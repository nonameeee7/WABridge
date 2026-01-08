/**
 * WABridge - Token Exchange API (Vercel Serverless Function)
 * 
 * Exchanges the authorization code from Facebook Embedded Signup for an access token
 * and fetches WhatsApp Business Account details.
 */

// ============================================
// CONFIGURATION
// ============================================
const APP_ID = '2704195743293039';
const APP_SECRET = process.env.FB_APP_SECRET; // Set in Vercel Environment Variables
const API_VERSION = 'v20.0';
const API_URL = `https://graph.facebook.com/${API_VERSION}`;

// ============================================
// VERCEL SERVERLESS HANDLER
// ============================================
export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight request
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only allow POST
    if (req.method !== 'POST' && req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Get the code from request
        let code = null;

        if (req.body) {
            // Handle JSON body or form-urlencoded
            if (typeof req.body === 'string') {
                const parsed = JSON.parse(req.body);
                code = parsed.code;
            } else {
                code = req.body.code;
            }
        }

        // Also check query params
        if (!code && req.query) {
            code = req.query.code;
        }

        // We MUST use the one configured in Meta App Settings, regardless of what the client sent
        redirectUri = 'https://wabridge.vercel.app/';

        if (!code) {
            return res.status(400).json({ error: 'Missing authorization code' });
        }

        // Check if app secret is configured
        if (!APP_SECRET) {
            return res.status(500).json({
                error: 'FB_APP_SECRET environment variable not set in Vercel'
            });
        }

        // Step 1: Exchange code for short-lived access token
        const shortLivedToken = await exchangeCodeForToken(code, redirectUri);
        if (!shortLivedToken) {
            return res.status(400).json({ error: 'Failed to exchange code for access token' });
        }

        // Step 2: Exchange for long-lived token
        const accessToken = await getLongLivedToken(shortLivedToken);

        // Step 3: Get WABA ID from debug_token
        const wabaId = await getWabaId(accessToken);
        if (!wabaId) {
            return res.status(400).json({ error: 'No WhatsApp Business Account found in permissions' });
        }

        // Step 4: Get phone numbers from WABA
        const phoneData = await getPhoneNumbers(accessToken, wabaId);

        // Step 5: Register phone number (if exists)
        if (phoneData.phoneNumberId) {
            await registerPhoneNumber(accessToken, phoneData.phoneNumberId);
        }

        // Step 6: Subscribe to webhooks
        await subscribeToWebhooks(accessToken, wabaId);

        // Return credentials
        return res.status(200).json({
            access_token: accessToken,
            whatsapp_business_account_id: wabaId,
            phone_number_id: phoneData.phoneNumberId,
            formatted_phone_number: phoneData.formattedPhoneNumber
        });

    } catch (error) {
        console.error('Token exchange error:', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

async function exchangeCodeForToken(code, redirectUri) {
    // Build URL with optional redirect_uri
    let url = `${API_URL}/oauth/access_token?client_id=${APP_ID}&client_secret=${APP_SECRET}&code=${encodeURIComponent(code)}`;

    // Add redirect_uri if provided
    if (redirectUri) {
        url += `&redirect_uri=${encodeURIComponent(redirectUri)}`;
    }

    // Debug log (masking secret)
    console.log('Exchanging code for token with redirect_uri:', redirectUri);
    const debugUrl = url.replace(APP_SECRET, 'xxxx');
    console.log('Exchange URL:', debugUrl);

    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
        console.error('Meta API Error:', data.error);
        throw new Error(data.error.message || 'Failed to exchange code');
    }

    return data.access_token;
}

async function getLongLivedToken(shortLivedToken) {
    const url = `${API_URL}/oauth/access_token?grant_type=fb_exchange_token&client_id=${APP_ID}&client_secret=${APP_SECRET}&fb_exchange_token=${shortLivedToken}`;

    const response = await fetch(url);
    const data = await response.json();

    return data.access_token || shortLivedToken;
}

async function getWabaId(accessToken) {
    const appAccessToken = `${APP_ID}|${APP_SECRET}`;
    const url = `${API_URL}/debug_token?input_token=${accessToken}&access_token=${appAccessToken}`;

    const response = await fetch(url);
    const data = await response.json();

    const wabaIds = [];
    if (data.data?.granular_scopes) {
        for (const scope of data.data.granular_scopes) {
            if (scope.target_ids) {
                wabaIds.push(...scope.target_ids);
            }
        }
    }

    return wabaIds[0] || null;
}

async function getPhoneNumbers(accessToken, wabaId) {
    const url = `${API_URL}/${wabaId}/phone_numbers?access_token=${accessToken}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.data && data.data[0]) {
        const phone = data.data[0];
        return {
            phoneNumberId: phone.id,
            formattedPhoneNumber: phone.display_phone_number?.replace(/\D/g, '') || null
        };
    }

    return { phoneNumberId: null, formattedPhoneNumber: null };
}

async function registerPhoneNumber(accessToken, phoneNumberId) {
    const url = `${API_URL}/${phoneNumberId}/register`;

    try {
        await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messaging_product: 'whatsapp',
                pin: '212834'
            })
        });
    } catch (error) {
        console.log('Phone registration error (may be already registered):', error.message);
    }
}

async function subscribeToWebhooks(accessToken, wabaId) {
    const url = `${API_URL}/${wabaId}/subscribed_apps?subscribed_fields=messages,message_template_status_update`;

    try {
        await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
    } catch (error) {
        console.log('Webhook subscription error:', error.message);
    }
}
