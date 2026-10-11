"""Produce the one-time evidence reports from executed checks, never projected metrics."""
import csv, collections, datetime as dt, difflib, hashlib, json, re
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'SEO_OPTIMIZATION_2026-10-11'
def load(p): return json.loads(p.read_text(encoding='utf-8'))
def save(name,text): (OUT/name).write_text(text.strip()+'\n',encoding='utf-8')
def table(headers,rows):
    return '| '+' | '.join(headers)+' |\n| '+' | '.join(['---']*len(headers))+' |\n'+'\n'.join('| '+' | '.join(str(v).replace('|',' / ').replace('\n',' ') for v in row)+' |' for row in rows)
sources=load(OUT/'source-data.json')
gsc=next(s for s in sources if '-Performance-' in s['file'])['sheets']
live=load(OUT/'live/live-audit.json')
products=load(OUT/'live/live-public-products.json')
def window(days,offset=0):
    end=dt.date.fromisoformat(gsc['Chart'][-1][0])-dt.timedelta(days=offset)
    start=end-dt.timedelta(days=days-1)
    rows=[r for r in gsc['Chart'][1:] if str(start)<=r[0]<=str(end)]
    c=sum(r[1] for r in rows);i=sum(r[2] for r in rows)
    return [str(start),str(end),len(rows),int(c),int(i),f'{c/i*100:.3f}%']
low_paths=['/navigation/Arabic_sweets.html','/blog/history-of-luqaimat','/menu.html','/locations/al-kharaitiyat.html','/locations/al-aziziya.html','/navigation/cakes.html']
low=[r for r in gsc['Pages'][1:] if r[0].replace('https://www.catharei.com','') in low_paths]
initial=collections.Counter(r['chain'][0].get('status') for r in live['results'])
final=collections.Counter(r['chain'][-1].get('status') for r in live['results'])
chains=[r for r in live['results'] if len(r['chain'])>2]
coverage=next(s for s in sources if '-Coverage-' in s['file'] and 'Drilldown' not in s['file'])['sheets']
rows=[]
for s in sources:
    if 'sheets' in s:
        for name,data in s['sheets'].items(): rows.append([s['file'],name,len(data)-1])
    elif s['file']=='relatedEntities.csv': rows.extend([[s['file'],'TOP (headerless)',25],[s['file'],'RISING (headerless)',3]])
    else:
        blocks=[];current=[]
        for row in s['rows']:
            if not row or len(row)==1 or row[0].startswith('#'):
                if current: blocks.append(current);current=[]
            else: current.append(row)
        if current: blocks.append(current)
        rows.extend([[s['file'],' / '.join(b[0]),len(b)-1] for b in blocks])
