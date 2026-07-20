// Creates a Stripe Checkout Session for the Eternahot service plans
// (monthly subscription with a 30-day free trial + one-time initiation fee).
// Secret key + Price/Product IDs are read from Netlify environment variables — never hard-coded.
// Required env vars (set in Netlify → Project configuration → Environment variables):
//   STRIPE_SECRET_KEY          your sk_… key (use the TEST key first)
//   STRIPE_PRICE_REGULAR       per-unit recurring price for Commercial Duty ($30/unit/mo)
//   STRIPE_PRICE_HEAVY         per-unit recurring price for Severe Service ($55/unit/mo)
//   STRIPE_PRODUCT_INITIATION  product ID (prod_…) used to bill the one-time initiation fee
//
// The front-end falls back to email enrollment if this function isn't configured yet,
// so the page keeps working until the env vars are in place.

// One-time initiation fee, in cents: $50 less per unit, stopping at the
// $150 floor (reached at unit 4) — every unit's initiation includes a full
// flush and maintenance, so no unit enrolls below the cost of that service.
// Per-unit: $300, $250, $200, then $150 from unit 4 on.
// Examples: 1 unit $300; 2 units $550; 4 units $900; 8 units $1,500; 20 units $3,300.
const INITIATION_STEPS_CENTS = [30000, 25000, 20000];
function initiationFeeCents(units) {
  let total = 0;
  for (let i = 0; i < units; i++) total += INITIATION_STEPS_CENTS[i] || 15000;
  return total;
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'method_not_allowed' }) };
  }

  const KEY = process.env.STRIPE_SECRET_KEY;
  const PRICES = {
    regular: process.env.STRIPE_PRICE_REGULAR,
    heavy: process.env.STRIPE_PRICE_HEAVY
  };
  const PRODUCT_INITIATION = process.env.STRIPE_PRODUCT_INITIATION;

  let plan = 'regular';
  let quantity = 1;
  try {
    const body = JSON.parse(event.body || '{}');
    if (typeof body.plan === 'string') plan = body.plan.toLowerCase();
    quantity = Math.max(1, Math.min(50, parseInt(body.quantity, 10) || 1));
  } catch (e) { /* defaults */ }

  if (plan !== 'regular' && plan !== 'heavy') {
    return { statusCode: 400, body: JSON.stringify({ error: 'invalid_plan' }) };
  }

  // Not configured yet → tell the page so it can fall back to email enrollment.
  if (!KEY || !PRICES[plan] || !PRODUCT_INITIATION) {
    return { statusCode: 503, body: JSON.stringify({ error: 'not_configured' }) };
  }

  const host = event.headers['x-forwarded-host'] || event.headers.host || '';
  const origin = host ? 'https://' + host : '';

  const params = new URLSearchParams();
  params.append('mode', 'subscription');
  params.append('billing_address_collection', 'required');
  params.append('success_url', origin + '/plans.html?status=success');
  params.append('cancel_url', origin + '/plans.html?status=cancelled');

  // 30-day free trial: card is saved at signup, monthly billing begins on day 31.
  params.append('subscription_data[trial_period_days]', '30');
  params.append('payment_method_collection', 'always');

  // Line items:
  //   0: recurring monthly plan — flat per-unit price × unit count.
  //   1: one-time initiation fee, computed here and charged immediately at checkout.
  params.append('line_items[0][price]', PRICES[plan]);
  params.append('line_items[0][quantity]', String(quantity));
  params.append('line_items[1][price_data][currency]', 'usd');
  params.append('line_items[1][price_data][product]', PRODUCT_INITIATION);
  params.append('line_items[1][price_data][unit_amount]', String(initiationFeeCents(quantity)));
  params.append('line_items[1][quantity]', '1');

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
