# eternahot.com — how this deploys

This folder (C:\Users\etern\eternahot) is the ONLY source of truth for the live site.
It is the GitHub repo jeremy7595/eternahot, and Netlify auto-deploys the `main` branch.

Normal flow: edit files here -> commit -> `git push origin main` -> live in ~30 s.

Fallback (no git): `npx netlify-cli deploy --prod --dir . --message "..."` from this folder.

Do NOT deploy from any other folder. eternahot-site\dist-ARCHIVED-2026-09-19 is a frozen copy
of the site as of Sep 19 2026 and is not deployed from anymore.

Stripe: netlify/functions/stripe-pay.js answers /api/pay. Secret key lives only in
Netlify -> Site configuration -> Environment variables -> STRIPE_SECRET_KEY (never in this repo).