save('DATA_ANALYSIS.md',f'''# Data analysis — one-time project, 11 October 2026

All ten supplied exports were read afresh, including every workbook sheet and all CSV rows. Original exports were not edited. Both `SEO_Files` and `SEO_INPUT` contain byte-identical copies (SHA-256 recorded in `source-data.json`). Actual filenames omit the extra download `(1)` suffix in the request; the second drilldown retains ` (1)`. This is equivalent input, not missing evidence.

## Scope and actionable findings

GSC daily rows span **27 June–8 October 2026 (104 days)**, despite the “Last 6 months” filter label. Daily totals: **1,123 clicks, 31,198 impressions, 3.600% CTR**. Returned query rows total 583 clicks/10,814 impressions; the export is capped at 1,000 queries and does not include all anonymized queries. Page aggregation totals 1,141/44,970. Do not reconcile unlike aggregations as duplicate visits.

Mobile contributed 855 clicks, desktop 257, tablet 11. Qatar contributed 971 clicks/21,695 impressions. Commercial relevance and mobile usability matter more than maximizing worldwide impressions.

The existing strict brand/ambiguous spelling classification in `SEO_MONITORING/REPORTS/2026-10-11/metrics-v3.json` yields 481 branded clicks/3,094 impressions, 59 ambiguous clicks/1,676 impressions and 43 other candidate clicks/6,044 impressions. These are segments of returned queries only; ambiguous names were not silently treated as non-branded growth.

{table(['Window start','End','Days','Clicks','Impressions','CTR'],[window(14),window(14,14),window(28),window(28,28),window(90)])}

These historical changes predate this implementation and are not results of our edits. A preceding 90-day comparison is unavailable.

## High-opportunity page evidence

{table(['URL','Clicks','Impressions','CTR','Average position'],[[r[0],int(r[1]),int(r[2]),f'{r[1]/r[2]*100:.2f}%',r[4]] for r in low])}

The article is close enough to page-one visibility to justify a clearer informational answer and contextual product links. Cakes is lower positioned and low volume in this export; rewriting its already specific title is not an established remedy. Branches need accurate local details, not repeated “near me” text. These exports do **not** join query and page dimensions. Keyword-to-page mapping is a proposed intent mapping, not proof that each query ranked a particular URL.

## GA4 evidence

All five GA4 CSVs state **13 September–10 October 2026**. Events: page_view 131; user_engagement 91; session_start 76; first_visit 57; scroll 31; form_start 3; click 1. No standard ecommerce events occur in this export. This does not demonstrate zero orders. The overview repeats several event/page/country tables and is not a session-channel acquisition report. Engagement time-series values appear only near the end of the period; treat instrumentation completeness cautiously.

The pages report includes `/admin.html` (7 views, 24 events, 1 user), establishing internal traffic contamination. Linked landing-page report: 354 GSC clicks/14,669 impressions; linked queries: 188/3,328. These are not comparable to the 104-day workbook. “Ad revenue” is not purchase revenue. No defensible organic-order conversion baseline is available.

## Index coverage and Trends

Coverage rows span 13 July–4 October; latest counts are 39 indexed, 118 excluded: 87 redirects, 28 canonical alternatives, 3 discovered-not-indexed. The user supplied the three missing URL examples in chat; their verified status is recorded in INDEXING_AND_CANONICALS.md. None of these categories alone proves a broken page.

`relatedEntities.csv` has 25 TOP and 3 RISING rows, category Food & Drink, with no usable geographic or period metadata. Restaurant/Qatar/Doha and broad food entities are not keyword volumes. All rows, including the first headerless row in each section, are retained.

## Every sheet and CSV block read

{table(['Source','Sheet / CSV header','Data rows'],rows)}
''')

mapping=[('best baklava in qatar','/navigation/Arabic_sweets.html','Commercial comparison','Preserved existing specific category title; useful menu links from articles'),('baklava near me','/navigation/Arabic_sweets.html','Nearby purchase','Use category + verified branch pages; no invented proximity claims'),('best baklava in doha','/navigation/Arabic_sweets.html','Commercial comparison','Existing page; no unsupported best claim'),('arabic sweets','/navigation/Arabic_sweets.html','Browse products','Current catalogue and article internal links'),('qatar sweets','/navigation/Arabic_sweets.html','Browse products','Existing category'),('bakery near me','/contact.html','Local visit','Existing three branches; no new local landing pages'),('bakery in qatar','/','Brand/local discovery','Protect homepage title and hero'),('cakes in qatar','/navigation/cakes.html','Purchase/occasion','Existing flavours, prices and occasion guidance preserved'),('cake qatar','/navigation/cakes.html','Purchase/occasion','Existing page; no repetitive new page'),('luxury sweets doha','/corporate-gifting.html','Gift enquiry','Added gifting article links and planning guidance'),('luqaimat origin','/blog/history-of-luqaimat','Informational','Clarified cultural context, section headings and source'),('luqaimat','/blog/history-of-luqaimat','Mixed informational','Preserved title; clearer description and product route'),('luqaimat qatar','/luqaimat-qatar.html','Local product discovery','Conditional article link + reciprocal history link'),('حلويات قطر','/navigation/Arabic_sweets.html','Browse products','Existing bilingual category, new Arabic article links'),('محل حلويات الدوحة','/contact.html','Local visit','Verified website branch information preserved'),('بقلاوة قطر','/navigation/Arabic_sweets.html','Purchase','Existing category'),('كيك قطر','/navigation/cakes.html','Purchase','Existing category; Arabic preserved'),('حلويات عربية','/navigation/Arabic_sweets.html','Browse products','Existing category')]
queries={r[0]:r for r in gsc['Queries'][1:]}
kw=[]
for q,url,intent,action in mapping:
    r=queries.get(q)
    kw.append([q,url,int(r[1]) if r else 'not returned',int(r[2]) if r else 'not returned',r[4] if r else 'unknown',intent,action])
with (OUT/'keyword-to-page.csv').open('w',encoding='utf-8-sig',newline='') as f:
    w=csv.writer(f);w.writerow(['query','proposed_page','clicks','impressions','position','intent','action']);w.writerows(kw)
