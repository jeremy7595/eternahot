/* Google Analytics 4 for eternahot.com.
 *
 * Setup: create a GA4 property at https://analytics.google.com (Admin → Create
 * property → add a Web data stream for eternahot.com), then replace the
 * placeholder below with the stream's Measurement ID (looks like G-ABC123XYZ).
 * Until then this file does nothing, so it's safe to deploy as-is.
 *
 * Events sent, beyond automatic page views:
 *   phone_call       — any tap/click on a tel: link (the primary CTA)
 *   email_click      — clicks on mailto: links
 *   begin_checkout   — plan signup form submitted (with unit quantity)
 *   checkout_success — returned from Stripe with ?status=success
 */
(function () {
  var GA_ID = 'G-XXXXXXXXXX';
  if (GA_ID.indexOf('X') !== -1) return;

  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', GA_ID);

  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
  document.head.appendChild(s);

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="tel:"], a[href^="mailto:"]');
    if (!a) return;
    var isPhone = a.getAttribute('href').indexOf('tel:') === 0;
    gtag('event', isPhone ? 'phone_call' : 'email_click', {
      link_text: (a.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 100),
      page_path: location.pathname
    });
  });

  var form = document.getElementById('signupForm');
  if (form) {
    form.addEventListener('submit', function () {
      var qty = document.getElementById('unitCount');
      gtag('event', 'begin_checkout', {
        quantity: qty ? parseInt(qty.value, 10) || 1 : 1
      });
    });
  }

  try {
    if (new URLSearchParams(location.search).get('status') === 'success') {
      gtag('event', 'checkout_success');
    }
  } catch (e) {}
})();
