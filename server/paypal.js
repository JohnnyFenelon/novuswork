/** PayPal Orders v2 REST helpers. Uses sandbox unless PAYPAL_ENV=live. */

const BASE = () =>
  process.env.PAYPAL_ENV === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

export const paypalConfigured = () =>
  Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);

async function accessToken() {
  const creds = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString('base64');
  const res = await fetch(`${BASE()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${creds}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) throw new Error(`PayPal auth failed: ${res.status}`);
  return (await res.json()).access_token;
}

export async function createOrder(amount = '5.00') {
  const token = await accessToken();
  const res = await fetch(`${BASE()}/v2/checkout/orders`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: { currency_code: 'USD', value: amount },
          description: 'NovusWork Premium — mentoring & Top Candidate placement',
        },
      ],
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`PayPal create order failed: ${JSON.stringify(data)}`);
  return data; // { id, status, ... }
}

export async function captureOrder(orderId) {
  const token = await accessToken();
  const res = await fetch(`${BASE()}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`PayPal capture failed: ${JSON.stringify(data)}`);
  return data; // { id, status: 'COMPLETED', ... }
}