save('KEYWORD_OPPORTUNITIES.md',f'''# Keywords and current Qatar research

Historical metrics below are from 27 June–8 October 2026, global Web search, exact returned query match. “Not returned” is not zero search demand. No paid keyword data, invented search volumes or ranking guarantees are used.

{table(['Query','Proposed existing page','Clicks','Impressions','Position','Intent','Action'],kw)}

## Live English and Arabic checks

Public web searches on 11 October included baklava in Qatar, custom birthday cakes, corporate sweets gifting/catering, `كيك عيد ميلاد قطر طلب` and `حلويات عربية قطر بقلاوة`. Results show product/occasion catalogue intent, local ordering and gifting information. Search results depend on location/personalization; no exact competitor position or traffic estimate is asserted. Arabic results use both `كيك` and `كيكة`, `حلويات عربية` and `بقلاوة`. Broad single words have mixed intent; do not stuff them into titles.

Seven actual Qatar competitor benchmarks (public pages, not a claim to inspect their private analytics):

| Competitor / primary source | Observable relevance and useful gap |
|---|---|
| [Chocola Paris](https://chocolaparis.qa/collections/all), [Arabic sweets](https://chocolaparis.qa/ar/collections/arabic-sweets-tray), [corporate service](https://chocolaparis.qa/pages/corporate-page) | Product cards, QAR pricing, portion/occasion filters and English/Arabic paths. Catharei already has catalogue links; gifting guidance should connect to actual service and menu pages. |
| [FNP Qatar birthday cakes](https://www.fnp.qa/ar/cakes-birthday) | Arabic occasion-specific product discovery, explicit sizes/options and prices. Catharei's existing cake page is the appropriate target; do not copy competitor delivery promises or create thin birthday clones. |
| [Bake Al Arab](https://www.bakealarab.qa/about-us) | Search-indexed Qatar birthday/custom cake positioning. Direct site fetch was unavailable; do not claim a full UX/schema audit. |
| [Sugar Rush Qatar](https://www.sugar-rush.cc/) | Custom cake enquiries organized around occasions. Catharei can use existing contact/catering routes without inventing designs or turnaround times. |
| [Moka Caffe](https://www.mokacaffe.qa/) | Named cake catalogue and visible QAR prices. Preserve Catharei's real product data rather than adopting competitor offers. |
| [Al Hallab](https://alhallabqa.com/our-products/) | Explicit Arabic sweets, bakery, fatayer and Ramadan categories. Catharei has corresponding real categories; strengthen useful existing connections. |
| [Arabesq / AbuIssa](https://www.abuissa.com/retails/arabesq/) | Official Qatar retail profile describes Arabic sweets and gifting. Appropriate service benchmark; no invented Catharei packaging/fulfilment guarantee. |

Batteel was also checked but its ordering page returned a JavaScript shell, insufficient for a content comparison. No competitor text was copied.

## Trends and seasonality

Same-day live Qatar Trends evidence from this session is preserved in `SEO_MONITORING/REPORTS/2026-10-11/trends-evidence.json` and its hashed CSV sources. English baklava/luqaimat/maamoul and Arabic بقلاوة/لقيمات/كيك were compared separately over 90 days and 12 months, All categories, Web Search, Search terms. Interest is sparse for the sweets terms. Arabic `كيك` is mixed with platform/creator intent in related queries, so it cannot be treated as pure cake-buying demand. Some sweets activity occurs around February/March; this supports reviewing seasonal pages, not predicting order volumes. The final week may be partial. Normalized 0–100 charts from different windows cannot be compared as monthly searches.

Existing category titles already address the commercially relevant intent. Changes concentrate on thin informational/gifting articles and their paths to products. No new URLs, duplicated landing pages, or competing Luqaimat category were created.
''')

issues=[]
for r in live['results']:
    if any('redirect' in s.lower() or 'canonical' in s.lower() for s in r['sources']):
        issues.append([r['input'],'; '.join(r['sources']),' → '.join(str(c.get('status')) for c in r['chain']),r['chain'][-1]['url'],r['chain'][-1].get('canonical','')])
with (OUT/'indexing-url-evidence.csv').open('w',encoding='utf-8-sig',newline='') as f:
    w=csv.writer(f);w.writerow(['reported_url','source','status_chain','final_url','declared_canonical']);w.writerows(issues)
