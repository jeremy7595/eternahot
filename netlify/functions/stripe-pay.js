export default async (req) => {
  const key = Netlify.env.get("STRIPE_SECRET_KEY") || "";
  if (!key) {
    return new Response("Stripe is not connected.", { status: 503 });
  }

  const url = new URL(req.url);
  let dollars = url.searchParams.get("amount") || "";
  if (req.method === "POST") {
    try {
      const body = await req.json();
      if (body && body.amount) dollars = String(body.amount);
    } catch {
      /* keep query amount */
    }
  }

  const kind = (url.searchParams.get("kind") || "").toLowerCase();
  const isDispatch = kind === "dispatch";
  const nRaw = Number(String(dollars).replace(/[^0-9.]/g, ""));
  // Diagnostic dispatch is always $275, even if the link amount was edited.
  const n = isDispatch ? 275 : nRaw;
  const cents = Math.round(n * 100);
  if (!Number.isFinite(n) || cents < 50) {
    return Response.redirect(isDispatch ? "https://eternahot.com/dispatch" : "https://eternahot.com/pay", 302);
  }

  const origin = "https://eternahot.com";
  const clip = (key, n) => (url.searchParams.get(key) || "").trim().slice(0, n);
  const first = clip("first", 40);
  const last = clip("last", 40);
  const street = clip("street", 80);
  const unitRaw = clip("unit", 20);
  const city = clip("city", 40);
  const state = clip("state", 2).toUpperCase();
  const zip = clip("zip", 10);
  const bstreet = clip("bstreet", 80);
  const bunitRaw = clip("bunit", 20);
  const bcity = clip("bcity", 40);
  const bstate = clip("bstate", 2).toUpperCase();
  const bzip = clip("bzip", 10);
  const legacyName = clip("name", 80);
  const legacyAddress = clip("address", 160);
  const ref = clip("ref", 80);
  const niceUnit = (u) => !u ? "" : (/^(#|apt|unit|ste|suite)\b/i.test(u) ? u : "Unit " + u);
  const unitText = niceUnit(unitRaw);
  const bunitText = niceUnit(bunitRaw);
  const name = [first, last].filter(Boolean).join(" ") || legacyName;
  const address = [[street, unitText].filter(Boolean).join(", "), [city, [state, zip].filter(Boolean).join(" ")].filter(Boolean).join(", ")].filter(Boolean).join(", ") || legacyAddress;
  const billing = [[bstreet, bunitText].filter(Boolean).join(", "), [bcity, [bstate, bzip].filter(Boolean).join(" ")].filter(Boolean).join(", ")].filter(Boolean).join(", ");
  const back = isDispatch ? "/dispatch" : "/pay";
  const q = (extra) => {
    const p = new URLSearchParams(extra);
    const set = (k, v) => { if (v) p.set(k, v); };
    set("first", first); set("last", last); set("street", street);
    set("unit", unitRaw); set("city", city); set("state", state); set("zip", zip);
    set("bstreet", bstreet); set("bunit", bunitRaw); set("bcity", bcity); set("bstate", bstate); set("bzip", bzip);
    set("name", name); set("address", address); set("ref", ref);
    return "?" + p;
  };
  const params = new URLSearchParams();
  params.set("mode", "payment");
  params.set("submit_type", "pay");
  params.set("success_url", origin + back + q({ paid: "1", amt: n.toFixed(2), method: url.searchParams.get("method") || "card" }));
  params.set("cancel_url", origin + back + q({ amt: n.toFixed(2) }));
  params.set("metadata[source]", isDispatch ? "eternahot.com/dispatch" : "eternahot.com/pay");
  if (isDispatch) {
    params.set("metadata[kind]", "diagnostic_dispatch");
    params.set("payment_intent_data[metadata][kind]", "diagnostic_dispatch");
  }
  if (name) {
    params.set("metadata[customer_name]", name);
    params.set("payment_intent_data[metadata][customer_name]", name);
  }
  if (first) params.set("metadata[first_name]", first);
  if (last) params.set("metadata[last_name]", last);
  if (street) params.set("metadata[street]", street);
  if (unitRaw) params.set("metadata[unit]", unitRaw);
  if (city) params.set("metadata[city]", city);
  if (state) params.set("metadata[state]", state);
  if (zip) params.set("metadata[zip]", zip);
  if (address) params.set("metadata[service_address]", address);
  if (billing) {
    params.set("metadata[billing_address]", billing);
    params.set("payment_intent_data[metadata][billing_address]", billing);
  }
  if (address) {
    params.set("metadata[address]", address);
    params.set("payment_intent_data[metadata][address]", address);
  }
  if (ref) {
    params.set("metadata[ref]", ref);
    params.set("payment_intent_data[metadata][ref]", ref);
  }
  const who = [name, address].filter(Boolean).join(", ");
  const desc = isDispatch
    ? "Diagnostic visit" + (who ? " – " + who : (ref ? " – " + ref : ""))
    : (ref ? "Eternahot – " + ref : "");
  if (desc) params.set("payment_intent_data[description]", desc);
  params.set("line_items[0][quantity]", "1");
  params.set("line_items[0][price_data][currency]", "usd");
  params.set("line_items[0][price_data][unit_amount]", String(cents));
  params.set("line_items[0][price_data][product_data][name]", isDispatch ? "Diagnostic visit" : "Eternahot");
  if (isDispatch) {
    params.set(
      "line_items[0][price_data][product_data][description]",
      "Your visit is scheduled once this payment is received. It covers the trip and up to one hour on site, for diagnosis or to gather what an estimate requires."
    );
  }
  const method = (url.searchParams.get("method") || "card").toLowerCase();
  if (isDispatch && (method === "bank" || method === "ach")) {
    return Response.redirect(origin + "/dispatch" + q({}), 302);
  }
  const placeOk = (line, town, st, postal) => !!(line && town && /^[A-Z]{2}$/.test(st) && /^\d{5}(-\d{4})?$/.test(postal));
  const serviceOk = placeOk(street, city, state, zip);
  const billingOk = placeOk(bstreet, bcity, bstate, bzip);
  if (isDispatch && method === "card" && (!serviceOk || !billingOk)) {
    return Response.redirect(origin + "/dispatch" + q({ need: serviceOk ? "billing" : "service" }), 302);
  }
  if (isDispatch && method === "card") {
    params.set("billing_address_collection", "required");
    const cust = new URLSearchParams();
    if (name) cust.set("name", name);
    cust.set("address[line1]", bstreet);
    if (bunitText) cust.set("address[line2]", bunitText);
    cust.set("address[city]", bcity);
    cust.set("address[state]", bstate);
    cust.set("address[postal_code]", bzip);
    cust.set("address[country]", "US");
    const cres = await fetch("https://api.stripe.com/v1/customers", {
      method: "POST",
      headers: { Authorization: "Bearer " + key, "Content-Type": "application/x-www-form-urlencoded" },
      body: cust,
    });
    const customer = await cres.json();
    if (customer && customer.id) {
      params.set("customer", customer.id);
      params.set("customer_update[address]", "auto");
    }
  }
  if (method === "bank" || method === "ach") {
    params.set("payment_method_types[0]", "us_bank_account");
  } else if (method === "plan" && !isDispatch) {
    // Pay over time: Klarna decides Pay in 4 vs monthly financing at checkout.
    params.set("payment_method_types[0]", "klarna");
  } else {
    params.set("payment_method_types[0]", "card");
  }

  const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + key,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });
  const session = await stripeRes.json();
  if (!session.url) {
    return new Response("Could not start checkout.", { status: 502 });
  }
  return Response.redirect(session.url, 303);
};

export const config = {
  path: "/api/pay",
};
