# NileTrails Atelier — Visual and Interaction Specification

## Positioning
NileTrails / Sailing the Nile. A Nile-centred Egypt travel identity combining carefully chosen cruises, dahabiyas, and tailor-made journeys. Premium **craft**, not luxury-only **pricing**. Warm, adventurous, grounded, and credible.

## Brand modes
- **Discover:** editorial photography, arresting headlines, inspirational storytelling.
- **Compare:** transparent filtering, meaningful distinctions, consistent specs.
- **Decide:** clear itineraries, inclusions, route, verified availability, enquiry CTA.
- **Connect:** private, low-friction enquiry form without misleading instant-booking promises.

## Tokens
| Variable | Hex | Function |
|---|---|---|
| --ink | `#102D3C` | Primary text |
| --navy | `#0D2A3A` | Buttons & contrast |
| --deep | `#092434` | Sections & footer |
| --gold | `#C7A36A` | Warm emphasis / accent CTA |
| --cream | `#F8F5EF` | Warm surfaces |
| --sand | `#F0ECE3` | Secondary surfaces |
| --muted | `#75828A` | Secondary text |
| page background | `#FCFAF6` | Main light canvas |

Typography: Playfair Display for high-impact editorial headings (italic selectively), DM Sans for content and forms. Source HTML loads Google Fonts when available; uses resilient system fallbacks.

Container 1416px max; desktop gutters 52px minimum in 1440 context, mobile 19px. Desktop section padding ~114px, mobile ~72px. Editorial image cards mostly sharp corners. Primary button min 54px desktop, 50px mobile. Photo aspect ratio per template, varied to avoid repetitive cards.

## Navigation
- Header is sticky; desktop dropdowns on hover and keyboard focus; mobile accordion menu.
- Logo is Home route. Main CTA Plan Your Journey is consistent across page templates.
- All detail pages have semantic breadcrumbs, editorial hero or heading, and contextual enquiry path.

## Cards and filters
- Collection cards always include a clear title, verified categories/metadata (currently placeholder), and an actionable destination.
- Search filters use native selects for predictable keyboard and mobile behavior.
- Empty results tell the user how to recover.
- Favourite heart action stores a demo shortlist in browser localStorage (not a production account feature).

## Forms
- Three steps; required fields validated per step; back retains selected values.
- Step 1: type (cruise, dahabiya, journey, unsure), destinations, duration.
- Step 2: month, traveller count, comfort, optional budget, notes.
- Step 3: name/email/phone/country, explicit consent.
- Prototype intentionally does not send data or store data remotely. Production must implement protected endpoint, actual confirmation and privacy.

## Accessibility targets
- Color contrast WCAG AA in final validated implementation.
- Semantic landmarks, labels, understandable microcopy, keyboard navigation, focus visibility, 44px touch targets.
- Avoid information encoded in color alone, honor reduced motion, and no unintended content hiding at mobile widths.

## Content hygiene
No fabricated review scores, price tags, operating credentials, publication dates, contact numbers, or specific commercial inventory. AI concept pictures must be swapped for verified, legally usable real images. Brand and product names are text, not baked into images, eliminating spelling mistakes in production UI.