save('INDEXING_AND_CANONICALS.md',f'''# Indexing and canonical investigation

Fresh read-only crawl: **{len(live['results'])} URLs**, including all 87 redirect examples, all 28 canonical alternatives, reported performance URLs, 95 sitemap URLs, all three user-supplied discovered URLs and explicit protocol/host probes. Initial HTTP statuses: {dict(initial)}. Terminal statuses: {dict(final)}. Crawl errors: {sum(bool(r.get('error') or any(c.get('error') for c in r['chain'])) for r in live['results'])}. Raw chains, timestamps, canonical, robots, language, schema and internal links are in `live/live-audit.json`; URL-level exclusions are in `indexing-url-evidence.csv`.

## Intended URL architecture

Intended origin is `https://www.catharei.com`. Public HTML pages retain `.html`; blog paths are extensionless; product paths use a slug and database ID. Existing 301 aliases preserve query strings. Do not remove intentional language parameters. Public sitemap URLs point to current self-canonicals. Checkout/cart/account are intentionally noindex. Reports, raw exports and source files remain outside the server's explicit public allowlist.

Of the 87 historical redirect examples, 81 still return 301 and six now return 200 canonical alternatives; all reach working final pages. All 28 historical canonical alternatives return 200. Four terminal 404s are deliberate probes for `/menu`, `/navigation/cakes`, a nonexistent URL and a private export, not broken sitemap entries. All 95 live sitemap URLs return 200 and self-canonicalize.

There are **{len(chains)} two-redirect chains** in this fresh crawl, primarily host normalization followed by an existing path alias. No loops were observed. Application production middleware combines host/protocol/path normalization in one response, but the production edge can redirect the host before Express receives the request. There is no checked-in hosting configuration or authorized edge console here. Consolidating those hops requires a provider-side rule review; source changes alone cannot honestly claim to fix them. Final destinations work. No broad URL migration was attempted.

## The three discovered URLs identified by the user

| URL | Verified current result | Action |
|---|---|---|
| `/luqaimat-qatar.html` | 200, self-canonical, in sitemap, two live products (Lokmat El Kadi and Luqimat Molasses Dates) with real product links | Added conditional link from the Luqaimat article, and a reciprocal informational link. Keep content/product availability sourced from the database. No indexing guarantee. |
| `/navigation/special.html` | 301 to `/menu.html`, then 200 | Expected alias; don't request indexing of the redirect. Corrected this alias in the active special-cakes navigation. |
| `/navigation/special_cakes.html` | 200, self-canonical, empty `special_cakes` inventory, absent from sitemap | Do not force indexing or pretend it has a collection. Repaired its two redirecting navigation links. Keep existing route/content; owner decision needed on a future merge into cakes or a genuinely distinct offering. |

These are user-provided examples, not a newly exported Search Console status check. GSC status may lag current HTTP behavior.

## Canonical alternatives and Arabic

The 28 alternatives return 200 with query-free canonicals. `?lang=en/ar` is an existing client-side preference; initial HTML remains predominantly English, with some bilingual sections and client RTL translation. There are no complete, separately rendered Arabic pages or reciprocal hreflang sets. Adding hreflang or changing canonicals to language URLs without complete language mapping would be speculative. No x-default or invented hreflang was added. Arabic navigation/cart functionality is tested; this is not full Arabic indexing parity. A separate approved server-rendered localization plan remains valuable.

## Verified repairs and protections

- Removed redirecting `/navigation/special.html` and `/navigation/customized_cakes.html` hrefs from the active special-cakes template, replacing them with their existing final destinations.
- Added inventory-aware Luqaimat discoverability and article breadcrumb structured data.
- Corrected invalid use of AggregateOffer for size variants; ordinary products keep real-price Offer markup. Variant pages retain Product identity but may not qualify for a product rich result until individually selectable variant URLs are deliberately supported.
- Robots, public URL structure, canonical strategy and sitemap source were preserved, not rewritten to chase excluded counts.

References: [Google canonical guidance](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls), [Product snippets](https://developers.google.com/search/docs/appearance/structured-data/product-snippet), [Product variants and distinct selectable URLs](https://developers.google.com/search/docs/appearance/structured-data/product-variants). JSON parsing and schema assertions are local validation; no claim of Google Rich Results Test approval or Google-selected canonical inspection is made.
''')

