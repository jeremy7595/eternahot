// Creates the $60/unit/mo subscription after an enrollment payment succeeds.
//
// Fired by Stripe on checkout.session.completed. Runs automatically, so the
// monthly starts itself — no manual trigger to forget — and Stripe retries
// this webhook for days if it fails. The subscription is anchored to bill on
// the 1st of a month at least 14 days out, created directly via the API where
// billing_cycle_anchor + proration_behavior=none is allowed (Checkout refuses
// that combination alongside a one-time line item, which is why the split
// exists — and the split is also what keeps trial/"free" wording off the
// customer's payment page entirely).
//
// Idempotent: the checkout session id is stamped into the subscription's
// metadata and checked before creating, so webhook retries never double-bill.
//
// Required env vars:
//   STRIPE_SECRET_KEY        same key as create-checkout.js
//   STRIPE_PRICE_REGULAR     the $60/unit/mo recurring price
//   STRIPE_WEBHOOK_SECRET    optional but strongly recommended in live mode —
//                            when set, signatures are verified; when unset,
//                            events are accepted unverified (sandbox testing).

const crypto = require('crypto');

const MIN_DAYS_BEFORE_FIRST_MONTHLY = 14;

// The 1st of a month, Pacific-anchored, at least 14 days out — one billing
// date for the whole book, so on the 2nd a unit either paid or it didn't.
function firstMonthlyChargeUnix() {
  const now = Date.now();
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles', year: 'numeric', month: 'numeric'
  }).formatToParts(new Date());
  const year = Number(parts.find(p => p.type === 'year').value);
  let month = Number(parts.find(p => p.type === 'month').value); // 1-12
  let ts = Date.UTC(year, month, 1, 8, 0, 0); // 1-12 into 0-indexed = next month; 08:00 UTC ≈ midnight Pacific
  while (ts - now < MIN_DAYS_BEFORE_FIRST_MONTHLY * 86400000) {
    month += 1;
    ts = Date.UTC(year, month, 1, 8, 0, 0);
  }
  return Math.floor(ts / 1000);
}

function verifySignature(payload, header, secret) {
  if (!header) return false;
  const parts = Object.fromEntries(header.split(',').map(kv => kv.split('=')));
  if (!parts.t || !parts.v1) return false;
  const expected = crypto.createHmac('sha256', secret)
    .update(parts.t + '.' + payload, 'utf8').digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(parts.v1, 'hex'));
  } catch (e) { return false; }
}

async function stripe(KEY, method, path, params) {
  const resp = await fetch('https://api.stripe.com/v1/' + path, {
    method,
    headers: {
      'Authorization': 'Bearer ' + KEY,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params ? params.toString() : undefined
  });
  const data = await resp.json();
  return { ok: resp.ok, data };
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'method_not_allowed' };

  const KEY = process.env.STRIPE_SECRET_KEY;
  const PRICE_MONTHLY = process.env.STRIPE_PRICE_REGULAR;
  const WH_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
  if (!KEY || !PRICE_MONTHLY) return { statusCode: 503, body: 'not_configured' };

  const payload = event.body || '';
  if (WH_SECRET && !verifySignature(payload, event.headers['stripe-signature'], WH_SECRET)) {
    return { statusCode: 400, body: 'bad_signature' };
  }

  let evt;
  try { evt = JSON.parse(payload); } catch (e) { return { statusCode: 400, body: 'bad_json' }; }
  if (evt.type !== 'checkout.session.completed') return { statusCode: 200, body: 'ignored' };

  const session = evt.data.object;
  if (session.mode !== 'payment' || session.payment_status !== 'paid') {
    return { statusCode: 200, body: 'not_applicable' };
  }
  const customer = session.customer;
  const units = Math.max(1, Math.min(50, parseInt((session.metadata || {}).units, 10) || 1));
  if (!customer) return { statusCode: 200, body: 'no_customer' };

  // Idempotency: bail if a subscription already carries this session id.
  const search = await stripe(KEY, 'GET',
    'subscriptions/search?query=' + encodeURIComponent('metadata["checkout_session"]:"' + session.id + '"'), null);
  if (search.ok && search.data.data && search.data.data.length > 0) {
    return { statusCode: 200, body: 'already_created' };
  }

  // The card saved at checkout (setup_future_usage) — make it the default.
  let defaultPm = '';
  if (session.payment_intent) {
    const pi = await stripe(KEY, 'GET', 'payment_intents/' + session.payment_intent, null);
    if (pi.ok && pi.data.payment_method) defaultPm = pi.data.payment_method;
  }

  const p = new URLSearchParams();
  p.append('customer', customer);
  p.append('items[0][price]', PRICE_MONTHLY);
  p.append('items[0][quantity]', String(units));
  p.append('billing_cycle_anchor', String(firstMonthlyChargeUnix()));
  p.append('proration_behavior', 'none');
  if (defaultPm) p.append('default_payment_method', defaultPm);
  p.append('metadata[checkout_session]', session.id);
  p.append('metadata[units]', String(units));
  p.append('metadata[enrollment_visit]', 'pending');
  p.append('metadata[serial_history]', '');
  for (let i = 1; i <= units; i++) p.append('metadata[serial_' + i + ']', 'PENDING');

  const sub = await stripe(KEY, 'POST', 'subscriptions', p);
  if (!sub.ok) {
    // Non-200 makes Stripe retry — the right behavior for a transient failure.
    return { statusCode: 500, body: JSON.stringify({ error: (sub.data.error && sub.data.error.message) || 'subscription_failed' }) };
  }
  return { statusCode: 200, body: JSON.stringify({ created: sub.data.id }) };
};
