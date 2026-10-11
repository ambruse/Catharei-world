# Free map checkout implementation

Implemented locally on 2026-10-11. This report replaces the earlier Google integration plan. No Google Maps, Google Places, Mapbox billing, paid geocoder, API key or billing account is used by this checkout feature.

## Restoration verification — 2026-10-11

After the user recovered the project folder, the missing session edits were reapplied from the saved edit history. The existing free-map controller/data were preserved, and checkout, server routes/order insertion, the staff address display, shared mobile interactions/styles and the MapLibre 6.13.0 dependency were restored. The earlier Google configuration was not restored as the final implementation.

Fresh checks passed: 25 repository tests, nine navigation checks, 16 commerce journeys, 32 Chrome map checks, six map failure-recovery checks, six map accessibility scans and 74 public-page accessibility scans. The isolated SQLite database received the exact confirmed coordinates and structured building details, with unchanged totals and pending acceptance. Network assertions found no paid mapping/geocoding requests; mapping resources remain deferred until opening the selector. The full restored site passed 680 Chrome layout cases with no document overflow or unhandled page errors.

The equivalent WebKit map suite passed 32 checks on a repeat run. Its first run reported an intermittent clipped confirmation after the desktop-to-landscape resize sequence; a separate geometry check and the unchanged full rerun passed. **The previously documented blank WebKit map screenshot remains unresolved**, and no real-device Safari/Android certification is claimed. Prior no-SLA, incomplete area data, absent authoritative serviceability rules, and performance limitations remain in force.

The restored desktop checkout first viewport matches the previous free-map implementation screenshot with zero changed pixels at the existing comparison threshold; its full-page height is unchanged. New layout/visual evidence is in `tests/mobile-artifacts/restored/`; refreshed map test evidence remains in `tests/map-artifacts/after/`. See the restoration section of `MOBILE_UX_OPTIMIZATION.md` for the full scope. The current disposable local preview runs on port 3119; no production deployment occurred.

## Baseline and scope

The checkout is an existing HTML/JavaScript page served by Express, with SQLite orders. The original Leaflet/OpenStreetMap raster map loaded during checkout initialization, started in Doha, and wrote those default coordinates into the order even when the customer never selected a location. A draggable marker and GPS icon were the only controls. There was no explicit confirmation, search, structured building information, accuracy feedback or restored selection. Free-text address and coordinates were independent. The backend accepted coordinates without validating them.

The initial audit and six pre-change screenshots are recorded in `CHECKOUT_MAP_UX_OPTIMIZATION.md` and `tests/map-artifacts/before/`. Baseline commerce tests completed 16 journeys against a disposable database with external notifications suppressed. No production or paid orders were placed.

The existing guest/account flow, required free-text address, cart, prices, coupon behavior, payment methods, order status workflow, analytics, URLs, metadata and SEO content are preserved. There is no saved-address account model or delivery-zone/fee engine in this repository. Existing orders enter `pending` and require staff acceptance and customer contact. No delivery radius, coverage claim, fee or new fulfillment option has been invented.

## Files changed

| File | Purpose |
|---|---|
| `checkout.html` | Replace eager inline Leaflet map with the picker; submit its confirmed location; clear temporary address after successful order creation |
| `location-picker.js` | Local search, lazy MapLibre loading, GPS, fixed pin, dialog interaction, temporary state, error/retry and checkout payload |
| `location-picker.css` | Existing gold/dark palette and fonts; responsive modal, safe areas, short-screen layouts and touch controls |
| `delivery-location.js` | Server coordinate/detail validation, normalization and readable staff address |
| `server.js` | Free style configuration, narrowly allowed MapLibre/data assets, one additive database column and normalized order insertion |
| `admin.html` | Safely escaped multiline delivery details, OpenStreetMap pin links, explicit manual-address state |
| `package.json`, `package-lock.json` | MapLibre GL JS 6.13.0, pinned by lockfile |
| `data/qatar-areas.json`, `data/README.md`, `data/geonames-source/`, `data/QA.zip` | Licensed local geographic dataset and provenance |
| `scripts/build-qatar-areas.cjs` | Reproducible source conversion |
| `tests/free-map-*.cjs`, `tests/delivery-location.test.js`, `tests/qatar-area-data.test.js` | Functional, recovery, accessibility, layout, backend and provenance checks |
| `tests/mobile-commerce.cjs` | Update the existing library-failure regression to MapLibre |

