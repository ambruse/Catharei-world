# Mobile route and source audit — 11 October 2026

This is the **pre-implementation source audit**, not a claim of completed browser testing. The implementation and verified results are recorded in `MOBILE_UX_OPTIMIZATION.md`. Public routes were discovered from the Express allowlist and route registrations in `server.js`, `catalogue-seo.js`, static HTML files, `posts.json`, the sitemap, and active product records read with SQLite's read-only mode.

## Coverage

The repository contains 25 top-level/navigation/location HTML documents: 24 public page templates and one admin-only page. There are two generated blog articles, ten locally active product detail URLs, and the generated Luqaimat page. **37 public page URLs** are covered by the inventory, including the Luqaimat unavailable state. The product count reflects this local database snapshot; deployed product records can differ.

`tests/mobile-route-inventory.json` contains the complete machine-readable route list, template ownership, language attributes, redirects, error states, and baseline protected content. It records exact title/meta/canonical/schema/heading/link/analytics source values and SHA-256 hashes, plus hashes for robots, sitemap, posts, and SEO modules. Viewport metadata is deliberately excluded from the protected meta snapshot because safe-area adaptation can legitimately add `viewport-fit=cover`.

| Public page | Existing template / source findings |
| --- | --- |
| `/` | Homepage; shared header/footer, products, category links, delivery partners, FAQ, photography and existing hero. Shared mobile container padding creates unnecessary blank space. |
| `/menu.html` | Full catalogue; shared menu/product/variant/cart behavior. Search, filtering and unavailable/empty states need interaction verification. |
| `/navigation/savories.html` | Category catalogue, same product/variant interactions. |
| `/navigation/Arabic_sweets.html` | Category catalogue, same product/variant interactions. |
| `/navigation/oriental_sweets.html` | Category catalogue, same product/variant interactions. |
| `/navigation/cakes.html` | Category catalogue; also the server template for product detail and Luqaimat pages. |
| `/navigation/cart.html` | Cart with shared header/footer; quantity/removal, totals, coupon and checkout link need stateful verification. |
| `/checkout.html` | Checkout form and order submission; keep existing API/backend payload unchanged. |
| `/about.html` | Editorial hero and prose; inline 3rem H1 overrides the mobile font-size rule; repeated footer. |
| `/contact.html` | Editorial contact information; phone and email are plain text, with no contact form. Do not invent a form or backend. |
| `/locations/al-aziziya.html` | Branch template; long heading, plain-text phone, map iframe without a title, adjacent CTA margins. |
| `/locations/al-wakrah.html` | Branch template; same issues and existing branch-specific map/contact content. |
| `/locations/al-kharaitiyat.html` | Branch template; same issues. Its primary directions link and secondary Maps link differ in source; preserve existing destinations. |
| `/catering.html` | Editorial cards; 260px minimum grid track, 28px card padding, 40px callout padding and adjacent CTAs need narrow-screen checks. |
| `/corporate-gifting.html` | Editorial cards; 260px minimum grid track; long heading and quote/product actions; existing Arabic passages. |
| `/delivery.html` | Editorial cards, delivery areas and order methods. Talabat, Snoonu and Rafeeq links are literal `#` placeholders with no JavaScript binding. Exact working destinations already exist on the homepage. |
| `/ramadan-eid.html` | Campaign; long headings and a 40px-padded callout containing a long catering CTA create narrow-screen pressure. |
| `/faq.html` | Static visible question/answer prose; shared navigation/footer and long question headings. This route is not the homepage's accordion. |
| `/privacy.html` | Short legal prose with shared navigation/footer; inline hero styling. |
| `/terms.html` | Short legal prose with shared navigation/footer; inline hero styling. |
| `/blog` | Generated feed using `blog.html`; 25px article padding, 200px cover backgrounds and linked titles. |
| `/blog/history-of-luqaimat` | Generated article using `server.js`; inline 2.8rem H1, English prose, shared navigation/footer. |
| `/blog/best-arabic-sweets-gifting` | Generated article; same structure with a longer headline. |
| `/login.html` | Standalone inline stylesheet, not `styles.css`; sign-in/register/forgot/reset states. Inputs use 0.93rem and labels lack `for`. Small forgot/back/tab controls. Brand panel is already hidden below 900px. |
| `/account.html` | Standalone inline stylesheet; anonymous client redirects to login. Header has no wrapping, panels retain 40px padding, horizontal sidebar uses clickable nonfocusable `li`s, labels lack `for`, input font size unspecified. |
| `/thankyou.html` | Standalone order-status card; `body { overflow:hidden }`, 60px/40px padding and no small/short-screen adaptation can clip order status or return action. |
| `/luqaimat-qatar.html` | Generated from `templates/luqaimat-main.html` and cakes shell. The local active product set has zero Luqaimat products, so the existing unavailable message and noindex state must remain valid. |

