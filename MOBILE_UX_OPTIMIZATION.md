# CATHAREi mobile UX optimization

Audit and implementation completed locally on 11 October 2026 in the existing Express, HTML, CSS and JavaScript architecture. The initial findings below were recorded before production files were edited; verified results and outstanding release limitations follow.

## Reapplied after folder recovery — 11 October 2026

The recovered folder contained earlier versions of the edited application files. The original session's saved patches and source-edit commands were recovered, staged, syntax checked, and reapplied. The surviving map controller, stylesheet, address validator, geographic data and QA scripts were retained. MapLibre 6.13.0 and its lockfile were restored. A pre-edit source backup is retained outside the website under this task's `source-recovery/backup` artifact directory. No customer database was replaced or production order submitted.

Fresh verification of the restored implementation:

- Repository suite: **25/25 passed**, including the real browser regression and protected content/product checks. Original analytics and structured-data blocks retain their exact source text, including line endings.
- Navigation: **9/9 passed**. Commerce: **16/16 passed** in English/Arabic, with orders written only to a disposable database and notifications suppressed.
- Chrome layouts: **680 cases**, zero document overflow, zero unhandled page errors, and no visible phone-width text inputs below 16px. Evidence: `tests/mobile-artifacts/restored/results.json`. The recovered folder also contains three legacy category alias files, so this run includes 40 route entries plus four error/access cases, compared with the earlier 37-entry inventory.
- Accessibility: **74 public-page scans and six map-state scans**, zero automated WCAG A/AA violations.
- Map checkout: **32 Chrome checks**, six failure-recovery checks, and **32 equivalent WebKit checks** on the completed rerun. The first WebKit run intermittently reported a clipped landscape confirmation after repeated viewport resizing; a dedicated geometry check and unchanged full rerun passed. Physical orientation/keyboard testing remains necessary.
- Visual preservation: manually inspected mobile homepage/menu/cart comparisons match the earlier edited versions. At desktop, five of six sampled first viewports have zero changed pixels compared with the previous session's final screenshots; the menu differs by 22 pixels (0.00181%). All six full-page heights match. Evidence: `tests/mobile-artifacts/restored/previous-session-desktop-diff.json` and `compare-*.png`.

The prior **WebKit map canvas screenshot limitation remains unresolved**; interaction passes are not a Safari visual pass. No physical iPhone/Android testing or new Lighthouse measurement was performed during restoration. Earlier performance measurements below remain historical and their unresolved targets still apply. Local verification uses port 3119; this work has not been deployed.

## Discovery and baseline

- Programmatic source inventory: `tests/mobile-route-inventory.json`; browser route list: `tests/mobile-artifacts/before/routes.json`.
- 37 current public routes/states: static pages, both blog articles, ten locally active generated product pages, and the conditional Luqaimat route. The protected admin template is inspected separately. Legacy redirects and unknown routes also require regression checks.
- Baseline: 79 Chrome page/width/language combinations, with screenshots at 320, 390, 768 and representative 1440px widths. `tests/mobile-artifacts/before/results.json` records measurements and errors. These are browser emulations, not physical devices.
- The preview uses a temporary database containing catalogue/showcase records only; order notifications are suppressed. Existing customer records, production orders and the source database are not changed.
- The supplied catalogue differs from the live site's selection. All local product records and source assets will be preserved. Some existing records contain external placeholder or missing image URLs.

## Prioritized findings recorded before implementation

P0: delayed navigation initialization waits for the products API; inaccessible drawer toggle/close/focus behavior; wrong relative cart/image paths on nested routes; horizontal overflow in cart, menu, account, narrow contact/branch/blog and campaign pages; checkout language function missing; confirmation-page duplicate global declaration stops status initialization.

P1: mobile menu search hidden; two-column product cards use very small text/buttons; cart text is dark on black and quantity buttons too small; mobile footer inline four-column style wins over responsive rule; global 100px padding creates repeated blank space; fixed-size editorial headings and min-width grids exceed narrow screens; forms lack associated labels and 16px inputs; overlays lack focus/scroll/safe-area handling; branch phone/email text is not actionable; delivery partner links are placeholders despite valid destinations on the homepage.

P2: reduced motion is not honored by shared animation JavaScript; sticky elements and modal heights use inflexible viewport sizing; dropdowns depend on hover; toast/FAQ semantics and RTL directional spacing need refinement.

Existing gaps at baseline: coupon and Update cart buttons had no backing handlers; some content remains English in Arabic mode because no translation exists. No pricing, coupon acceptance rules or business information was invented.

## Implemented refinements

