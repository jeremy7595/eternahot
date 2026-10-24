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
  const ref = (url.searchParams.get("ref") || "").slice(0, 80);
  const back = isDispatch ? "/dispatch" : "/pay";
  const q = (extra) => { const p = new URLSearchParams(extra); if (ref) p.set("ref", ref); return "?" + p; };
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
  if (ref) {
    params.set("metadata[ref]", ref);
    params.set("payment_intent_data[metadata][ref]", ref);
  }
  const desc = isDispatch
    ? "Diagnostic dispatch" + (ref ? " – " + ref : "")
    : (ref ? "Eternahot – " + ref : "");
  if (desc) params.set("payment_intent_data[description]", desc);
  params.set("line_items[0][quantity]", "1");
  params.set("line_items[0][price_data][currency]", "usd");
  params.set("line_items[0][price_data][unit_amount]", String(cents));
  params.set("line_items[0][price_data][product_data][name]", isDispatch ? "Diagnostic dispatch" : "Eternahot");
  if (isDispatch) {
    params.set(
      "line_items[0][price_data][product_data][description]",
      "We do not dispatch until this payment is received. Covers drive time, fuel, and up to one hour on site for diagnosis or to gather information for an estimate. This amount may be credited toward a repair or replacement. The offer expires when the technician leaves the jobsite. A signed contract and deposit lock the credit in when parts must be ordered or picked up. The credit is not applied to the deposit. It is applied when the repair or replacement is paid in full."
    );
  }
  const method = (url.searchParams.get("method") || "card").toLowerCase();
  if (isDispatch && (method === "bank" || method === "ach")) {
    return Response.redirect(origin + "/dispatch" + (ref ? "?ref=" + encodeURIComponent(ref) : ""), 302);
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
