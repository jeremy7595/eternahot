// Creates a Stripe Checkout Session for the Eternahot service plans
// (monthly subscription with a 30-day free trial + one-time initiation fee).
// Secret key + Price/Product IDs are read from Netlify environment variables — never hard-coded.
// Required env vars (set in Netlify → Project configuration → Environment variables):
//   STRIPE_SECRET_KEY          your sk_… key (use the TEST key first)
//   STRIPE_PRICE_REGULAR       graduated tiered recurring price for Regular Duty (base $30/unit/mo)
//   STRIPE_PRICE_HEAVY         graduated tiered recurring price for Heavy Duty (base $55/unit/mo)
//   STRIPE_PRODUCT_INITIATION  product ID (prod_…) used to bill the one-time initiation fee
//
// The front-end falls back to email enrollment if this function isn't configured yet,
// so the page keeps working until the env vars are in place.

// One-time initiation fee, in cents: unit 1 is $300, each additional unit
// $30 less, floored at $150 per unit (reached at unit 6).
// Examples: 1 unit $300; 4 units $1,020; 8 units $1,650; 20 units $3,450.
function initiationFeeCents(units) {
  let total = 0;
  for (let i = 0; i < units; i++) total += Math.max(30000 - 3000 * i, 15000);
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
  //   0: recurring monthly plan — progressive discounts live in Stripe's
  //      graduated tiered price, so we just pass the unit count.
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
