const BASE = process.env.PAYPAL_API_BASE ?? 'https://api-m.sandbox.paypal.com';

async function getAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !secret || clientId.includes('placeholder')) {
    throw new Error('PayPal credentials not configured. Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET in .env');
  }

  const credentials = Buffer.from(`${clientId}:${secret}`).toString('base64');
  const res = await fetch(`${BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${credentials}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) throw new Error(`PayPal auth failed: ${res.status}`);
  const data = await res.json() as { access_token: string };
  return data.access_token;
}

export async function createPayPalOrder(invoiceId: string, amount: number, currency: string) {
  const token = await getAccessToken();
  const res = await fetch(`${BASE}/v2/checkout/orders`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{
        reference_id: invoiceId,
        amount: { currency_code: currency.toUpperCase(), value: amount.toFixed(2) },
      }],
      application_context: { return_url: `${process.env.APP_BASE_URL}/payments/paypal/return`, cancel_url: `${process.env.APP_BASE_URL}/payments/paypal/cancel` },
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PayPal create order failed: ${err}`);
  }
  return res.json() as Promise<{ id: string; links: { rel: string; href: string }[] }>;
}

export async function capturePayPalOrder(orderId: string) {
  const token = await getAccessToken();
  const res = await fetch(`${BASE}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PayPal capture failed: ${err}`);
  }
  return res.json();
}

export async function refundPayPalCapture(captureId: string, amount: number, currency: string) {
  const token = await getAccessToken();
  const res = await fetch(`${BASE}/v2/payments/captures/${captureId}/refund`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: { value: amount.toFixed(2), currency_code: currency.toUpperCase() } }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PayPal refund failed: ${err}`);
  }
  return res.json();
}

export async function verifyPayPalWebhook(
  webhookId: string,
  headers: Record<string, string>,
  body: string,
): Promise<boolean> {
  const token = await getAccessToken();
  const res = await fetch(`${BASE}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      webhook_id: webhookId,
      transmission_id: headers['paypal-transmission-id'],
      transmission_time: headers['paypal-transmission-time'],
      cert_url: headers['paypal-cert-url'],
      auth_algo: headers['paypal-auth-algo'],
      transmission_sig: headers['paypal-transmission-sig'],
      webhook_event: JSON.parse(body),
    }),
  });
  if (!res.ok) return false;
  const data = await res.json() as { verification_status: string };
  return data.verification_status === 'SUCCESS';
}
