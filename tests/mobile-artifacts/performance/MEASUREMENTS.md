# Mobile QA measurements — 11 October 2026

These measurements apply to the local isolated preview at `http://127.0.0.1:3117`. They are not production field data. Source data was copied into a QA database without customer/order records; external order notifications were disabled. Browser analytics requests were blocked. The application dependency manifest and lockfile were not changed to install audit tools.

## Lighthouse lab results

Lighthouse 13.5.0, headless Chrome 154.0.0.0 on Windows. One cold-load run for each route, using Lighthouse's simulated mobile preset: 412×823 CSS pixels, DPR 1.75, 150ms RTT / 1,638.4Kbps throughput model, 4× CPU slowdown. The large Chrome viewport matrix and initial WebKit layout matrix had completed before Lighthouse began; a short separate commerce regression test ran during part of the measurement window. No Lighthouse runtime errors or run warnings were reported.

| Route | Performance | Accessibility | Best practices | SEO | LCP | CLS | TBT | Transfer |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `/` | 66 | 98 | 100 | 100 | 5.86s | 0 | 156ms | 1,167,353 bytes |
| `/menu.html` | 88 | 99 | 100 | 100 | 3.68s | 0.0221 | 0ms | 1,798,952 bytes |
| `/locations/al-aziziya.html` | 89 | 98 | 96 | 100 | 3.46s | 0.0016 | 0ms | 925,973 bytes |
| `/blog/history-of-luqaimat` | 88 | 98 | 96 | 100 | 3.17s | 0.0021 | 0ms | 440,018 bytes |

Accessibility and SEO meet the requested synthetic targets in these four runs. The Performance ≥90 and LCP ≤2.5s targets were **not achieved in these local runs**. All measured CLS values were below 0.1. TBT is a lab responsiveness diagnostic, **not INP**. No INP, p75 Core Web Vitals, real-device performance, or production Lighthouse result was measured. There is no pre-change Lighthouse run, so no quantitative before/after speed improvement is claimed.

The homepage report attributes delay to blocking shared/homepage CSS, externally hosted font stylesheets including a chained Josefin Sans import, and existing oversized product/poster images. Its image-delivery estimate identifies approximately 531KB of potential savings. These estimates are recommendations, not implemented image transformations. Original imagery was retained. The local site has missing original background/category references; Google fonts/maps and absolute production image URLs remain external. Production hosting compression/caching and the same-origin relationship between generated image URLs and the deployed site can produce materially different results. Restore missing original assets and measure the deployed page before interpreting these scores as customer experience.

Lighthouse's remaining accessibility score deductions concern existing footer heading-order best practices. Heading text/content was preserved. Complete reports are `lighthouse-home.html`, `lighthouse-menu_html.html`, `lighthouse-locations_al_aziziya_html.html`, and `lighthouse-blog_history_of_luqaimat.html`, with JSON counterparts and `lighthouse-summary.json`.

## Automated accessibility

axe-core 4.14.0 ran WCAG 2 A/AA, 2.1 A/AA and 2.2 AA rules against **37 public routes in English and Arabic modes: 74 states**, at 390×844 in headless Chrome with touch/mobile emulation and reduced motion. All returned 200. Account pages used a browser-only signed-in fixture; cart/checkout had a browser-local cart fixture. The scans included partial Arabic support as implemented, without inventing translations. Relevant states were rerun after fixes and merged into `axe-summary.json`.

Final result: **zero automated violations and zero scan errors** across all 74 states. The initial scan caught cart accessible-name mismatch, unsupported ARIA on footer icon spans, an unnamed existing bottom-cart link, small text contrast issues and ambiguous inline links; fixes were verified with reruns. `axe-preflight-summary.json` retains that initial finding summary. Per-route/language JSON reports include affected-node details and manual-review/incomplete checks.

Zero automated violations does not establish full WCAG conformance. Image/video contrast, some label interpretation, cross-origin frames, captions and manual keyboard/screen-reader/device checks remain outside what the automated scans prove.

## WebKit engine verification

The official Playwright **WebKit 26.5** build was downloaded into a temporary QA browser folder. This was a Windows WebKit engine test, **not genuine iOS Safari or real iPhone hardware**.

- All 37 public routes at 390×844 English.
- Twelve representative templates at 320×568 Arabic and 844×390 landscape English.
- **61 layout states**, with no document horizontal overflow and no JavaScript page errors.
- English and Arabic navigation open → Escape close → focus returns to the menu control.
- English and Arabic product Add → variant dialog → Escape returns focus → reopen → select size → Add persists the expected variant in local cart storage.

WebKit exposed an issue Chrome did not: clicked buttons need not become `document.activeElement`, so focus restoration needed an explicit opener. The shared menu/modal implementation was corrected and all four WebKit journey checks passed. The local catalogue has no configured variants; variant journeys used a browser-only dataset fixture, without changing product records or submitting an order. Final landscape states were refreshed after the last input-font adjustment. Evidence is in `../webkit/results.json` and representative screenshots.

No physical iOS/Android device, virtual keyboard, VoiceOver/TalkBack session or physical safe-area behavior was available for testing. Browser engine/emulation coverage should not be represented as proof of those environments.

## Source and asset integrity

`node --test tests/mobile-protected-content.test.js` passed all four tests after implementation: metadata/schema/heading text/analytics unchanged on all 25 source templates; original link destinations preserved except documented phone/email additions and delivery placeholder repair; robots/sitemap/posts/SEO renderer bytes unchanged; all active product records and stable product paths unchanged.

`assets.json` records original file availability, dimensions and on-disk payloads. The missing original asset list and scoped branch/contact/delivery technical repairs are documented in `MOBILE_ROUTE_AUDIT.md`. No replacement artwork, business information, product data or translation copy was introduced by the audits.
