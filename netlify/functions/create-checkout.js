// Creates a Stripe Checkout Session for Eternahot enrollment.
//
// WHAT HAPPENS AT CHECKOUT
//   1. The customer is charged $300 per unit — the enrollment service.
//   2. A $60-per-unit monthly subscription is created, anchored to bill from
//      the FIRST OF A MONTH at least 14 days out. Nothing monthly is charged
//      today — the $300 enrollment pays for the initial maintenance.
//
// WHY AN ANCHOR AND NOT A TRIAL
//   Stripe renders a trial as "X days free" / "Pay and start trial" on the
//   checkout page. "Free" is a prohibited word (Doc 06 §11(2)) and it is false
//   in spirit — the first month's service is PREPAID by the enrollment, not
//   free. A billing_cycle_anchor defers the first invoice to the same date
//   with no trial language anywhere. proration_behavior=none stops Stripe
//   from charging a partial month today.
//
// WHY THE SUBSCRIPTION STARTS ITSELF
//   The monthly must not begin until the enrollment service has been performed.
//   That could be a manual trigger — but a manual trigger means forgetting it
//   costs revenue, silently, forever. So the subscription starts on its own and
//   the ONLY manual action is CANCELLING it when a unit comes back NOT FIT.
//   That is the rare case, and it is memorable: it is a conversation the owner
//   had on site that morning. The lazy path collects money; the exceptional
//   path requires attention. That is the right way round.
//
// SERIALS
//   Per Doc 11 A1, the serial IS the enrollment, and per A6 the serial is
//   metadata — never the object identity, so a swap is an edit and never a
//   cancel-and-recreate. Serials are NOT collected here: nobody knows them yet,
//   because the technician has not been out. They are attached to the
//   subscription's metadata after the enrollment visit, from the nameplate
//   photos that are already mandatory (Doc 00 §8), as serial_1, serial_2, …
//   with serial_history for swaps. This function seeds those keys empty so the
//   fields are visibly waiting rather than forgotten.
//
// Required env vars (Netlify → Project configuration → Environment variables):
//   STRIPE_SECRET_KEY          your sk_… key (use the TEST key first)
//   STRIPE_PRICE_REGULAR       the $60/unit/mo recurring price
//   STRIPE_PRODUCT_INITIATION  product ID (prod_…) for the enrollment service
//
// The front-end falls back to email enrollment if this isn't configured yet.

// $300 per unit, flat. It is a full service, not a fee — descale and flush,
// full maintenance, and enrollability verification for that unit. The SYSTEM
// AUDIT — every water and energy source located, with its valves and pumps —
// happens ONCE PER SYSTEM, not per unit: all units are part of one system,
// usually one system per building. Four units = four full services, one audit.
// 1 unit $300 · 2 units $600 · 4 units $1,200 · 8 units $2,400 · 20 units $6,000.
const ENROLLMENT_CENTS_PER_UNIT = 30000;

// Every customer is billed on the 1st of a month — one date for the whole book,
// which is what makes the lapse rule checkable: on the 2nd, a unit either paid
// or it didn't, and nobody counts days.
//
// The 1st chosen is the first one at least 14 days out, so there is always room
// for the enrollment visit to happen before any monthly money moves. Enroll on
// or before roughly the 18th and it's the 1st of next month; later than that and
// it rolls to the month after. Worst case is about 45 days with no monthly
// charge — covered, because the $300 already paid for the first service.
const MIN_DAYS_BEFORE_FIRST_MONTHLY = 14;

function firstMonthlyChargeUnix() {
  const now = Date.now();
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles', year: 'numeric', month: 'numeric'
  }).formatToParts(new Date());
  const year = Number(parts.find(p => p.type === 'year').value);
  let month = Number(parts.find(p => p.type === 'month').value); // 1-12
  // Date.UTC takes a 0-indexed month, so passing 1-12 straight through already
  // means "the 1st of next month". 08:00 UTC is just after midnight Pacific
  // year-round. Date.UTC rolls month 13 into January of the next year on its own.
  let ts = Date.UTC(year, month, 1, 8, 0, 0);
  while (ts - now < MIN_DAYS_BEFORE_FIRST_MONTHLY * 86400000) {
    month += 1;
    ts = Date.UTC(year, month, 1, 8, 0, 0);
  }
  return Math.floor(ts / 1000);
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'method_not_allowed' }) };
  }

  const KEY = process.env.STRIPE_SECRET_KEY;
  const PRICE_MONTHLY = process.env.STRIPE_PRICE_REGULAR;
  const PRODUCT_INITIATION = process.env.STRIPE_PRODUCT_INITIATION;

  let quantity = 1;
  try {
    const body = JSON.parse(event.body || '{}');
    quantity = Math.max(1, Math.min(50, parseInt(body.quantity, 10) || 1));
  } catch (e) { /* default to 1 */ }

  // Not configured yet → tell the page so it can fall back to email enrollment.
  if (!KEY || !PRICE_MONTHLY || !PRODUCT_INITIATION) {
    return { statusCode: 503, body: JSON.stringify({ error: 'not_configured' }) };
  }

  const host = event.headers['x-forwarded-host'] || event.headers.host || '';
  const origin = host ? 'https://' + host : '';
  const anchorTs = firstMonthlyChargeUnix();

  const params = new URLSearchParams();
  params.append('mode', 'subscription');
  params.append('billing_address_collection', 'required');
  params.append('success_url', origin + '/plans.html?status=success');
  params.append('cancel_url', origin + '/plans.html?status=cancelled');

  // Monthly billing begins on the 1st (at least 14 days out) — as a billing
  // anchor, never a trial, so the page never says "free" or "trial". The card
  // is collected today because the enrollment service is charged now.
  params.append('subscription_data[billing_cycle_anchor]', String(anchorTs));
  params.append('subscription_data[proration_behavior]', 'none');
  params.append('payment_method_collection', 'always');

  // Say what today's charge actually is, in Eternahot's own words, on the page.
  params.append('custom_text[submit][message]',
    'Today you pay the enrollment service only — a full maintenance and flush for every unit, plus a complete audit of your system. Your monthly plan bills on the 1st of the month, starting at least two weeks from today.');

  // Line 0: the monthly plan — $60 per unit, one line, quantity = unit count.
  // Line 1: the enrollment service — $300 per unit, charged at checkout.
  params.append('line_items[0][price]', PRICE_MONTHLY);
  params.append('line_items[0][quantity]', String(quantity));
  params.append('line_items[1][price_data][currency]', 'usd');
  params.append('line_items[1][price_data][product]', PRODUCT_INITIATION);
  params.append('line_items[1][price_data][unit_amount]', String(ENROLLMENT_CENTS_PER_UNIT));
  params.append('line_items[1][quantity]', String(quantity));

  // Seed the serial slots empty so they read as outstanding, not overlooked.
  // Filled in after the enrollment visit from the nameplate photos.
  params.append('subscription_data[metadata][units]', String(quantity));
  params.append('subscription_data[metadata][enrollment_visit]', 'pending');
  params.append('subscription_data[metadata][serial_history]', '');
  for (let i = 1; i <= quantity; i++) {
    params.append('subscription_data[metadata][serial_' + i + ']', 'PENDING');
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