| Files / shared components | Implemented change and purpose |
| --- | --- |
| `script.js` — navigation | Essential handlers run before catalogue requests finish. Existing drawer gains semantic buttons, expanded states, an outside-tap backdrop, Escape, focus containment/return, background inertness, scroll locking/restoration and breakpoint cleanup. Existing header search moves into the drawer on phones and submits to the existing menu search. Desktop placement is restored at its original breakpoint. |
| `script.js` — modal lifecycle | One stack handles existing product, size and checkout overlays. Closing a nested size dialog returns to its product dialog without unlocking the page behind it. Explicit invokers handle WebKit's different click-focus behavior. |
| `script.js` — cart / accessibility | Cart targets and image paths resolve correctly from nested routes. Quantity updates preserve focus; removal offers Undo, including decrementing the last unit. Existing top and bottom cart badges stay synchronized. Form/control names, visible focus, FAQ relationships, skip links and live announcements are added. |
| `styles.css` | Scoped mobile typography, touch targets, flexible editorial headings/grids, wrapping, footer columns, readable cart rows/totals, safe-area padding, scrollable dialogs, RTL spacing and short-landscape inputs. Removed unconditional 100px padding on every mobile container. Existing bottom navigation is retained only on templates that already contain it, with correct stacking and bottom clearance. |
| `homepage.css` | Original photograph, hero concept, title content, fonts, section order and colors retained. Hero text wraps within the viewport, CTAs appear sooner, section gaps are reduced, featured products become one column on narrow phones and secondary text becomes readable. Contrast fixes use colors already present in the site's palette. |
| `menu.css`, `menu.js`, `menu.html` | Existing mobile search is visible; category rail remains scrollable; narrow product cards have readable names/prices/actions and uncropped photography. Existing product detail remains the same overlay with improved sizing/focus. Rapid duplicate openings/additions are guarded. Existing product links retain native keyboard navigation. The overflowing card glow is contained at its source. |
| `checkout.html` | Labels, autocomplete, input modes, 16px inputs, native validity and duplicate-submission protection. Existing shared language system now works; original English copy is retained. Map library failure no longer prevents checkout initialization. Phone verification preserves fields when dismissed. Existing backend payload, payment choices and order polling remain in place. |
| `login.html`, `account.html`, `thankyou.html` | Standalone inline styles receive their own mobile fixes. Header/panels wrap, account tabs/reset controls are keyboard operable, labels and announcements are associated, short screens scroll, reduced motion is honored. Order confirmation now initializes correctly and account history accepts the checkout's existing `qty` field. |
| `contact.html`, `locations/*.html`, `delivery.html` | Existing numbers/email are native phone/email links; maps are titled; Al Wakrah's missing opening header tag is restored. Three dead delivery placeholders use exact partner destinations already on the homepage. |
| `toasts.css` | Toasts fit narrow screens and safe areas; Undo has an adequate touch target; standalone pages receive the same hidden-until-focused skip link. |

No frontend framework, production dependency, server endpoint, database record, pricing rule, image asset, logo, font family, URL route or section hierarchy was replaced. Existing analytics remain in source; QA blocks analytics requests to avoid polluting reporting.

## Necessary technical exceptions

These repairs change broken implementation details, not public route structure or business content:

1. Relative cart/image paths now resolve to the original root destinations on nested pages.
2. Delivery `#` placeholders now use the exact existing homepage partner URLs. Existing phone/email text gained matching `tel:`/`mailto:` destinations. No calls or external orders were placed.
3. Checkout uses the existing translation script, with its local cart binding renamed to avoid a global collision. The order confirmation's duplicate `urlParams` binding was also renamed.
4. The broken OpenStreetMap `.webp` endpoint was corrected to the provider's documented `.png` tile endpoint. Provider, map location and order coordinates are preserved. [OpenStreetMap tile policy](https://operations.osmfoundation.org/policies/tiles/).
5. Account history reads the existing order item's `qty` (with legacy `quantity` fallback) so historical row totals do not show `NaN`.
6. The existing optional browser test referred to an obsolete Add button selector and a canvas absent from today's homepage. It now tests the current selector and only expects animation downloads when that legacy section actually exists.

## Route coverage

The complete route table and all ten generated product URLs are in `MOBILE_ROUTE_AUDIT.md`; machine-readable discovery and protected snapshots are in `tests/mobile-route-inventory.json`. Coverage includes homepage, full menu, four categories, all active product details, cart, checkout, login/register/reset UI, account, order confirmation, about, contact, all three branches, catering, corporate gifting, delivery, Ramadan/Eid, FAQ, privacy, terms, blog feed, both blog articles and the conditional Luqaimat page. Admin authentication, aliases, missing products/articles and unknown URLs are checked separately.

The local Luqaimat selection is empty. Its existing unavailable/noindex state was tested; records were not invented. There is no separate contact form, live payment gateway or fully translated Arabic editorial/blog version in this repository.

