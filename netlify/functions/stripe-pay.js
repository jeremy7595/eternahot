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

  const n = Number(String(dollars).replace(/[^0-9.]/g, ""));
  const cents = Math.round(n * 100);
  if (!Number.isFinite(n) || cents < 50) {
    return Response.redirect("https://eternahot.com/pay", 302);
  }

  const origin = "https://eternahot.com";
  const ref = (url.searchParams.get("ref") || "").slice(0, 80);
  const back = url.searchParams.get("back") === "pay2" ? "/pay2" : "/pay";
  const q = (extra) => { const p = new URLSearchParams(extra); if (ref) p.set("ref", ref); return "?" + p; };
  const params = new URLSearchParams();
  params.set("mode", "payment");
  params.set("submit_type", "pay");
  params.set("success_url", origin + back + q({ paid: "1", amt: n.toFixed(2), method: url.searchParams.get("method") || "card" }));
  params.set("cancel_url", origin + back + q({ amt: n.toFixed(2) }));
  params.set("metadata[source]", "eternahot.com/pay");
  if (ref) { params.set("metadata[ref]", ref); params.set("payment_intent_data[description]", "Eternahot – " + ref); params.set("payment_intent_data[metadata][ref]", ref); }
  params.set("line_items[0][quantity]", "1");
  params.set("line_items[0][price_data][currency]", "usd");
  params.set("line_items[0][price_data][unit_amount]", String(cents));
  params.set("line_items[0][price_data][product_data][name]", "Eternahot");
  const method = (url.searchParams.get("method") || "card").toLowerCase();
  if (method === "bank" || method === "ach") {
    params.set("payment_method_types[0]", "us_bank_account");
  } else if (method === "plan") {
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
