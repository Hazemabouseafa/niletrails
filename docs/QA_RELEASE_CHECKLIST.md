# NileTrails — QA and launch readiness

## Checks run on the prototype
- All **16 representative routes** rendered on desktop (1440×900 viewport) and mobile (390×844 viewport).
- Images resolved in bundled browser screenshot harness.
- No browser JavaScript exceptions observed after the route and favourite-state bug fix.
- No horizontal overflow in the sixteen representative mobile templates after planner grid fix.
- Cruise filter `Luxury` returns sample results; travel planner can move from step 1 → 2 → 3; mobile menu opens.
- Screenshots saved under `previews/`.

## Production acceptance checklist
- [ ] Original brand logo matches supplied client file and is sharp on Retina displays.
- [ ] Screenshots at 1440, 1024, 768, 390 match expected hierarchy/layout; no overflow.
- [ ] Navigation keyboard, pointer and touch interactions work without trapping focus.
- [ ] All menu/CTA/footer links resolve to correct live routes; 404 handled.
- [ ] Category, duration, direction, sort and reset filters actually work with real inventory.
- [ ] Real cruise and dahabiya inventory verified; details/images match named vessel.
- [ ] No unsupported hotel, price, review, vessel, guide or license claims.
- [ ] Enquiry backend, validation, persistence, staff notification, anti-spam and privacy approved and tested.
- [ ] Availability/quotes do not masquerade as immediate booking transactions.
- [ ] CMS ownership/editability and role permissions tested.
- [ ] Approved legal pages and consent management in place.
- [ ] Every page receives unique title/meta/OG/canonical tags and sits in sitemap.
- [ ] Core Web Vitals, mobile performance and image licensing reviewed.
- [ ] Accessibility audit includes screen reader, keyboard, contrast, form errors and touch targets.
- [ ] Security: no keys in frontend, rate-limiting, CSRF strategy where relevant, input sanitation, proper PII handling.
- [ ] Analytics events use no personal user details; consent respected.
- [ ] Client signs off brand tone, imagery, route data, contact methods, booking process and launch readiness.

## Important non-claims
Current UI photos are AI concepts. All voyage names/styles/itineraries in JS data are sample inventory. This is an interactive front-end demo, not a working booking engine, CMS or live form delivery service. Legal pages intentionally use placeholders until approved.