## Responsive and functional verification

**Chrome layout matrix:** 632 route/viewport/language cases passed with zero document-level horizontal overflow and zero unhandled page JavaScript errors. This includes all 37 public route states at **320, 360, 375, 390, 393, 414, 430 and 768px**, each in English and Arabic, plus 600px, 844×390 landscape, 1440px desktop representatives and four access/error states. A further 12 landscape checks verified the final input-size fix. All measured visible text inputs at phone widths are at least 16px. Evidence: `tests/mobile-artifacts/after/results.json`.

**Existing regression suite:** 19/19 pass, including the optional Chrome browser test. Coverage includes active/inactive catalogue records, generated pages, admin CRUD, variant pricing, guest order persistence, aliases, private access, metadata, robots, sitemap and analytics placement. Four new invariant tests compare all original template metadata/headings/schema/analytics, internal destinations (with the documented exceptions), SEO files and every active product record.

**Navigation suite:** 9/9 pass. Covers navigation while products are delayed, close button/backdrop/Escape, focus loop and restoration, preserved scroll, RTL language menu, desktop breakpoint reset, shared search, nested-page cart route, size selection/focus, quantity focus, Undo including last-unit removal, coupon feedback without changing totals, and 320×360 text-enlargement stress. Existing bottom badges are checked together. Evidence: `tests/mobile-artifacts/interactions/navigation-results.json`.

**Commerce suite:** 16/16 pass. Covers English/Arabic search matches and empty recovery; product→size nested dialogs; selected size price and double-click protection; persisted quantity and subtotal; invalid checkout inputs; verification dismissal with preserved fields; one real POST to the isolated QA backend per double-confirm attempt; successful response and cleared cart; accepted/rejected confirmation-page rendering; account/login labels and keyboard controls; correct historical quantity totals; and checkout recovery when Leaflet is unavailable. Evidence: `tests/mobile-artifacts/commerce/results.json`.

The local catalogue currently has no enabled size variants. Size-selection tests therefore use a **browser-only fixture** on an existing item (small 40, medium 60, disabled large 80); no product database is modified. Account screenshots/history use a mock signed-in response. QA order POSTs persist in a temporary database with outgoing notifications suppressed; real staff acceptance, phone calls and payment transactions were not exercised.

## Accessibility findings

Axe-core 4.14.0 scanned 37 public route states × both languages at 390×844: **74 scans, zero automated WCAG A/AA violations, zero scan errors**, after fixing reported contrast/label issues. Evidence: `tests/mobile-artifacts/performance/axe-summary.json` and individual detailed reports. Keyboard focus, dialog nesting and touch layouts also received functional/manual checks.

Automated results do not establish complete WCAG conformance. Reports retain incomplete/manual checks for image/video contrast, third-party frames and other content that axe cannot determine. CSS text enlargement and reduced-height emulation do not prove native browser zoom, a real virtual keyboard, VoiceOver or TalkBack behavior.

## Visual preservation

Before screenshots were captured before production-file edits. After screenshots use matching widths, languages and local catalogue data. Side-by-side review files are in `tests/mobile-artifacts/visual-comparison/`; originals remain under `before/` and `after/`.

Manual review confirms the same black/gold/ivory presentation, logo, font character, hero photography, product artwork, component outlines and section hierarchy. Intentional changes are mobile wrapping, padding, readable text/contrast, one-column narrow cards, cart row reflow, usable forms and navigation targets. Missing source photos and lazy image placeholders are not treated as successful image fixes.

At 1440×844, the final pixel comparison found **0 changed pixels** for the homepage, Arabic sweets category, cart and checkout's sampled first viewport. Menu/contact differences were below 0.002%; full-page heights were identical for all six sampled desktop pages. The functional map-tile correction can change imagery as external tiles arrive; external/lazy media timing is not deterministic. These are sample-based visual checks, not a claim of pixel equality for every possible dynamic state. `desktop-diff.json` stores the exact comparisons. Manual review caught a wrapped `+974` prefix; it was repaired and six matching checkout screenshots were refreshed. Prefix line-count assertions pass at 320/390px in both languages.

## Performance measurements and engine coverage

**Playwright WebKit 26.5 on Windows:** 61 layout states pass with no document overflow or unhandled JavaScript errors: all 37 public routes at 390×844 English, plus 12 representative templates at 320×568 Arabic and 844×390 landscape. Four English/Arabic navigation and product→size→cart journeys pass, including explicit focus restoration. This is equivalent-engine testing, not physical iOS Safari. Evidence: `tests/mobile-artifacts/webkit/results.json`.

**Lighthouse 13.5.0, simulated mobile, one cold-load local run per route:**

