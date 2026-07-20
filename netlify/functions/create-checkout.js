// Creates a Stripe Checkout Session for a maintenance plan (subscription + one-time initiation fee).
// Secret key + Price IDs are read from Netlify environment variables — never hard-coded.
// Required env vars (set in Netlify → Site configuration → Environment variables):
//   STRIPE_SECRET_KEY     your sk_… key (TEST/sandbox key on Deploy Previews, live key in Production)
//   STRIPE_PRICE_REGULAR  recurring price ID — Regular Duty plan, $30/unit/mo (price_…)
//   STRIPE_PRICE_HEAVY    recurring price ID — Heavy Duty plan, $55/unit/mo (price_…)
//   STRIPE_PRICE_SETUP    one-time price ID — $300 initiation, charged per unit (price_…) [optional]
//
// The front-end falls back to email enrollment if this function isn't configured yet,
// so the page keeps working until the env vars are in place.

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'method_not_allowed' }) };
  }

  const KEY = process.env.STRIPE_SECRET_KEY;
  const PLAN_PRICES = {
    regular: process.env.STRIPE_PRICE_REGULAR,
    heavy: process.env.STRIPE_PRICE_HEAVY
  };
  const PRICE_SETUP = process.env.STRIPE_PRICE_SETUP; // optional

  let plan = 'regular';
  let quantity = 1;
  try {
    const body = JSON.parse(event.body || '{}');
    if (body.plan === 'heavy') plan = 'heavy';
    quantity = Math.max(1, Math.min(50, parseInt(body.quantity, 10) || 1));
  } catch (e) { /* defaults */ }

  const PRICE_MONTHLY = PLAN_PRICES[plan];

  // Not configured yet → tell the page so it can fall back to email enrollment.
  if (!KEY || !PRICE_MONTHLY) {
    return { statusCode: 503, body: JSON.stringify({ error: 'not_configured' }) };
  }

  const host = event.headers['x-forwarded-host'] || event.headers.host || '';
  const origin = host ? 'https://' + host : '';

  const params = new URLSearchParams();
  params.append('mode', 'subscription');
  params.append('billing_address_collection', 'required');
  // Regular (Commercial) Duty includes a 30-day free trial of the monthly fee.
  // One-time line items (the initiation fee) are still charged at checkout.
  if (plan === 'regular') {
    params.append('subscription_data[trial_period_days]', '30');
  }
  params.append('success_url', origin + '/thanks.html');
  params.append('cancel_url', origin + '/plans.html?status=cancelled');

  // Contact info for scheduling the initiation visit — collected on the Stripe
  // checkout page and stored on the Customer/Session in the Stripe dashboard.
  params.append('phone_number_collection[enabled]', 'true');
  params.append('shipping_address_collection[allowed_countries][0]', 'US');
  params.append('custom_text[shipping_address][message]', "Service address — where the tankless unit(s) we'll be maintaining are located.");
  params.append('custom_fields[0][key]', 'contact_name');
  params.append('custom_fields[0][label][type]', 'custom');
  params.append('custom_fields[0][label][custom]', 'Contact person for scheduling');
  params.append('custom_fields[0][type]', 'text');

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