save('GA4_TRACKING.md','''# GA4 tracking implementation and limits

Public measurement ID: `G-RYKLR11ZQT`. Existing container: `GTM-NQ5NWZC4`. Public tags were preserved. The application uses full-document navigation, so automatic page views remain appropriate; no SPA page-view handler was added. Public container inspection does not prove whether GTM duplicates the directly installed GA4 tag. Authorized Tag Assistant/DebugView review remains necessary. No consent manager was found in source; this task did not change the site's consent policy or add tracking before an existing choice. The existing GA disable flag remains respected.

The supplied 13 September–10 October export has only basic events. Existing source at the beginning of this one-time task already implemented view_item, add_to_cart, begin_checkout and a custom order_submitted event from earlier work in this session. They are not claimed as newly introduced here.

## New code in this task

- `admin.html`: removed both GA4 and GTM, including noscript iframe, to stop administrative page views/events contaminating commercial measurement. Admin access and operations are unchanged.
- `script.js`: add_to_cart now includes successful cart quantity increments; remove_from_cart measures quantity decrements and full removals; Undo emits the corresponding restored quantity as add_to_cart. Decrement-to-zero goes through removal once.
- `script.js`: view_item for an unselected size product contains identity/quantity but omits price/value until a real size is chosen. This avoids treating a zero placeholder base price as a free product. Chosen sizes still send actual QAR prices, base product ID, variant and quantity.
- Product item payloads use a strict allowlist and exclude delivery addresses, phone, email and coordinates. Events cannot throw into commerce logic. Localhost/staging and GA opt-out remain suppressed. No cart, coupon, payment, backend total or session logic was changed.

## Verified versus unavailable

| Event | Implementation | Validation |
|---|---|---|
| page_view | Existing public page tags | Source coverage inspected; ingestion/dedup not independently confirmed |
| view_item | Existing detail page/modal hooks, corrected unselected-size value | Unit test and intercepted browser event queue |
| add_to_cart | Existing successful additions plus new quantity/undo hooks | EN/AR browser chosen-size, double-click, quantity and undo assertions |
| remove_from_cart | New quantity/full-removal hooks | EN/AR browser actual cart values and event deltas |
| begin_checkout | Existing checkout entry hook | Local intercepted event queue and preserved cart |
| order_submitted | Existing custom event after successful API response with order ID | Failed response emits none; successful double click emits once; no customer details |
| purchase | **Not implemented** | Server order is pending staff review; no authoritative paid/completed transaction and persisted measurement deduplication boundary are available |

Do not mark order_submitted as purchase or report revenue from it. Do not fire purchase from a thank-you URL, staff acceptance or browser refresh. A future implementation needs an authoritative successful sale, transaction_id, server-confirmed amount/currency and durable transaction deduplication.

All browser requests that appear to target production in analytics tests are fulfilled from the isolated preview; external analytics and production orders are blocked. Queue payload tests are **not** GA4 DebugView receipt, consent compliance certification, attribution validation or proof of purchase measurement. Source/project tests write orders only to disposable databases with notifications disabled.

Reference: [Google recommended ecommerce events](https://developers.google.com/analytics/devguides/collection/ga4/ecommerce).
''')

