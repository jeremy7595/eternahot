// Creates a Stripe Checkout Session for Eternahot enrollment.
//
// THE CHECKOUT SELLS ONE THING: the $300-per-unit enrollment service.
// No subscription is created here, so Stripe's page shows a single plain
// payment — no trial, no "free", no subscription wording at all (Doc 06
// §11(2) prohibited-word discipline).
//
// The $60/unit/mo subscription is created SERVER-SIDE by stripe-webhook.js
// the moment Stripe confirms this payment (checkout.session.completed).
// It is anchored to bill on the 1st of a month at least 14 days out —
// automatic, no manual step, and Stripe retries the webhook for days if it
// ever fails. The card is saved here (setup_future_usage) so the monthly
// can bill off-session with no second payment page.
//
// Required env vars (Netlify → Project configuration → Environment variables):
//   STRIPE_SECRET_KEY          your sk_… key (use the TEST key first)
//   STRIPE_PRODUCT_INITIATION  product ID (prod_…) for the enrollment service
// (STRIPE_PRICE_REGULAR is used by stripe-webhook.js, not here.)
//
// The front-end falls back to email enrollment if this isn't configured yet.

// $300 per unit, flat. It is a full service, not a fee — descale and flush,
// full maintenance, and enrollability verification for that unit. The SYSTEM
// AUDIT — every water and energy source located, with its valves and pumps —
// happens ONCE PER SYSTEM, not per unit: all units are part of one system,
// usually one system per building. Four units = four full services, one audit.
// 1 unit $300 · 2 units $600 · 4 units $1,200 · 8 units $2,400 · 20 units $6,000.
const ENROLLMENT_CENTS_PER_UNIT = 30000;

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'method_not_allowed' }) };
  }

  const KEY = process.env.STRIPE_SECRET_KEY;
  const PRODUCT_INITIATION = process.env.STRIPE_PRODUCT_INITIATION;

  let quantity = 1;
  try {
    const body = JSON.parse(event.body || '{}');
    quantity = Math.max(1, Math.min(50, parseInt(body.quantity, 10) || 1));
  } catch (e) { /* default to 1 */ }

  // Not configured yet → tell the page so it can fall back to email enrollment.
  if (!KEY || !PRODUCT_INITIATION) {
    return { statusCode: 503, body: JSON.stringify({ error: 'not_configured' }) };
  }

  const host = event.headers['x-forwarded-host'] || event.headers.host || '';
  const origin = host ? 'https://' + host : '';

  const params = new URLSearchParams();
  params.append('mode', 'payment');
  params.append('billing_address_collection', 'required');
  params.append('success_url', origin + '/plans.html?status=success');
  params.append('cancel_url', origin + '/plans.html?status=cancelled');

  // Create a Customer and save the card so the monthly can bill off-session.
  params.append('customer_creation', 'always');
  params.append('payment_intent_data[setup_future_usage]', 'off_session');

  // Say exactly what today's charge is and when the monthly starts —
  // Eternahot's words, on Stripe's page.
  params.append('custom_text[submit][message]',
    'Today you pay the enrollment service only — a full maintenance and flush for every unit, plus a complete audit of your system. Your monthly plan ($60 per unit) bills on the 1st of the month, starting at least two weeks from today.');

  // One line item: the enrollment service, $300 × units.
  params.append('line_items[0][price_data][currency]', 'usd');
  params.append('line_items[0][price_data][product]', PRODUCT_INITIATION);
  params.append('line_items[0][price_data][unit_amount]', String(ENROLLMENT_CENTS_PER_UNIT));
  params.append('line_items[0][quantity]', String(quantity));

  // The webhook reads units from here to size the subscription.
  params.append('metadata[units]', String(quantity));

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
