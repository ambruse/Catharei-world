# Checkout delivery location optimization

**Superseded implementation choice:** The user subsequently requested a completely free stack. The final implementation and verification are documented in [FREE_MAP_CHECKOUT_IMPLEMENTATION.md](FREE_MAP_CHECKOUT_IMPLEMENTATION.md). No Google mapping integration remains.

## Baseline audit — before implementation

2026-10-11. Existing Express/SQLite checkout is `checkout.html`, using Leaflet 1.9.4 and OpenStreetMap tiles. Baseline browser commerce checks passed all 16 journeys, including two real orders against the isolated local QA database with external notifications suppressed. Six pre-change screenshots are in `tests/map-artifacts/before/` (320, 390, 768, 1440 English and 320, 390 Arabic).

Verified defects:
- Doha default coordinates were written to every order without customer selection, including map-library failure.
- “Confirm on Map” was a label, not a confirmation workflow. Only a draggable marker and small GPS button existed.
- No search, reverse geocoding, accuracy feedback, geolocation timeout configuration, or selected-location restoration.
- Free-text address and coordinates were independent; async GPS could replace a manually selected position.
- Backend accepted arbitrary coordinate values without validation.
- No structured Qatar building/unit fields existed.

Architecture and business rules:
- Orders already store `address`, `lat`, `lng`; guests and logged-in customers use the same endpoint. Authentication prefills name/email only. No saved-address model exists.
- Orders enter `pending`, require staff acceptance and the existing customer phone confirmation. No serviceability polygons, delivery-fee calculations or approved delivery areas exist in source. These must not be invented.
- No Google Maps/Places configuration was found. The initial Google plan was superseded by the user's MapLibre/OpenFreeMap/local-search request before integration.
- Existing payment methods, cart, prices, order status and notifications remain protected.

See the final free-map report for implementation and verification results.