## MapLibre and OpenFreeMap

- MapLibre GL JS 6.13.0 is installed through npm and served from a strict allowlist under `/vendor/maplibre/`. It uses the current ES module and worker distribution. No frontend framework or build-system rewrite was introduced.
- The module, CSS, worker and map tiles load only when the customer opens the picker. Search data also loads on demand. Local assets retain browser caching. Two workers are used.
- Default style: `https://tiles.openfreemap.org/styles/liberty`. Operator configuration `FREE_MAP_STYLE_URL` can replace this with another licensed free/self-hosted style. It is not an API credential. Restart the server after changing it.
- Normal pan, pinch/double-tap zoom and keyboard navigation are supported. Rotation/pitch and optional 3D building layers are disabled. The centered SVG pin uses the existing brand accent.
- Provider attribution remains visible: OpenFreeMap, OpenMapTiles and OpenStreetMap. Attribution is not covered by the bottom panel.
- The instance is reused for brief edits, released after 60 seconds closed, and removed on page exit. Resize handling is deferred outside ResizeObserver callbacks to avoid feedback loops, and explicitly redraws the canvas.
- Mapping initialization is bounded: configuration/module loading times out, and a slow/unavailable map offers retry or manual address entry. Failed map/tile loading disables pin confirmation. Coordinates already confirmed remain separate from tentative edits.