save('SEO_AUDIT.md','''# One-time SEO audit and implementation scope

## Repository and safety

Express 5 / SQLite application with static HTML/CSS/JavaScript and server-rendered catalogue, product and blog pages. `package.json` has start/dev/test scripts; no build, lint or typecheck script. No `.git` repository is present, so there is no starting commit or trustworthy Git working-tree diff. Initial source snapshots and SHA-256 hashes preserve the user's retrieved work; `SOURCE_CHANGES.diff` records this task's edits. SQLite business records and original exports were not changed. No deployment or production order was made.

Source inspection covered routing, production redirects, public allowlist, sitemap/robots, product rendering, translations, shared navigation, checkout/order persistence, free-map integration and existing analytics. `mobile/routes.json` records all discovered local routes, including aliases, private templates, both articles, product detail routes and the conditional Luqaimat page. `live/live-audit.json` covers all 95 public sitemap URLs plus historical report examples. Local inventory contains 10 active products; the live site contains 73. These environments must not be conflated.

## Highest-value findings and decisions

| Priority | Issue and evidence | Impact / confidence | Action / risk / validation |
|---|---|---|---|
| P1 | GA4 export includes admin activity | Measurement contamination; high | Removed private admin tags, public tags unchanged. Low risk; static checks. |
| P1 | Quantity/removal/undo absent from ecommerce events, unselected variant price can be zero | Misleading funnel quantities/value; high | Corrected event hooks only. Low risk; unit + EN/AR browser assertions. |
| P1 | Luqaimat article 2,197 impressions, 18 clicks, position 6.09; thin structure and unsupported judge anecdote | Informational relevance and product discovery; medium | Added useful sourced cultural context, headings, bilingual summary, current-menu links; kept title/URL. Low risk; schema/link/mobile tests. |
| P1 | AggregateOffer used for size variants contrary to Google's documented rules | Invalid rich-result implementation; high | Omit unsupported offers for variants while retaining actual visible size prices and normal-price Offer. Low runtime risk; rich-result eligibility remains limited. |
| P1 | 11 live two-hop redirects involving edge host normalization and app aliases | Extra crawl/navigation roundtrip; high | Existing app one-hop logic verified; provider-side optimization requires access. Not reported fixed. |
| P1 | Discovered special-cakes page has no active matching products | Thin landing page; high | Preserve route; don't force indexing. Future consolidation needs approval and business decision. |
| P2 | Render-blocking Josefin stylesheet import; no current template uses it in 74 computed-style checks | Unnecessary network dependency; high | Removed import only; retained Outfit, Playfair Display, Cairo, hero and all CSS layout rules. Visual/mobile/lab checks. |
| P2 | Promotional gifting article lacks planning help and service links | Weak path to relevant enquiry; medium | Added practical quantity, packaging, timing and allergen questions, existing service links and Arabic summary. No guarantees invented. |
| P2 | Article breadcrumb schema absent; blog feed skips h2 | Semantic clarity; high | Added truthful breadcrumb and modified date, retained published date/title, h2 with same styling. |
| P2 | Active special-cakes navigation uses two redirect aliases | Avoidable navigation hops; high | Use existing final hrefs, preserve labels/options. |
| Deferred | ?lang is client preference with incomplete server-rendered Arabic | Arabic indexability incomplete; high | Preserve behavior/canonicals; no speculative hreflang or URL migration. |

## Protected commercial and local pages

Arabic sweets, menu, cakes and branch metadata already clearly describe actual offerings in the retrieved source. Their historical low CTR is not sufficient evidence to repeatedly rewrite already optimized titles. Homepage branded performance and hero are protected. Categories remain database-backed and linked to real product pages. Local branch list in website source/live site: Salwa Road (Al Aziziya/Al Waab), Al Wakrah, Al Kharaitiyat. Existing contact/directions links are retained. Street wording differs across some footer/branch records (including Al Wakrah “720” versus main-street wording); no unverified address/hours corrections were invented. Physical operating status and Google Business Profile ownership were not independently verified or edited.

The free checkout map remains MapLibre/OpenFreeMap with local Qatar search and browser GPS. Existing coordinate/address storage and staff review remain unchanged; no automated delivery-zone/fee engine was invented. No paid mapping API was introduced. Previous WebKit blank-map-render concerns and real-device coverage require separate device verification; this SEO task does not claim to repair them.

Initial priorities are retained separately in PRIORITIZATION_BEFORE_EDITS.md. Final implementation details and real executed results appear in the other reports. Historical improvements predating this task are not attributed to these changes.
''')

save('SEO_BASELINE.md',f'''# Baseline for future measurement

This work is local and **not deployed**. Day zero must be the actual later deployment timestamp, not 11 October by default.

GSC scope: Web, all countries, 27 June–8 October 2026; 1,123 clicks / 31,198 impressions / 3.600% CTR. Qatar: 971 / 21,695. Mobile: 855 clicks. Returned page/query dimensions have different totals and incomplete query coverage.

{table(['Start','End','Days','Clicks','Impressions','CTR'],[window(14),window(14,14),window(28),window(28,28)])}

Coverage latest 4 October: 39 indexed, 87 redirects, 28 canonical alternatives, 3 discovered—not indexed. The three exact user-supplied examples and today's crawl status are documented separately. Excluded duplicates should not be targeted as growth.

GA4 scope: 13 September–10 October, All Users; 131 page views, 76 session_start events, 57 first_visit events. No reliable organic ecommerce conversion/revenue baseline. Standard events absent from the export do not demonstrate absent sales. Mark the deployment as an instrumentation discontinuity before comparing event totals.

The six page baselines and exact query metrics are in DATA_ANALYSIS.md and keyword-to-page.csv. Preserve the same filters when comparing; request page-filtered query exports to resolve cannibalization and true ranking-page relationships.

Lab baseline before edits: homepage performance 68, LCP 5.53s, CLS 0, TBT 128ms; Luqaimat article 88, 3.23s, 0.0021, 0ms; menu 87, 3.75s, 0.0146, 0ms. See raw Lighthouse JSON for versions/settings. These are simulated local Chrome results, not production field p75. Analytics was blocked; fonts and production image references remained external. No INP or real-device p75 was measured.
''')

