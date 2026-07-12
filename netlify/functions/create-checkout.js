// Creates a Stripe Checkout Session for the Maintenance Plan (subscription + one-time setup fee).
// Secret key + Price IDs are read from Netlify environment variables — never hard-coded.
// Required env vars (set in Netlify → Site settings → Environment variables):
//   STRIPE_SECRET_KEY               your sk_… key (use the TEST key first)
//   STRIPE_PRICE_MAINTENANCE        recurring price ID for $30/mo (price_…)
//   STRIPE_PRICE_MAINTENANCE_SETUP  one-time price ID for the $300 initiation (price_…) [optional]
//
// The front-end falls back to email enrollment if this function isn't configured yet,
// so the page keeps working until the env vars are in place.

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'method_not_allowed' }) };
  }

  const KEY = process.env.STRIPE_SECRET_KEY;
  const PRICE_MONTHLY = process.env.STRIPE_PRICE_MAINTENANCE;
  const PRICE_SETUP = process.env.STRIPE_PRICE_MAINTENANCE_SETUP; // optional

  // Not configured yet → tell the page so it can fall back to email enrollment.
  if (!KEY || !PRICE_MONTHLY) {
    return { statusCode: 503, body: JSON.stringify({ error: 'not_configured' }) };
  }

  let quantity = 1;
  try {
    const body = JSON.parse(event.body || '{}');
    quantity = Math.max(1, Math.min(50, parseInt(body.quantity, 10) || 1));
  } catch (e) { /* default quantity */ }

  const host = event.headers['x-forwarded-host'] || event.headers.host || '';
  const origin = host ? 'https://' + host : '';

  const params = new URLSearchParams();
  params.append('mode', 'subscription');
  params.append('billing_address_collection', 'required');
  params.append('success_url', origin + '/plans.html?status=success');
  params.append('cancel_url', origin + '/plans.html?status=cancelled');

  // Line items: recurring monthly (× units) + one-time initiation (× units, added to first invoice)
  let i = 0;
  params.append(`line_items[${i}][price]`, PRICE_MONTHLY);
  params.append(`line_items[${i}][quantity]`, String(quantity));
  i++;
  if (PRICE_SETUP) {
    params.append(`line_items[${i}][price]`, PRICE_SETUP);
    params.append(`line_items[${i}][quantity]`, String(quantity));
  }

  try {
    const resp = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + KEY,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });
    const data = await resp.json();
    if (!resp.ok) {
      return { statusCode: 502, body: JSON.stringify({ error: (data.error && data.error.message) || 'stripe_error' }) };
    }
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: data.url })
    };
  } catch (err) {
    return { statusCode: 502, body: JSON.stringify({ error: 'request_failed' }) };
  }
};
