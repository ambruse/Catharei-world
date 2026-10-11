import json, pathlib
R=pathlib.Path(__file__).resolve().parent.parent
O=R/'SEO_OPTIMIZATION_2026-10-11'
def read(p):return json.loads(p.read_text(encoding='utf-8'))
def put(n,s):(O/n).write_text(s.strip()+'\n',encoding='utf-8')
before=read(O/'before/performance/lighthouse-summary.json')['results']
after=read(O/'after/performance/lighthouse-summary.json')['results']
rows=[]
for a in after:
    b=next(b for b in before if b['route']==a['route'])
    rows.append(f"| {a['route']} | {b['scores']['performance']} → {a['scores']['performance']} | {b['metrics']['lcp']['value']/1000:.2f}s → {a['metrics']['lcp']['value']/1000:.2f}s | {a['metrics']['cls']['value']:.4f} | {a['metrics']['tbt']['value']:.0f}ms | {a['scores']['accessibility']} / {a['scores']['seo']} |")
put('TEST_RESULTS.md',f'''# Executed validation — 11 October 2026

## Project and functional checks

- **31/31 Node tests passed**, no skipped tests, final log `unit-tests.log`. Invoked bundled Node with `--test tests/*.test.js`, `NODE_PATH` pointing to bundled dependencies and `CATHAREI_PLAYWRIGHT=playwright`.
- Syntax checks executed successfully for `server.js`, `script.js` and `catalogue-seo.js`. All inline template JavaScript is compiled by the existing test suite. JSON-LD parsing, unique canonical/title/description, public links/assets, sitemap eligibility, private-file denial, product visibility, database error responses and language preservation passed.
- Tests persist a guest order only in a disposable database and suppress external notifications. Active local product hashes and generated product URLs match the protected pre-task inventory. No original database or real order was changed.
- New variant fixtures establish that size variants do not advertise AggregateOffer and ordinary products retain their real-price Offer. Conditional Luqaimat article links appear only with active matching inventory. Article dateModified and breadcrumb assertions passed. Google Rich Results Test/merchant eligibility was not independently certified.
- `seo-one-time-analytics.cjs`: two EN/AR browser journeys passed, including actual selected-size values, quantity increase/decrease, full removal and Undo, failed/successful order responses, double-click suppression and exclusion of personal information. Pending submission does not fire purchase. Six paired viewport screenshots for home/menu/checkout were pixel-identical in this isolated tracking comparison. Analytics requests were intercepted; this is not DebugView ingestion evidence.
- Nine navigation checks passed (`interactions/navigation-results.json`): menu availability during pending catalogue request, focus/close/scroll handling, keyboard and touch interactions, language behavior and no unhandled browser errors. Exact check names are in the JSON and navigation.log.
- No project build, lint or typecheck script is configured. These were not reported as passed. No deployment was performed.

## Mobile and accessibility

`seo-one-time-mobile.cjs` reran **680 route/viewport/language cases**: 320, 360, 375, 390, 393, 414, 430, 768 pixels, representative 600/844/1440 widths, landscape, aliases and error routes. **Zero document horizontal-overflow cases and zero unhandled browser errors.** Full route inventory and per-case measurements/screenshots: `mobile/`.

`seo-one-time-regressions.cjs axe`: **74 scans**, English/Arabic at 390×844, **zero automated WCAG A/AA violation rules** and no execution errors. Review-required/incomplete checks remain in raw reports. Automated scans do not establish full WCAG conformance.

Equivalent Playwright WebKit engine on Windows: **61 viewport checks and four EN/AR interaction journeys passed**, no overflow or unhandled errors (`webkit/results.json`). Physical iPhone Safari, Android hardware keyboards/GPS and production network behavior were unavailable. These results are not real-device certification. Existing blank-map canvas concerns from earlier QA remain outside the claims of this SEO task.

## Visual preservation

Sixteen full-page before/after screenshots at **390×900 and 1440×900** were captured for home, menu, Arabic sweets, cakes, Al Kharaitiyat, blog feed and both articles. Pixel comparison is saved in `visual-diff.json`.

- Homepage is pixel-identical at both widths; menu, Arabic sweets, cakes and branch mobile captures are also identical.
- Article/feed heights intentionally increase because of additional helpful content, descriptions and visible updated date. Existing imagery, titles, colours, fonts and content containers remain recognizable.
- Four desktop captures are not byte/pixel-identical; their total dimensions remain unchanged. Difference bounds are recorded. Manual inspection of paired desktop cake/header images and the mobile article/home confirmed preserved layout and brand styling. External map rendering, loaded assets and text rasterization make a strict all-pixel guarantee inappropriate; those four pairs are not reported as exact matches.
- The CATHAREi navbar text remains. Original homepage HTML/hero, colour tokens, layout CSS declarations and image files are unchanged. The only shared stylesheet edit removes an unused font import. A 74-page pre-removal computed-font check and the subsequent 680-case matrix found **zero Josefin uses**.

## Performance: lab measurements, not field results

| Route | Performance before → after | LCP before → after | Final CLS | Final TBT | Final accessibility / SEO |
|---|---|---|---|---|---|
{chr(10).join(rows)}

Configuration: Lighthouse 13.5, local desktop Chrome mobile simulation, 412×823 CSS viewport / DPR 1.75, simulated 150ms latency / approximately 1.6Mbps / 4× CPU slowdown; exact configuration and version are in raw JSON. Analytics blocked, external fonts/images remain variable. Baseline and final passes each contain one run per route, **not statistically controlled medians**. A preload experiment did not improve results and was reverted; its artifacts remain in `after/performance-preload-trial`. A concurrent QA measurement is separately retained in `after/performance-concurrent-check`; the table uses the later isolated pass.

The unused Josefin stylesheet request is demonstrably eliminated. Do not attribute every score or transferred-byte difference to that removal. **Homepage LCP still exceeds the target and its score did not improve.** Remaining render-blocking styles/fonts, animation/render timing and real production conditions need further focused work. Public production CSS is already Brotli-compressed by the edge; localhost transfer results must not be mistaken for production compression behavior. No INP, CrUX p75 or production CWV pass was measured. TBT is not INP.

## Reproduction

Start `tests/start-mobile-preview.cjs` with a free `MOBILE_PORT`; it uses disposable catalogue-only data and blocks notifications. Set `MOBILE_ORIGIN=http://127.0.0.1:PORT` and bundled Playwright `NODE_PATH`. Then run:

```text
node --test tests/*.test.js
node tests/seo-one-time-analytics.cjs
node tests/seo-one-time-mobile.cjs after       # MOBILE_ALL_WIDTHS=1
node tests/seo-one-time-regressions.cjs navigation
node tests/seo-one-time-regressions.cjs axe
node tests/seo-one-time-regressions.cjs webkit # configured WebKit browser cache required
node tests/seo-one-time-lighthouse.cjs after  # QA-only Lighthouse runtime required
```

New output goes under this one-time report directory. Do not run the live collector against private/admin/order endpoints. Source snapshots are for comparison/rollback, not a replacement production database or automatic deployment.
''')

