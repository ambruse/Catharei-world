# CATHAREi code and SEO review

Updated 20 September 2026. Changes are local and have not been deployed.

## Research and keyword mapping

Reviewed [Chocola Paris](https://chocolaparis.qa/), [Eclat Qatar](https://www.eclatqatar.com/), [Bake Al Arab](https://www.bakealarab.qa/cakes), and [Al Hallab’s bilingual menu](https://alhallabqa.com/menus/vendome-alhallab-sweets-digital-menu.pdf), alongside English and Arabic Qatar bakery searches. These sources support product and location terminology, not measured search volume or a claim that any business always ranks first. Competitor names and unsupported promises such as guaranteed same-day delivery were not added as target keywords.

| Page | English search intent | Arabic search intent |
| --- | --- | --- |
| Home | Arabic sweets Qatar, bakery Doha, cakes Qatar | حلويات قطر، مخبز الدوحة، كيك قطر |
| Arabic sweets | Arabic sweets, baklava Qatar, maamoul | حلويات عربية، بقلاوة قطر، معمول |
| Cakes | cakes Doha, celebration cakes Qatar | كيك الدوحة، كيك للمناسبات |
| Custom cakes | custom cakes Qatar, birthday cakes, wedding cakes | كيك حسب الطلب، كيك أعياد الميلاد، كيك زفاف |
| Savouries | savouries, pastries Qatar | موالح، معجنات قطر |
| Oriental sweets | oriental sweets, traditional desserts | حلويات شرقية |
| Corporate gifting | corporate sweet gifts Qatar | هدايا حلويات للشركات |
| Ramadan and Eid | Ramadan sweets, Eid gift boxes Qatar | حلويات رمضان، علب هدايا العيد |
| Catering | dessert catering Qatar | حلويات وضيافة للمناسبات |
| Branch pages | bakery Salwa Road, Al Wakrah, Al Kharaitiyat | مخبز طريق سلوى، حلويات الوكرة، حلويات الخريطيات |

Keywords appear in meaningful titles, descriptions, visible Arabic copy and links. Meta keywords were removed because [Google does not use them for ranking](https://developers.google.com/search/docs/crawling-indexing/special-tags). Repetitive text was reduced in line with [Google’s keyword-stuffing guidance](https://developers.google.com/search/docs/essentials/spam-policies).

## Implemented

- Reviewed frontend HTML, shared scripts/styles, inline scripts, backend routes, package dependencies, structured data and crawl configuration.
- Removed 28 unused one-time page-rewriting, keyword-injection, scratch and obsolete browser-test files. Removed stale metadata translation entries, redundant blog transformations, a redundant database query and the unreachable duplicate homepage handler. Kept database maintenance and image conversion utilities as potentially useful manual tools, along with their dependencies. Kept dynamically generated classes and event handlers.
- Standardized canonical, Open Graph, Twitter and robots metadata across 28 HTML files; fixed duplicate stylesheet links, WebP favicon types, and category/navigation asset paths.
- Removed incorrect hreflang links that advertised redirected or identical English/Arabic URLs. Preserved working language-query selection and added visible Arabic content to key landing pages. This remains a bilingual site with a client-side language switch, not a set of fully translated, separately indexed Arabic pages. Add hreflang only after complete independent language URLs exist.
- Added initial server-rendered catalogue text on the homepage, menu and category pages using active database products. The existing interactive catalogue and cart still load in the browser.
- Rebuilt the sitemap with reachable canonical public pages and real blog URLs. Removed fabricated/fixed modification dates and invalid language alternates. Private checkout, account, cart and admin pages use noindex; robots.txt permits crawlers to read those directives.
- Centralized article metadata and safely serialized BlogPosting JSON-LD. Removed the inherited feed schema and an article FAQ block whose answers were not displayed in the article. Reduced invented organization aliases.
- Restricted public serving to website assets so source files, database files and dependencies cannot be downloaded. Canonical production redirects now use the actual site hostname.
- Reduced llms.txt to factual navigation; it is not a Google ranking mechanism.

## Verification

Run `npm test`. Seven automated checks cover all page metadata and inline-script syntax, local links/assets, sitemap URLs and H1 counts, language queries and redirects, private-file protection, initial catalogue content and active/category filtering, and article escaping/JSON-LD.

Integration checks launch an isolated server with a temporary fixture database. They do not change live products, customer records or orders. This is not a visual browser review or a complete checkout/authentication regression suite.

## Operational follow-up

After deployment, submit `/sitemap.xml` in Google Search Console and inspect representative category, branch and blog URLs. Confirm branch hours, telephone numbers, delivery policies and product claims against current operations before editing those business facts. Measure impressions and clicks by query and page; the research does not establish search-volume estimates or guarantee rankings.

The server also has pre-existing hardcoded authentication/notification defaults. Restricting static access stops source downloads, but credential rotation and replacing production defaults with managed secrets remain a separate operational issue.
