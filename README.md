# Eternahot Plumbing Website

The **best possible version** of the Eternahot Plumbing website — a high-converting, premium, video-hero lead-generation site for Southern California’s tankless water heater specialists.

## Latest Upgrade (based on provided video-hero HTML)
- **Hero**: Full-bleed video background (desktop) with the exact user-provided mp4 + robust fallbacks, premium dark overlay, and the beautiful multi-layer animated water wave at the bottom.
- **Elevated content & conversion**: Kept the energetic sales-focused spirit of the provided HTML while infusing the strongest elements from previous refined work — prominent Limited-Time Offers ($149 Health Check is the star), 6 detailed service areas, 6 high-trust testimonials, clear 4-step process, and rich FAQ.
- **New interactive value**: “Estimate your annual savings” calculator (JS-powered) that gives visitors a concrete, personalized number — powerful for tankless education and lead gen.
- **Premium polish**: Playfair Display headlines, brand red (#c8102e), refined micro-typography, water-sheen CTAs, excellent mobile sticky bar, full keyboard-accessible FAQ accordion, phone formatting, client-side form validation + loading state.
- **Production ready**: Working Web3Forms integration (redirects to upgraded thank-you.html), complete JSON-LD schema, Open Graph tags, proper accessibility attributes, reduced-motion video respect, and self-contained assets (video + logos now live in the folder).
- Assets included: hero-video.mp4 (and attachments/ copy), real Asset_1.svg + Asset_2.svg, Rinnai certified badge PNG, rinnai-logo.svg, etc.

This version directly fulfills “make the best of this that you can” on the supplied HTML while being the highest-converting, most professional site possible for the business.
- Added prominent **Limited-Time Intro Offers** section (`#offers`) with $149 first-time Health Check + Flush, $100 Yank the Tank credit, and discounted first diagnostic visit. Fixes link from `rinnai-resources.html`.
- Added **Trusted Components** section showcasing real manufacturer logos (Rinnai, Grundfos, Apollo, NIBCO, Lochinvar, Raypak, Honeywell) + text for TracPipe, Laars, RIB Relays.
- Added direct link from homepage Rinnai Resources bar to the full `rinnai-resources.html` + Pro Field Library.
- Fixed `#our-story` anchor (was missing id on the section).
- Simplified favicon links (favicon2/ assets were referenced but folder was missing — now falls back to `logo.png`).
- Kept `index.html` and `Eternahot-Plumbing-Website.html` in sync.

## What's included (current best version)

- Video-driven hero with beautiful animated water waves (exactly matching the spirit of the supplied HTML)
- High-converting Limited-Time Offers section ($149 Health Check + Flush is the hero offer)
- 6 detailed service descriptions + 4-step “How It Works”
- Interactive “Estimate Your Annual Savings” calculator (JS)
- 6 strong, specific testimonials + comprehensive FAQ accordion (fully keyboard accessible)
- Fully working Web3Forms contact form with validation, loading state, and phone auto-format
- Premium typography (Playfair Display headlines + Inter), brand red, water-sheen hover effects on CTAs
- Complete SEO (title, meta, OG tags, full LocalBusiness + OfferCatalog JSON-LD schema)
- 24/7 phone CTAs everywhere + prominent sticky mobile bar
- Self-contained: hero video + all logo assets included in the folder for easy Bluehost/cPanel upload

## Files (for deployment)

- `index.html` — the complete, best-possible standalone website (use this one)
- `thank-you.html` — upgraded success page after form submission
- `hero-video.mp4` + `attachments/istockphoto-...mp4` — the hero background video (desktop only)
- `Asset_1.svg` + `Asset_2.svg` — official Eternahot logos for navbar
- `rinnai-logo.svg` + `Rinnai Certified front 1-01.png` — Rinnai authorized visuals
- `hot-water.jpg` — mobile / fallback hero image
- `rinnai-resources.html` + `rinnai-docs/` — optional but valuable technical resource pages (can be linked from footer later)
- Other brand images from previous work (logos of components, install photos) are still present if you want to re-add a “Trusted Components” or gallery section.

## How to customize quickly

1. **Logo**: Replace `logo.png` with your preferred logo file (keep same filename or update the `<img>` src in the HTML).
2. **Phone & Email**: Search for `2132223457` and `office@eternahot.com` and update if needed.
3. **Address**: Update the address in the contact section and in the JSON-LD schema at the bottom.
4. **Testimonials**: Replace the placeholder reviews with real ones when you have them.
5. **Photos**: Replace `install-photo.png` (and optionally add more in the services or about areas).

## Contact Form (already production-ready)
The form in the current `index.html` uses Web3Forms with your existing access key. It POSTs directly, shows loading state, has client validation, and redirects to the nice `thank-you.html` on success.

**To change providers later:** just update the `action` URL and hidden `access_key`.

For emergencies the phone number is always the primary CTA — this is intentional and correct for a 24/7 plumbing business.

## Deployment (Bluehost / cPanel / static hosting)
1. Upload these from the `eternahot-website/` (or `eternahot-deploy/`) folder **directly into public_html**:
   - `index.html`
   - `thank-you.html`
   - `hero-video.mp4`
   - `Asset_1.svg`, `Asset_2.svg`, `rinnai-logo.svg`
   - `Rinnai Certified front 1-01.png` (and any other images you want)
   - (Optional) the entire `rinnai-docs/` + `rinnai-resources.html` if you still want the document library live
2. Delete or rename the default Bluehost `index.php` / placeholder so `index.html` takes over.
3. Make sure SSL is active.
4. Test the form and video on mobile + desktop.

The video is ~1.5 MB — perfectly fine. It only loads on `md` screens and up. Mobile gets a clean dark gradient + all CTAs.
- Add `netlify` attribute to the form
- They will email you submissions automatically

## Quick start (test locally)

**Recommended:** Double-click `index.html`.

Only `index.html` is the primary file now (the old `Eternahot-Plumbing-Website.html` has been renamed to `.deprecated` to avoid confusion during upload).

## Hosting on Bluehost (your current setup)

Since you're using Bluehost + cPanel File Manager and want eternahot.com live with `index.html`:

### Step-by-step deployment (cPanel File Manager)

1. **Log into Bluehost cPanel**
2. **Open File Manager** (usually under "Files")
3. **Navigate to `public_html`** (this is the document root for eternahot.com)
   - If you see a lot of default files (index.php, a "coming soon" page, etc.), that's normal.
4. **Delete or rename the default index.php / index.html** that Bluehost puts there (or the "coming soon" page) so your `index.html` can take over.
5. **Upload your files** (clean set):
   - Upload these directly into `public_html/` (flatten — do not put them inside another folder):
     - `index.html` (main page)
     - `thank-you.html` (clean success page after form submission)
     - `rinnai-resources.html`
     - `rinnai-docs/` (entire folder — for the Pro Field Library)
     - All image files: `*.png`, `*.svg`, `logo.png`, `Asset_*.svg`, `IMG_*.svg`, etc.
   - Do **NOT** upload: `Eternahot-Plumbing-Website.html.deprecated`, the `*.py` scripts, or this README.
6. **Add the .htaccess file**:
   - In cPanel File Manager (inside public_html), create a new file named exactly `.htaccess` (the dot is important).
   - Copy the contents of the `.htaccess` file from this project folder and paste it in.
7. **Set the domain document root** (if needed):
   - cPanel → Domains → ensure eternahot.com's document root is `public_html`.
8. **Install free SSL**:
   - cPanel → "SSL/TLS Status" or search for "Let's Encrypt" → install certificate for eternahot.com (and www if you use it).
9. **Clear cache**:
   - cPanel → LiteSpeed Web Cache Manager (or Cache Manager) → Flush All.
10. Test: Go to https://eternahot.com and https://eternahot.com/thank-you.html

**Pro tip**: After the first successful upload, you can replace just `index.html` (and other changed files) when you make future updates.

**Important**: Upload the individual files + the `rinnai-docs` folder **directly** into `public_html`. Bluehost will then serve `index.html` at the root of eternahot.com.

### Quick local test
Double-click `index.html` to preview everything (water animations, offers, form, etc.).

### After going live
- Submit your sitemap (once created) to Google Search Console.
- Test the contact form thoroughly.
- The form currently uses Web3Forms (external, reliable). After success it redirects back to the homepage.

## Domain (eternahot.com)

Point your domain's nameservers to Bluehost (or use Bluehost nameservers) and make sure the domain is added in cPanel.

After files are in public_html, it can take 30min–48hrs for full propagation, but usually much faster.

## SEO / Google

- The page has good meta description + title.
- We have added proper JSON-LD structured data (LocalBusiness / Plumber + license + service areas) to both `index.html` and `rinnai-resources.html`.
- Submit the final URL + sitemap to Google Search Console.
- Consider adding Google Analytics or the conversion tag you already had (AW-18152274782).

## Recent Changes

- **This session**: Added full "Limited-Time Intro Offers" section (id="offers") with concrete first-time pricing. Added "Trusted Components" brands section. Promoted Rinnai resources page. **New**: Exciting animated water graphics throughout — lively multi-layer splashing water + bursting droplets at the bottom of the hero (big energetic version), a prominent vertical flowing faucet-style water splash on the right side of the hero (multiple curving streams + splash burst, directly inspired by the blue water in the Asset_2 faucet logo), and a matching tiny flowing accent in the Offers header. Added water-sheen hover flash on primary CTAs. All pure CSS + inline SVG, performant and on-brand.
- Previous work established the family 4th-gen positioning, removed Rinnai employment claims, created `rinnai-resources.html` + the full local Pro Field Document Library in `rinnai-docs/`, and added transparent pricing + strong CTAs.

## Next improvements you can add later

- Real photos of completed jobs + before/after (very high trust)
- Google reviews embed or link
- Service area map / expanded coverage list
- Booking calendar integration (Calendly, etc.)
- Maintenance plan signup form (promoted in the new offers section)
- Generate proper multi-size favicons and put them in a `favicon2/` folder (update the head links)
- Optional: Google Analytics + conversion tracking (tag AW-18152274782 mentioned previously)

## Questions?

Update the phone, email, address, and services as needed. The form and CTAs are the most important parts for getting customers.

Call to action priority: **Phone first**, form second.

---

Built as a clean, simple, focused lead-generation site. Ready to deploy.