put('CHANGES_IMPLEMENTED.md','''# Actual source changes and handover

All paths below are relative to `C:/Users/WORK/Downloads/Catharei-world-main/Catharei-world-main`. Full source diff: `SOURCE_CHANGES.diff`. Initial copies: `before/`. No Git repository or initial commit exists in this retrieved folder. These are **new changes in this one-time project**, not earlier session work.

| File | Affected URL / scope | Existing issue and evidence | Exact improvement | Test / status / remaining risk |
|---|---|---|---|---|
| `admin.html` | Private admin | GA4 export has 7 admin views / 24 events; both tags installed | Removed direct GA4, GTM script and noscript iframe | Static tag assertion passed; admin logic untouched. Existing historical pollution cannot be erased by source edits. |
| `script.js` | Product detail/modal and cart → checkout | Cart deltas/removal/Undo unmeasured; base zero sent for unselected sizes | Added remove_from_cart and actual quantity/restore events; omit unselected variant price/value | Unit + EN/AR browser payload/cart assertions passed. GA4 receipt/consent/GTM duplication still requires authorized account debugging. |
| `catalogue-seo.js` | `/menu/:slug` | AggregateOffer incorrectly describes size variants | Omit offers for products requiring a size selection; retain visible prices and ordinary real-price Offer | New real-server fixtures passed. Variant rich-result eligibility remains limited until distinct selectable variant URLs are designed/approved. No ratings or availability invented. |
| `posts.json` | `/blog/history-of-luqaimat`, `/blog/best-arabic-sweets-gifting`, `/blog` | Thin article structure; Luqaimat 18/2,197, position 6.09; gifting lacks planning/service links | Updated descriptions; sourced cultural context replaces unsupported judge anecdote; useful headings, portions/timing/allergen questions, English/Arabic links; actual modification date | Rendered HTML, crawlable links, schema, mobile, axe and screenshots checked. Original article titles, slugs, cover images and publication dates preserved. Search effect unmeasured. |
| `seo.js` | Both articles | No breadcrumb JSON-LD or modified date | Home/Blog/article BreadcrumbList and dateModified matching visible update | JSON parsing/escaping and rendered assertions passed. Not a Google rich-result approval. |
| `server.js` | Blog feed and Luqaimat article | Feed skips h2; article lacks conditional direct Luqaimat landing link | h3→h2 with same explicit styling, visible updated date, database-backed conditional link using existing product matcher | Active/inactive fixture and browser checks passed. DB failure omits optional link while retaining article. Order/auth/payment handlers unchanged. |
| `styles.css` | Pages using shared CSS | Blocking Josefin CSS import; 74 computed-font checks show no current use | Removed only the unused network import; all style rules, actual fonts, brand and hero preserved | 680 cases, before/after visual checks, Lighthouse. Removes a request; homepage LCP target still missed. |
| `navigation/special_cakes.html` | Existing special-cakes route | Two internal hrefs resolve through known redirects | Links now target existing `/menu.html` and `/navigation/cakes.html`; labels/options preserved | Link guard and route tests passed. Empty category still requires business decision; no forced indexing or migration. |
| `templates/luqaimat-main.html` | Existing `/luqaimat-qatar.html` | No context link to its informational article | Added descriptive reciprocal history link | Public target 200; fixture rendering and mobile checks. Landing page remains inventory-aware. |
| `.gitignore` | Local exports/reports | New input/report directories not ignored | Added SEO_INPUT and this one-time report directory | Reviewed exact diff; no existing source removed. No Git repository presently exists; rules protect future initialization. |

## Tests and evidence tooling

Modified existing tests: `tests/commerce-analytics.test.js`, `tests/seo.test.js`, `tests/mobile-protected-content.test.js`. New exact exception file: `tests/seo-optimization-approved.json`. This preserves original protections and accepts only the reviewed SEO hashes/admin tracking change and two known alias replacements; it does not disable the content guards.

New task tools: `tests/seo-one-time-discovery.py`, `tests/seo-one-time-content.py`, `tests/seo-one-time-browser.cjs`, `tests/seo-one-time-lighthouse.cjs`, `tests/seo-one-time-live.cjs`, `tests/seo-one-time-analytics.cjs`, `tests/seo-one-time-fonts.cjs`, `tests/seo-one-time-mobile.cjs`, `tests/seo-one-time-regressions.cjs`, `tests/seo-one-time-report.py`, `tests/seo-one-time-handover.py`. They preserve evidence, reproduce checks and generate these records; no new runtime dependency was installed.

All nine requested Markdown reports are present. Additional evidence includes raw extracted tables/hashes, query mapping CSV, URL-level redirect/canonical evidence, screenshots, visual diff, full Lighthouse reports and source diff. They remain local/private rather than exposed by the public server.

## Explicitly preserved or outstanding

- Current homepage hero, CATHAREi navbar wording, brand identity, product records/prices, images, canonical URLs, robots, sitemap source, payment, order calculations, customer sessions and free-map implementation were not redesigned or replaced.
- Category/menu/location titles were already specific and commercially relevant in the retrieved source. Their unchanged historical low CTR was not used to justify repeated speculative edits.
- Existing earlier view_item/add_to_cart/begin_checkout/order_submitted hooks were retained and tested; this project's incremental repairs are described above.
- No purchase event: no authoritative completed/paid transaction and durable deduplication lifecycle available. No sales/revenue uplift is claimed.
- Eleven live two-hop redirects involve edge/app normalization. Provider configuration access is needed; not fixed by this source change.
- Full Arabic server rendering/hreflang, verified branch hours/address reconciliation, physical mobile-device checks and production field CWV remain outstanding.
- No deployment, new URL, new scheduling automation, paid SEO service or paid mapping API was introduced.

Review the source diff and test results before deploying. Use the existing production database/uploads. Measure impact at 14 and 28 days **after actual deployment**, following FOLLOW_UP.md. There is no observed ranking or traffic improvement yet.
''')

# Append final measured result and superseded experiment explicitly to the initial decision record.
p=O/'PRIORITIZATION_BEFORE_EDITS.md'
s=p.read_text(encoding='utf-8')
if '## Final disposition' not in s:
    p.write_text(s+'\n## Final disposition\n\nThe font preload experiment was reverted after it failed to demonstrate improvement. A subsequent 74-page computed-style audit established that Josefin was unused; the final change removes the shared import. Visible prices remain entirely unchanged; only unsupported size-variant offer schema is omitted. The three discovered URLs were supplied by the user and checked directly. All final details supersede proposals in this initial record.\n',encoding='utf-8')
print('Final handover reports written')
