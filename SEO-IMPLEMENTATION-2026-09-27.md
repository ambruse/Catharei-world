# CATHAREi SEO implementation and launch handover

27 September 2026. Implemented and tested in the local project. Not deployed. Google Business Profiles have not been edited. Search rankings cannot be guaranteed; Google Maps visibility also varies with the searcher's location.

## What changed

- Added `/luqaimat-qatar.html`, with English and Arabic content, real product descriptions and prices, branch links and an ordering link to the existing menu. The Express route reuses the existing page shell and reads `templates/luqaimat-main.html`.
- Added `catalogue-seo.js` as a read-only rendering layer. Homepage featured items, menu items, category items and Luqaimat come from the existing active product records. There is no spreadsheet import, secondary product catalogue or hardcoded production product ID.
- Initial HTML now includes escaped names, descriptions, images and prices, including the existing small/medium/large variant pricing and disabled-size rules. Existing client rendering, admin, options, cart and order APIs remain the source of interactive behavior.
- The Luqaimat route is indexable and included in the served sitemap only when matching active products exist. Without matching products it becomes noindex, is omitted from the sitemap and removes the sales availability statement. Database errors produce a useful 503 page with noindex and Retry-After, without database details or invented products.
- Improved homepage, cakes, Arabic sweets and branch titles, descriptions and visible copy. Added natural Arabic sections and useful category/branch links. Removed the homepage keyword-stuffing section and unsupported dietary claims in menu copy.
- Fixed a missing JSON-LD opening script tag on the cakes page that exposed raw schema text to visitors and displaced metadata from the intended head.
- Replaced client-generated Product/Offer assumptions with a server-generated ItemList matching the visible records. Removed blanket InStock, zero-price fallbacks and an invented showcase video upload date. Product offer rich-result eligibility is not claimed for category pages.
- Added Luqaimat BreadcrumbList. Updated Bakery addresses and Google Maps links from the owner's confirmation. Removed unverified fixed price ranges and conflicting opening-hours schema.
- Preserved GTM-NQ5NWZC4 in the head/body. Tests verify the original placement across the HTML pages.
- Combined known homepage/blog aliases with the production HTTPS/www redirect to avoid an extra application redirect. Language and tracking parameters are preserved; canonicals consolidate to the clean page URL. Existing language switching still works. No false hreflang alternatives were introduced.
- Fixed placeholder help links and removed nonfunctional social anchors. Updated the confirmed Al Wakrah address in visible footers and language text.
- Fixed branch-page mobile grid/badge overflow. Deferred the 240 cake-animation frames, totaling 7,958,892 bytes on disk, until the visitor approaches the section. Existing hero preload and lazy catalogue images remain.
- Removed obsolete schema-building code and its unused arrays, and an unused animation counter. Runtime menu classes, event handlers and application dependencies were retained. No blanket purge of CSS used dynamically was attempted.

## Query-to-page map

| Primary destination | English intent | Arabic intent |
| --- | --- | --- |
| `/` | best bakery in Qatar; bakery Qatar; bakery Doha | أفضل مخبز في قطر، مخبز في الدوحة |
| `/luqaimat-qatar.html` | best Luqaimat in Qatar; Luqimat Qatar; Lokmat El Kadi | أفضل لقيمات في قطر، لقيمات قطر، لقمة القاضي |
| `/navigation/Arabic_sweets.html` | best sweets shop in Qatar; Arabic sweets Qatar | أفضل محل حلويات في قطر، حلويات عربية في قطر |
| `/navigation/cakes.html` | best cakes in Qatar; best cake shop in Qatar | أفضل كيك في قطر، محل كيك في قطر |
| Existing custom/special cake pages | specific custom/special cake intent | كيك حسب الطلب، كيك للمناسبات |
| Individual branch pages | bakery/sweets near each actual branch | مخبز طريق سلوى، حلويات الوكرة، حلويات الخريطيات |

“Best” is treated as the customer's comparison intent, not an unsupported award or a claim that CATHAREi ranks first. Existing URLs are retained to avoid unnecessary migration. Do not make separate near-identical pages for every spelling or neighborhood.