| Route | Performance | Accessibility | SEO | LCP | CLS | TBT |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Homepage | 66 | 98 | 100 | 5.86s | 0.000 | 156ms |
| Full menu | 88 | 99 | 100 | 3.68s | 0.022 | 0ms |
| Al Aziziya branch | 89 | 98 | 100 | 3.46s | 0.002 | 0ms |
| Luqaimat history article | 88 | 98 | 100 | 3.17s | 0.002 | 0ms |

Conditions: Chrome 154, 412×823 emulation at DPR 1.75, simulated 150ms RTT/1.6Mbps and 4× CPU slowdown, analytics blocked, local Express server with external Google Fonts/maps/absolute asset URLs. The source catalogue differs from production. Reports, settings and timing are retained as JSON and HTML in `tests/mobile-artifacts/performance/`. No pre-change Lighthouse run was taken, so these are final measurements, not a claimed score improvement.

The **Performance ≥90 and LCP ≤2.5s targets were not achieved** in these lab runs. Accessibility ≥95, SEO ≥95 and CLS ≤0.1 were achieved in the measured samples. TBT is not INP; no real-user LCP/INP/CLS percentiles are available. Lighthouse's remaining accessibility score deductions include the existing heading-level structure, which was preserved under the heading-content/hierarchy constraint.

Outstanding measured performance costs: blocking shared/home CSS and Google font requests, a chained Josefin font import, original product/poster images substantially larger than their displayed dimensions, and external missing/placeholder assets. The homepage report estimated 2.11s of blocking-resource savings and 518KiB of image-delivery savings. These are diagnostic estimates, not implemented gains. A further delivery-focused pass should use responsive derivatives of the authentic restored images, reduce the font/CSS request chain, and verify production compression/cache headers. Those changes are **recommendations**, not claimed completed work.

Implemented performance behavior is limited to existing components: navigation is no longer blocked by catalogue requests, showcase videos use metadata preload and visibility-aware playback, reduced-motion/data-saver handling avoids unnecessary media animation, and legacy canvas drawing is throttled. The current homepage has no legacy cake canvas; tests confirm no frame downloads, so dormant canvas changes are not claimed as a measured homepage gain.

## Unresolved source issues and verification limits

- Original files are absent for `images/hero/hero-sweets.webp`, `images/hero/hero-cakes.webp` and `images/products/1775125327728-831885018.webp`; some local product records also use remote placeholders. Missing storefront JPG references are schema-only. All are enumerated in `tests/mobile-artifacts/performance/assets.json`. Restore the authentic source files to resolve these; no substitute artwork was introduced.
- The repository has no coupon validation/service. Apply Coupon now gives visible validation/failure feedback and preserves totals; Update Cart confirms the already-persisted cart. No coupon is falsely accepted.
- Arabic coverage remains partial according to the original translations. Existing RTL interfaces and bilingual passages were checked; untranslated editorial/blog/account content remains intact.
- Physical iPhone Safari, Android Chrome, native keyboard/safe-area behavior, screen readers, production network conditions, field INP and staff order acceptance still require release testing. Local emulation and WebKit are identified separately from real devices.
- Protected admin is source-audited and access/CRUD-regression tested, rather than treated as a public storefront template. No admin redesign was undertaken.
- Changes are local. No production deployment occurred.

## Reproducing the checks

Use Node 18+ and installed Chrome. Browser scripts require Playwright; visual comparisons additionally require `pngjs`/`pixelmatch`. This session used the app's bundled QA packages via `NODE_PATH`, without adding runtime dependencies. Lighthouse/axe/WebKit were installed only in a temporary QA-tools directory.

1. `node tests/start-mobile-preview.cjs` starts a notification-suppressed, catalogue-only disposable preview at `http://127.0.0.1:3117`.
2. `npm test`; set `CATHAREI_PLAYWRIGHT=playwright` to include its browser test when Playwright is resolvable.
3. `node tests/mobile-navigation.cjs` and `node tests/mobile-commerce.cjs`.
4. Set `MOBILE_ALL_WIDTHS=1`, then `node tests/mobile-audit.cjs after` for the full layout matrix. Targeted reruns support `MOBILE_ONLY_WIDTH` and `MOBILE_ONLY_ROUTES`, merging results.
5. `node tests/mobile-visual-diff.cjs` compares retained screenshots.
6. `node tests/mobile-performance.cjs axe` / `lighthouse` / `assets`, with `MOBILE_QA_TOOLS` pointing to the temporary tools folder if needed.
7. `node tests/mobile-webkit.cjs`, with the installed Playwright WebKit browser path configured, and `node tests/mobile-checkout-visual.cjs` for the final checkout recapture.

On this Windows host, local HTTP/browser tests required execution outside the network sandbox. Initial sandbox connectivity failures were infrastructure failures; the final above results came from completed local tests.