save('FOLLOW_UP.md','''# Manual follow-up after deployment

This is a one-time implementation, not a new recurring task. No scheduler was created or changed by this project. A separately created earlier fortnightly automation, if still enabled, is independent of these records.

## Before deployment

Review SOURCE_CHANGES.diff and the source snapshots. Keep production product database/uploads; do not replace them with the local 10-product catalogue. Confirm production environment/host rules. Run the tests from TEST_RESULTS.md. Deploy only with the owner's permission. Record deploy time, actual changed files and analytics measurement change date.

After release, fetch canonical pages, sitemap and robot headers; verify article/product schema with Google's Rich Results Test and inspect a few URLs in Search Console. Confirm tags are absent from admin and public events appear exactly once in authorized Tag Assistant/DebugView. Verify an ordinary order in the authorized testing environment without accidental real payments. Do not label pending order_submitted as purchase. Check the Luqaimat article shows its conditional link against live inventory.

## 14 days after deployment

- Export the latest **complete** 14 days and preceding matched 14 days from GSC, accounting for reporting lag. Keep Web/Qatar/device filters consistent; preserve both global and Qatar views separately.
- For Arabic sweets, menu, cakes, Luqaimat article/landing page and each branch, inspect clicks, impressions, CTR and average position together. Export page-filtered queries; separate branded, ambiguous and non-branded terms.
- Check URL Inspection for the Luqaimat landing page, original special redirect and empty special-cakes page. Do not request indexing of the redirect or assume a still-empty collection deserves indexing.
- Check canonical/hreflang status and host/path redirect chains; provider-side one-hop work remains outstanding. Do not change established URLs without an approved mapping.
- Verify view_item → add_to_cart → begin_checkout → order_submitted flow, remove/undo quantities, admin exclusion and GTM duplication. Document consent/attribution behavior with authorized access. Do not compare new event counts to historically missing instrumentation as sales growth.
- Check mobile Chrome and physical iPhone Safari, map rendering/GPS denial, size choices and checkout. Compare production field CWV only when enough data exists.

## 28 days after deployment

- Compare complete matched 28-day periods with the same filters. Segment by landing page, query intent and device; do not average row CTRs or positions without appropriate weighting.
- Review whether article non-branded impressions/clicks and onward menu engagement improved. Check affected titles/snippets in search; Google may rewrite snippets. Correlation is not proof of causation.
- Check organic revenue only if a verified purchase measurement has since been implemented with transaction deduplication. Otherwise report the measurement gap and separate pending orders from sales.
- Recheck public sitemap/canonicals, product availability and genuine branch facts. Decide with the owner whether special-cakes should merge into cakes or have a distinct real offering.
- Review seasonality using Qatar Trends over matched periods, distinguishing search terms/topics and incomplete weeks. No absolute monthly volumes can be inferred.
- Record the next evidence-backed actions. No ranking, indexing, traffic or order improvement is guaranteed.

If deployment were on 11 October 2026, nominal checkpoints would be 25 October and 8 November; shift them to the actual deployment date and allow Search Console data lag.
''')

# Exact diff is based on source snapshot, not an unavailable Git working tree.
manifest=load(OUT/'starting-source-manifest.json')
changed=[];diff=[]
for record in manifest:
    rel=record['file'];p=ROOT/rel;before=OUT/'before'/rel
    if p.exists() and hashlib.sha256(p.read_bytes()).hexdigest()!=record['sha256']:
        changed.append(rel)
        diff.extend(difflib.unified_diff(before.read_text(encoding='utf-8').splitlines(True),p.read_text(encoding='utf-8').splitlines(True),fromfile='before/'+rel,tofile='after/'+rel))
save('SOURCE_CHANGES.diff',''.join(diff))
save('changed-files.json',json.dumps(changed,indent=2))
print(json.dumps({'reports_written':7,'changed_existing_files':changed,'live_two_hop_chains':len(chains)}))