Research reviewed [Chocola Paris](https://chocolaparis.qa/) and English/Arabic Qatar search results. They inform product/location vocabulary, not keyword-volume estimates or a verified universal ranking order. Search results include editorial food guides as well as merchants, so useful product pages and real local reputation both matter. Do not copy competitor text or target competitor brand names.

## Luqaimat evidence and data boundaries

The live public API returned 73 active products during this review. Two matched Luqaimat:

| Live product name | Recorded description | Price at inspection |
| --- | --- | --- |
| Lokmat El Kadi | 1 Kilo. | QAR 40 |
| Luqimat Molasses Dates | Sweet dates-based Luqimat drizzled with molasses. | QAR 60 |

These values are verification evidence only. The implementation never copies those prices into static landing-page content. It reads the deployment's database on each request. Matching uses recognized English/Arabic names, not production IDs. If names are changed to unrelated labels, the Luqaimat match needs review.

The owner confirmed fresh Luqaimat is available year-round in all three branches. Toppings, unlisted portion sizes, ingredients, allergens, advance notice and specific delivery terms remain unconfirmed and are not invented.

The local working database lacks active Luqaimat records, so its new page correctly stays noindex. The live API's two products will make the page eligible when this code is deployed against that existing live database. Do not upload the local database over production.

## Search Console baseline

Source: supplied `catharei.com-Performance-on-Search-2026-09-27 (1)` CSV exports, filtered to Web, Qatar, Last 3 months. Chart dates: 27 June–24 September 2026. Total: **795 clicks, 17,767 impressions, 4.47% CTR**. Mobile accounts for 623 clicks and 15,045 impressions.

| Query | Clicks | Impressions | Average position |
| --- | ---: | ---: | ---: |
| best bakery in qatar | 0 | 18 | 12.44 |
| luqaimat qatar | 0 | 17 | 10.00 |
| best sweets in qatar | 0 | 15 | 9.73 |
| best cake shop in qatar | 0 | 12 | 27.25 |
| best cakes in qatar | 0 | 6 | 22.67 |

The exact “best luqaimat in qatar” and “best sweets shop in qatar” strings were not present in the exported query rows. Absence is not proof of zero visibility. Average position over a few impressions is not a fixed current ranking. The export shows substantial branded traffic and small non-branded samples.

The Pages export includes historical HTTP/non-www/language URL variants. That supports checking consolidation, but does not by itself prove current redirects are broken. Query and page export totals should not be treated as interchangeable with chart totals; Search Console aggregation and omitted query data affect comparisons. Search appearance contains no rows, which does not establish a structured-data error.

## Google Business Profile work by branch

Website-side links and branch schema are implemented. Profile verification, category selection, photos, updates and review responses require access to the actual profiles; no external profile edits or messages were made.

| Branch / supplied map | Confirmed address | Website field for the profile |
| --- | --- | --- |
| [Salwa Road](https://maps.app.goo.gl/JrVdhNaCqzmBcGeZ8) | Building 384, Street 340, Salwa Road, Al Waab / Al Aziziya, Doha | `https://www.catharei.com/locations/al-aziziya.html` |
| [Al Wakrah](https://maps.app.goo.gl/ahWNVCNotAK1U8L78) | 720, Al Wakrah | `https://www.catharei.com/locations/al-wakrah.html` |
| [Al Kharaitiyat](https://maps.app.goo.gl/Ecc9mMtrrMRQBNmL8) | Al Kharaitiyat | `https://www.catharei.com/locations/al-kharaitiyat.html` |

For each profile, verify ownership and map pin, retain the exact real-world business name, and confirm the most accurate available primary category. Bakery is a candidate; Cake shop and Dessert shop may be appropriate secondary categories if they accurately describe that branch and are available in Google's category list. Do not add keywords to the official name.

Set menu and ordering destinations to `https://www.catharei.com/menu.html` where those fields are supported. Optional website tracking parameters can identify the branch, for example `?utm_source=google&utm_medium=organic&utm_campaign=gbp_salwaroad`; the site's canonical remains clean.

For Salwa Road, add an original storefront photo showing the entrance and signage at Building 384. For Al Wakrah, confirm the full street/building interpretation of “720” and photograph that entrance. For Al Kharaitiyat, confirm the full building/street address and entrance pin. All branches can describe Luqaimat based on the owner's confirmation; verify other advertised product availability per branch.

Publish original product photos and factual updates. Request honest feedback from actual customers without incentives or review gating. Respond to reviews and questions using real order/branch information. Draft copy to adapt after confirming the official profile name:

> CATHAREi bakery and sweets in [branch location]. Fresh Luqaimat is available year-round. Browse our menu for current products and prices, or contact the branch about your order.

> مخبز وحلويات كاثاري في [اسم المنطقة]. تتوفر اللقيمات الطازجة طوال العام. تصفح قائمتنا للاطلاع على الأصناف والأسعار الحالية، أو تواصل مع الفرع للاستفسار عن طلبك.

Local ranking depends on relevance, distance and prominence; a website change cannot establish one Qatar-wide Maps position. See [Google's local ranking guidance](https://support.google.com/business/answer/7091?hl=en).

## Remaining business information

- Correct weekly/Friday and special holiday hours per branch. The old visible schedule said 08:00–22:00 daily while schema said Friday 13:00–23:00. Until confirmed, branch pages ask customers to contact the branch, and hours are omitted from schema and branch metadata.
- Confirm current phones: Salwa Road +974 5094 2255; Al Wakrah +974 4007 5555; Al Kharaitiyat +974 5539 2255. Existing numbers have been retained.
- Full Al Wakrah and Al Kharaitiyat address details, profile verification/category status, preparation time, delivery/collection terms, product allergens and authorized original photos.
- For the next search diagnosis: Search Console Page indexing, Sitemaps, Core Web Vitals and URL Inspection results for the homepage, cakes, sweets and new Luqaimat URL. For Maps: each profile's Performance export. Passwords are not needed in chat.

## Internal links and structured data

Homepage → cakes / sweets / menu / branches. Homepage and product category pages → Luqaimat when active records exist. Luqaimat → sweets / menu / all branches. Branches → menu / cakes / sweets / supplied Maps destination. Luqaimat history article → current Arabic sweets / contact.

Organization and branch Bakery entities remain, with consistent branch identities and owner-supplied Maps links. Category ItemList values match visible active records; no inventory status or ratings are invented. Luqaimat breadcrumbs match visible navigation. BlogPosting remains on article pages. All JSON-LD blocks parse, but Google rich-result eligibility and actual search display still require post-deployment validation. See [Google's product structured-data guidance](https://developers.google.com/search/docs/appearance/structured-data/product).

## Validation and limits

Baseline: 8 existing tests passed. Final: **13 tests passed**, including installed-Chrome browser checks. Default `npm test` runs 12 checks and skips the optional browser check unless `CATHAREI_PLAYWRIGHT` points to the installed Playwright module. No new production dependency was added. `git diff --check` passes.

Covered: static metadata and inline-script syntax, balanced head scripts, GTM placement, local links/assets, sitemap reachability, private noindex and file protection, initial catalogue HTML, active/category filtering, escaping, variants/prices, database-failure response, Luqaimat activation/deactivation and sitemap updates, admin create/edit-variants/toggle/delete APIs, guest order persistence, actual browser variant selection and cart quantity changes, 390px mobile overflow, desktop screenshots and deferred animation requests.

CRUD and checkout tests use a disposable fixture database. Server-side notification fetches are replaced in the fixture process, so no test WhatsApp messages or calls are sent. Production checkout/payment/provider fulfillment is not exercised. The existing product editing endpoint tested is the variants endpoint; no new general-edit behavior was added.

The working database SHA-256 before and after is identical:
`5D8168DBF3244AACE06012CB38C5279AC5586FB4C872420C46B5A6F586278BB9`.
No live records were written, and no spreadsheet products or prices were imported.

Mobile and desktop visual review used local fixture products and blocked unrelated external requests. Field Core Web Vitals, production response time, Google rendering, live edge/CDN redirects and actual ranking changes cannot be established by this local run. Existing client language switching is preserved; these pages are bilingual content, not fully independent Arabic-language URLs.

## Launch and 30/60/90-day measurement

**At launch:** deploy the changed application files plus the new module and template through the existing host, retaining its persistent database/uploads. Confirm the live Luqaimat response contains both active records and a self-canonical, and that the served sitemap includes it. Test HTTP/non-www and legacy URLs on the actual host. Submit the sitemap and inspect the four priority URLs in Search Console. Run Google's Rich Results Test and review any eligible features without assuming ItemList itself produces a rich result. Verify GTM events without creating duplicate containers or duplicate purchase events.

**By day 30:** confirm crawling/indexing and Google-selected canonicals. Complete verified branch details and profile fields. Establish a fixed geographic grid around each branch for bakery, cake shop, sweets shop and Luqaimat near-me terms in English and Arabic. Keep grid coordinates, language, device and observation method consistent. Record profile calls, directions and website clicks separately from Search Console Web data.

**By day 60:** compare the latest 28 days with the previous 28 days, holding Qatar/Web/device filters consistent. Review non-branded impressions, clicks, CTR and average position by target page and query cluster. Check whether the intended landing pages appear for each cluster. Review mobile LCP, INP and CLS using field data when available, and lab tests on the deployed site. Add verified product detail and original photographs where customers need them.

**By day 90:** assess non-branded traffic and actual orders/enquiries alongside Maps visibility and profile actions. Compare seasonality before attributing changes to SEO. Improve pages with impressions but weak clicks or low conversion, and resolve indexing/canonical issues before expanding content. Pursue legitimate local editorial coverage or business citations using accurate branch details; do not buy links or reviews.

No fixed first-place deadline or guaranteed traffic increase is assumed.