All ten generated product detail routes were identified from the actual local active records:

- `/menu/cake-crunchy-choclate-17`
- `/menu/mini-sandwich-20`
- `/menu/variant-test-cake-36`
- `/menu/variant-test-cake-37`
- `/menu/hot-cheese-kunafa-38`
- `/menu/pistachio-baklava-1kg-box-39`
- `/menu/date-maamoul-12-pcs-40`
- `/menu/basbousa-slice-41`
- `/menu/zaatar-manakeesh-42`
- `/menu/spinach-fatayer-dozen-43`

The two existing “Variant Test Cake” records are part of the local snapshot, not newly introduced products. Product pages share a generated breadcrumb, photograph, name/description/price, Add to cart control, existing bilingual copy, and up to six related cards. Their CTA delegates to the same shared variant/cart functions as the catalogue. All original names, prices, product records and stable ID-based routes must remain unchanged.

## Priorities before implementation

| Priority | Source finding | Scope |
| --- | --- | --- |
| P0 | Navigation opens by class toggle without a complete focus/scroll/dismissal lifecycle; historical toggle markup includes a nonsemantic `div`. | Shared public shell, including generated pages. |
| P0 | Order confirmation locks body overflow and cannot naturally scroll on short/landscape screens. | `thankyou.html` |
| P0 | Account header can exceed phone width; tab selectors cannot be reached by keyboard. | `account.html` |
| P1 | Three delivery partner actions do not navigate to a partner. | `delivery.html` |
| P1 | Contact/branch phone text cannot directly launch a call; existing map embeds lack accessible titles. | Contact and all branches. |
| P1 | Mobile rules cannot override inline hero heading sizes; long headings/CTAs and rigid card minima need constrained sizing/wrapping. | Editorial, campaigns, branches, blog articles. |
| P1 | Global mobile padding reserves 100px at the bottom of every container for a bottom bar, irrespective of whether the page has one. | Shared stylesheet pages. |
| P1 | Login/account labels are not associated with inputs; small input text risks iOS zoom; validation alerts lack consistent announcement/focus handling. | Standalone authentication/account pages. |
| P1 | Inline footer 13.6px text, 12.8px addresses, small icon targets and physical alignment/padding need scoped mobile/RTL adjustments. | Repeated public footers. |
| P2 | Repeated 60px editorial margins, large card/callout padding and physical `margin-right` CTA gaps create excess scroll or unbalanced RTL spacing. | Editorial/campaign/branch templates. |
| P2 | Standalone page animations do not consistently honor reduced motion. | Login/account/order confirmation. |

These findings were established by source inspection. Overflow magnitude, final target sizes, keyboard behavior, visual preservation and regression status require browser measurement before being reported as fixed.

## Language implementation

`script.js` reads `?lang=en` or `?lang=ar`, stores the choice in `catharei-lang`, applies `html[lang]`/`html[dir]`, and translates elements carrying existing `data-i18n` / `data-i18n-ph` keys. `setLanguage()` changes the current URL query and reloads. Links do not need new language URLs because local storage persists the choice.

The site has **partial English/Arabic support**, not complete Arabic translations for every page. Shared navigation, cart labels and product names/descriptions have existing translation support; several campaigns/branches contain explicit Arabic passages. Editorial prose and blog articles mostly remain English. Login has no translation attributes; account has only two, and order status has two. Preserve the current system and content; do not claim full translation coverage. Mixed English text/numbers, existing Arabic passages, RTL navigation and commerce controls need testing without inventing translation copy.