Provider references: [OpenFreeMap integration](https://openfreemap.org/quick_start/), [commercial use, attribution and no-SLA statement](https://openfreemap.org/), [terms](https://openfreemap.org/tos/), [MapLibre installation](https://maplibre.org/maplibre-gl-js/docs/).

## Local Qatar search

268 populated-place/neighborhood and municipality points are derived from the downloaded GeoNames Qatar extract. 266 contain an Arabic-script name. Each point keeps its source ID, coordinates, aliases and source update date. The 80,951-byte JSON is served by this application. Coordinates and names are checked against the original extract in a regression test. Source checksum, filtering and licensing are documented in `data/README.md`.

Search supports partial matches, alternate source spellings, accent/article normalization and Arabic diacritic normalization. Exact matches come first; nearby results are favored without excluding other parts of Qatar. Municipality subtitles help distinguish duplicate place names. Search queries never leave the browser.

Area centers are explicitly described as approximate area choices, not building addresses. Choosing one does not enable confirmation until the customer refines the map at building zoom. No reverse-geocoding service or inferred blue-plate number is used. Search failure/no result leaves GPS, manual map selection and address entry available. The list is not exhaustive: names absent as area records, including West Bay and The Pearl, require manual map selection. Hotel coordinates are not substituted for missing neighborhoods.

GeoNames references: [download](https://download.geonames.org/export/dump/QA.zip), [schema and CC BY 4.0 license](https://download.geonames.org/export/dump/readme.txt), [reuse terms](https://www.geonames.org/export/). The picker links to GeoNames and its license. No GeoNames web-service account or quota is used. No public Nominatim, Photon demo or OSM raster tile service is called.

## GPS, pin and confirmation

- GPS permission is requested only after **Use My Location**. Settings: high accuracy, 10-second timeout, 30-second maximum cached fix age.
- Denial, timeout and unavailability produce a readable recovery message. Accuracy is displayed in meters; fixes over 100 m are explicitly described as low accuracy. This threshold is a UX warning, not delivery coverage.
- Every request receives a revision token. Moving the map, selecting an area or closing the picker invalidates pending GPS results. Late callbacks cannot replace newer selections.
- The pin remains at the visual map center. Coordinates are read on completed movement and checked for valid numeric ranges. Tapping the map is an additional way to position it. Arrow keys/zoom controls provide a keyboard alternative.
- The untouched Doha overview is never saved as a customer location. Confirmation requires a deliberately selected/refined point, a ready map, loaded tiles and an exact match between the draft coordinates and current map center.
- States are `idle`, `selecting`, `resolving` (GPS), `ready`, `confirmed`, with `error` and retry. Close/Escape cancels the draft, preserves the confirmed location, restores focus and unlocks the page at its prior scroll position.
- Confirmation opens the building-detail section. Editing a pin does not clear customer fields, other address details or the cart.

## Address and order data

The existing required address textarea remains the full customer-supplied address. Optional structured fields collect area, building/villa, street, zone, property type, unit, floor, landmark and instructions. Customers can add only missing/applicable details instead of retyping the address. No additional field is blindly required for every property type.

Frontend payload:

```js
deliveryLocation: {
  latitude, longitude, // numbers for a confirmed pin; null for manual fallback
  locationSource,     // gps | area-search | map-pin | manual
  confirmedAt,        // only for a confirmed pin
  accuracyMeters,     // retained only for an unadjusted GPS point
  area, buildingNumber, streetNumber, zoneNumber,
  propertyType, unitNumber, floorNumber, landmark, deliveryInstructions
}
```

Existing `orders.lat`, `orders.lng` and `orders.address` remain the coordinate/address columns. One additive `delivery_details TEXT` column stores the structured extras, source and verification metadata. Coordinates are not duplicated there. The server composes an address readable by the existing admin/notification consumers, including the relevant details and staff-review status. It validates types, ranges, allowed sources/property types, confirmation timestamp and length bounds. Invalid coordinates receive HTTP 400. A manual payload cannot contain coordinates.

Valid legacy callers remain compatible. Missing coordinates stay null. Manual addresses are labeled **Map unverified — confirm address with customer** and follow the existing pending/staff-acceptance flow. The staff screen shows an OpenStreetMap link only when valid numeric coordinates exist; it escapes address text and preserves line breaks.

The draft is stored in tab-local session storage for up to 30 minutes, tied to the unchanged cart, and removed after successful order submission. Storage denial/corruption does not block checkout. Validation failures, closing/reopening the picker and page reload retain valid draft details. This does not create a permanent customer address book. No address or coordinate analytics events/log statements were added. Tile requests necessarily reveal the viewed map region to the free tile host.

## Delivery availability

No authoritative serviceability configuration exists to enforce or test. Every order continues to require existing staff acceptance. `serviceability: "staff-review"` is recorded; **pin confirmed** never means **delivery available**. Selecting an area in Qatar does not claim it can be served. There is no new distance calculation or delivery charge. Server-side out-of-service-area rejection cannot honestly be marked tested until the business supplies authoritative rules. No pickup option was added.

## Verification results

| Check | Result / evidence |
|---|---|
| Existing repository suite | 25/25 passed, including browser regression, SEO/product preservation, guest order and new server/data checks |
| Existing commerce journeys | 16/16 passed; English/Arabic cart, sizes, order creation and map-module failure recovery |
| New Chrome journeys/layouts | 32 passed; `tests/map-artifacts/after/chromium-results.json` |
| WebKit interaction/layout checks | 32 passed; `webkit-results.json`; **visual limitation below remains open** |
| Failure recovery | 6 passed; style/module failure, retry, keyboard map operation, cart scoping, reduced keyboard viewport and invalid-coordinate API rejection |
| Accessibility | Six axe scans (picker, suggestions, details × English/Arabic) found zero WCAG A/AA violations; not a claim of complete WCAG conformance |
| Order persistence | Exact confirmed lat/lng, unit, floor/instructions, unchanged total and pending status verified in disposable SQLite orders |
| Staff view | Authorized QA admin displayed details and valid OSM links; manual records explicitly unverified (`admin-results.json`) |
| Paid API audit | Network assertions found no Google Maps/Places, Mapbox API, Nominatim or OSM public raster tile requests |
| Lazy loading | Zero mapping-library/tile requests before Open Map (`loading.json`) |

Widths: 320, 360, 375, 390, 393, 414, 430 and 768, plus 1440 desktop and 844×390 landscape, in English and Arabic. Checks assert no page overflow, pin center alignment, visible close and confirm actions. A 390×380 reduced viewport exercises keyboard-space recovery, but does not substitute for a real phone keyboard.

GPS tests use deterministic browser fixtures for permission, timeout, accuracy and race conditions. Rendering uses real MapLibre/OpenFreeMap. All order tests use a catalogue-only disposable database; external customer/admin notifications are suppressed. No actual customer order or paid transaction was submitted.

## Visual preservation and performance

Before/after checkout screenshots use matching sizes and catalogue fixtures. Manually inspected comparisons are saved as `checkout_html-390-en-comparison.png` and `checkout_html-1440-en-comparison.png` in `tests/map-artifacts/after/`. The recognizable typography, palette, header, forms, payment styling and summary remain intact. The intentional change is replacing the always-visible map with a focused picker and compact address details; the payment section consequently moves upward.

Desktop pixel comparisons at threshold 0.1 found **zero changed pixels** in the header (1440×78), billing/address region (600×220) and order-summary region (400×330). See `visual-results.json`. This does not assert that the intentionally changed map region is pixel-identical.

One local unthrottled smoke run reached the captured open/search state in 1,871 ms, including a deliberate 1,000 ms screenshot wait. This is not LCP or a production percentile. The source audit and network check verify deferred loading; no before/after speed ratio is claimed. MapLibre's uncompressed module is approximately 1.08 MB and its worker approximately 508 KB, deferred until needed. Deployment compression/CDN behavior affects transfer sizes. No Lighthouse or real-user Core Web Vitals target is claimed by this task.

## Remaining limitations / release checks

1. **Safari visual verification remains incomplete.** The available Windows WebKit engine passed state/interaction/layout tests, but modal screenshots show a blank canvas. A test-only preserved WebGL drawing buffer contains the correctly rendered map (399 rendered features); a minimal standalone MapLibre control page renders correctly. Resize feedback was fixed, but the modal compositing/snapshot discrepancy is not resolved. Do not treat WebKit interaction passes as a visual pass. Verify the actual picker on iPhone Safari before release, and resolve any visible blank-map behavior. Evidence: `webkit-picker-390-en.png`, `webkit-canvas-buffer.png`, `webkit-minimal-control.png`.
2. Physical iPhone Safari and Android Chrome devices were not available. Real keyboard, GPS accuracy, touch/pinch and OS permission behavior still require device testing.
3. OpenFreeMap has no guaranteed SLA. Manual address entry/staff review remains usable after a provider/library/WebGL failure. Configure a self-hosted replacement if operational availability requires one.
4. Area search is not a complete address database; no precise street/building lookup or boundary-based area inference is claimed. Review/update the source periodically.
5. Business delivery coverage/fees were absent. No invented rule was added; staff acceptance remains authoritative.
6. Changes are local and tested on an isolated preview, not deployed to the public website. Restart the application after dependency installation to load the new routes/migration. Existing deployment backup practices should cover the additive schema change.

## Final checklist

- [x] Free MapLibre/OpenFreeMap map, no billable mapping API or key
- [x] Local licensed Qatar area search with Arabic/aliases where available
- [x] Optional GPS with recovery and stale-result protection
- [x] Center pin, deliberate confirmation, edit/cancel and restoration
- [x] Qatar details reach order records and staff view
- [x] Existing pricing/payment/cart/SEO protected by regressions
- [x] Mobile layouts and accessibility checked
- [x] Provider failure/manual checkout and invalid-coordinate rejection tested
- [x] Attribution and provider limitations documented
- [ ] Real-device Safari/Android verification and WebKit modal visual discrepancy resolved
- [ ] Authoritative unsupported-area rejection tested (rules not present)