## Aliases, administration and error states

Existing redirects include `/index.html` → `/`, `/blog.html` → `/blog`, both legacy `.html` blog article paths, `/navigation/customized_cakes.html` → `/navigation/cakes.html`, and `/navigation/special.html` → `/menu.html`. Canonical product slug corrections preserve query strings. These behaviors are protected.

`/admin.html` is server-protected by the admin session and redirects anonymous visitors to `/login.html?redirect=admin`. Its source is inventoried as a protected nonpublic template; this audit does not require using a real admin account or changing admin/business logic.

Missing blog articles return a bare “Post not found” heading with status 404. Unknown products and routes fall through to Express's 404. There is no existing branded error page or standalone search route. Catalogue/search empty states live inside the menu. Database failure paths return existing 503/noindex/Retry-After behavior. These states should retain their status/robots behavior; no new URLs or redesigned error templates are necessary for mobile refinement.

## Protected-content verification

Use the inventory to compare the final title, meta, canonical, schema, heading text and analytics values. Legitimate additions of `tel:`/`mailto:` links around existing contact text and replacement of delivery `#` links by exact homepage partner URLs should be separately documented as necessary interaction repairs. All other original internal link destinations are protected. No changes to robots, sitemap generation, product values, posts or SEO rendering are required by this source audit.

The inventory and findings above were written before implementation. After the parent captured browser baselines, the following scoped repairs were implemented in `contact.html`, the three `locations/*.html` pages and `delivery.html`:

- Wrapped the existing contact email and four existing phone numbers in native `mailto:` / `tel:` links, preserving the exact visible business information. Phone numbers have `dir="ltr"` for stable digit ordering in Arabic mode.
- Added accessible branch-specific titles to the existing map iframes without altering map coordinates or directions destinations.
- Restored the missing opening `<header class="site-header">` in the Al Wakrah document, matching its existing closing tag. This is a necessary shared-header markup repair; its content and destinations are unchanged.
- Replaced the three delivery `#` placeholders with the exact corresponding Talabat, Snoonu and Rafeeq URLs already present on the homepage, using the homepage's new-tab behavior and `rel="noopener"`.

These link changes are necessary technical repairs to existing advertised contact/order actions, not new business content or invented destinations. `tests/mobile-protected-content.test.js` explicitly allows only these documented destination changes and accessibility fragment additions while checking preservation of the protected source content. All four invariant tests passed immediately after these repairs; final browser coverage and final regression results belong in `MOBILE_UX_OPTIMIZATION.md`. The issue list remains a record of the original state.

## Original asset availability and payload audit

`tests/mobile-performance.cjs assets` reads local file sizes and image dimensions without changing the files. Its detailed output is `tests/mobile-artifacts/performance/assets.json`. There are 286 files under `images/`, totaling 57,457,669 bytes on disk. This is **not** a page transfer measurement. Four showcase MP4s account for 47,634,572 bytes; 240 existing cake-animation WebP frames account for 7,958,892 bytes. The current homepage does not contain the cake canvas/section, so those frame assets are not automatically a homepage network cost. The desktop/mobile hero WebPs are 210,402 / 203,320 bytes. Several product sources are 4096×2730 despite much smaller display sizes; their largest local source is 295,714 bytes. Original assets were preserved.

Missing local references found before any image substitutions:

| Missing reference | Use in source |
| --- | --- |
| `images/hero/hero-sweets.webp` | Editorial/branch hero backgrounds and blog cover references. |
| `images/hero/hero-cakes.webp` | Catering hero background. |
| `images/products/1775125327728-831885018.webp` | Existing homepage/menu category image references. |
| `images/salwa-storefront.jpg` | Contact page structured-data image reference. |
| `images/wakrah-storefront.jpg` | Contact page structured-data image reference. |
| `images/kharaitiyat-storefront.jpg` | Contact page structured-data image reference. |
| `images/products/example.webp` | Admin example/placeholder reference. |

These missing originals need the correct source files from the site owner. Replacing them with different images, rewriting structured data or inventing business imagery would exceed the visual/content preservation requirements. No substitutions were made. Runtime measurements must distinguish missing assets from deliberate below-the-fold lazy loading.
