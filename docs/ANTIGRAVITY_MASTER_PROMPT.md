# ANTIGRAVITY — IMPLEMENTATION PROMPT (NILETRAILS ATELIER V2)

You are implementing the production website for NileTrails, a Nile-focused Egypt travel brand with the tagline **Sailing the Nile**. The supplied folder is a comprehensive **UI/UX reference and interactive prototype**, NOT production booking software. Build the production site from its design language, routes, page screenshots and content architecture. Be meticulous about text accuracy, visual consistency, mobile UX, accessibility, performance and discoverability.

## 0. SOURCE OF TRUTH / NON-NEGOTIABLES
1. `assets/niletrails-logo.png` comes from the client-supplied logo. Preserve its proportions and identity; no logo reimagining.
2. `previews/` contains rendered high-fidelity **desktop 1440px and mobile 390px** references. Match composition, typography hierarchy, negative space, spacing and key user flows, not just the palette. Screenshots supersede any generic template recommendations.
3. `styles.css` is the token/component blueprint. `app.js` is a working interaction and content-flow prototype. You may redesign the underlying code architecture, but preserve the UX intent and the routes.
4. Images in `assets` other than the logo are **AI-generated design placeholders**, not verified representations of real Egyptian landmarks, real Nile vessels, or client properties. Replace with approved, licensed photography for launch.
5. All current tour inventory, cruise durations, routes, sample card descriptions and editorial pieces are **illustrative**, pending the client's verification. Never treat sample copy as approved, claim live availability, invent vessel names, prices, reviews, partner logos, agency credentials, ratings, phone numbers, addresses or licensing details.
6. Never declare the forms connected until they actually save to a backend, notify the team, respect consent, implement abuse protection and provide auditability.
7. Keep **NileTrails** differentiated from **Kemet Egypt Travel**. Do not introduce another company's name or corporate claims without explicit authorization.
8. Keep *Journeys* inspirational/customizable, not another cruise price list. Keep *Beyond the Nile* destination-centric, not a duplicate trips catalog.

## 1. VISUAL SYSTEM
- Editorial, quietly premium, authentic, warm, modern and welcoming across price tiers — not opulent-by-default.
- Colors: Ink/navy `#102D3C`; deep night `#092434`; warm metallic sand `#C7A36A`; ivory `#FCFAF6`; warm cream `#F8F5EF`; sand `#F0ECE3`; muted copy `#75828A`.
- Type: Display `Playfair Display` (Georgia fallback) for large headlines and italic accents; body/UI `DM Sans` (system Arial fallback); generous line-height, 15–18px body on desktop, 14–16px on mobile; minimum 16px for form inputs to avoid iOS zoom.
- Layout: Max container about 1416px, generous 104px desktop side gutters and 19px mobile side padding; controlled vertical rhythm; image-led hierarchy; very limited decoration.
- UI: Subtle borders, nearly square buttons, restrained hover movement, large editorial imagery, no fake ratings, no ticker clutter, no excessive rounded cards, gold as accent only.
- Photography: approved real river scenes, Nile cruise vessels and dahabiyas, authentic destinations, human moments where licensed. Supply meaningful alt text. Avoid stock-like or geographically implausible AI compositions in production.

## 2. INFORMATION ARCHITECTURE
Primary navigation:
- Logo (home)
- Nile Cruises (collection and category/duration/direction filters)
- Dahabiyas (Luxury, Deluxe Traditional, Private, routes, why sail)
- Journeys (6 inspiration concepts)
- Beyond the Nile (destination explorer)
- Nile Stories (editorial journal; never call the nav item “Blog”)
- About (company/story/team/travel information/contact)
- Primary CTA: **Plan Your Journey** (persistent, high contrast).

Use real URLs and server-rendered route metadata in production, not the static prototype's `#/` routes. Build linkable collections and SEO routes in the sitemap document, with canonical URLs, breadcrumbs and CMS-driven details.

## 3. PAGE BLUEPRINTS / EXACT UX

### Homepage `/`
- White/cream navigation with original blue logo; compact menu and strong Plan Your Journey CTA.
- Cinematic full-bleed river hero with left-aligned large editorial headline **“Find your Egypt along the Nile.”**; subcopy about cruises, dahabiyas and tailor-made journeys; two CTAs: Explore the Nile and Make it Personal.
- Prominent accessible discovery bar: Experience → Travel Style → Duration → Discover. Dependent travel-style options should match selected experience; filters must deep-link to results.
- NileTrails philosophy editorial split section.
- Asymmetric experience image grid: Nile Cruises, Dahabiyas, Journeys, Beyond the Nile; all visible and tappable on mobile.
- Dahabiya/sailing story feature; cruise collection teasers; journey-led storytelling; editorial stories; distinctive footer enquiry CTA.
- Do not use an autoplay video or blocking full-screen loading animation. Hero image should be optimized for LCP.

### Nile Cruises `/nile-cruises`
- Dramatic category hero, overview, filter panel with **Travel style / Route / Duration / Sort**.
- Card image, tier, verified name (once data exists), duration, direction, concise proposition and enquiry link; prices only if approved, along with clear basis and currency.
- Distinguish Luxury, Deluxe and Superior by service expectations in copy without unsupported certification claims.
- Deep-linkable filters for 3, 4, 7 nights; Luxor→Aswan and Aswan→Luxor; category SEO landing pages as applicable.
- Empty state with Reset Filters and Ask a Travel Designer.

### Nile Cruise detail `/nile-cruises/[slug]`
- Breadcrumbs, prominent heading and specs, editorial photo gallery with verified vessel images, overview, cabin/amenities if provided, inclusions/exclusions, day-by-day itinerary, route map where verified, departure details and FAQs.
- Sticky enquiry module on desktop; in mobile implement an unobtrusive sticky **Request Quote** bottom action only when useful and never covering inputs/content.
- Clear “Price on Request” if no approved prices, never fabricated rates; specify status of availability.

### Dahabiyas `/dahabiyas`, `/dahabiyas/[slug]`
- Distinct story of the slow-sailing experience, tradition and intimacy; 3 categories (Luxury, Deluxe Traditional and Private Charter).
- Show sailing style, actual verified vessel details, sailing route, typical itinerary, deck/cabin pictures, exclusions and enquiry CTA.
- Standalone **Why Sail by Dahabiya?** informational page.
- No accidental conflation between a small traditional dahabiya and a conventional big ship.

### Journeys `/journeys`, `/journeys/[slug]`
- Keep Journeys conceptual: Classic Nile Journey, The Complete Nile, Nile & Desert, Nile & Red Sea, Nile & Nubia, Grand Egypt Journey.
- Elegant numbered editorial index; unique detail page with route, experiences, suggested order and **Customize This Journey** CTA.
- Never treat the suggested journey as a fixed confirmed itinerary or available departure before business approval.

### Beyond the Nile `/beyond-the-nile`, `/beyond-the-nile/[slug]`
- Destination-led editorial tiles. Destinations: Cairo & Giza, Alexandria, Red Sea, Western Desert, Bahariya & White Desert, Alexandria & Siwa Oasis, Fayoum Oasis.
- Every destination detail follows **Discover → Experiences → Hotels (when approved) → Cruises/Dahabiyas when geographically relevant → Suggested Journeys**. Avoid suggesting Nile sailing directly takes place in unrelated coast/desert locations; make connections as separate extensions.

### Nile Stories `/nile-stories`, `/nile-stories/[slug]`
- Editorial landing with featured story, category filters and article grid. Categories: Stories of the Nile, Ancient Egypt, Temples & Tombs, Life Along the River, Dahabiya Life, Nile Cruise Guide, Travel Tips, Egypt Travel Guide, Food & Culture, News & Updates.
- Article detail includes heading, hero, author/date if real, semantic structured body, related articles and relevant travel CTA. CMS-friendly, SEO metadata and article structured data where accurate.

### About `/about` + subpages
- About NileTrails, Our Story, Why NileTrails, Our Team, Why Travel With Us, Travel Information, Contact Us.
- Do NOT fabricate team members, testimonials, company founding year, Egypt licenses, offices or years of experience. Use neutral editorial sections until credentials are delivered.

### Plan Your Journey `/plan-your-journey`
- 3-step, accessible, compact form: (1) trip type / destinations / duration; (2) travel month, party, comfort level, optional budget + interests; (3) name, email, optional phone/country, explicit consent.
- Back/Next with progress states; inline accessible validation on current step; retain state while stepping back.
- Preselect trip type/experience from the detail page CTA; safely preserve data while navigating steps.
- Connect production backend securely: server validation, anti-spam, privacy compliance, transactional notification, CRM entry (if client provides CRM), useful success/error states. Never log PII to analytics or public logs.
- If lead conversion is email-enquiry only, make it clear it is not an instant booking.

### Contact / Travel Info / Legal
- Clear enquiry methods with only verified contact data, accessible contact form and realistic confirmation.
- Information page must refer users to authoritative current travel and visa guidance and avoid guarantees.
- Privacy, booking terms, cancellation and cookies must be supplied and approved by the business/legal adviser before going live.

## 4. IMPLEMENTATION QUALITY
Recommended modern implementation: Next.js App Router + TypeScript, structured components and templates, CMS abstraction, a validated data layer. Equivalent stack is fine if the client specifies it; never add complexity without a reason.
- Design tokens in CSS variables; reusable Header, Footer, Hero, ImageGrid, ExperienceCard, FilterToolbar, DetailTabs/Accordion, EnquiryCTA, StoryCard, Breadcrumb, FAQ, FormStepper.
- Responsive layouts at 1440, 1024, 768 and 390 widths. No horizontal scrolling or clipped text; 44px mobile tap targets; visible focus states; semantic HTML, keyboard-friendly menus, aria labels, useful empty/loading/error states.
- Accessible contrast targets (WCAG AA), meaningful headings, labels, error messaging, logical focus order, reduced-motion support.
- SEO: clean URLs, unique metadata, canonical tags, indexable rendering, XML sitemap, robots, Open Graph, semantic headings, internal linking, image alt, schema.org TravelAgency where business details are verified, Article/FAQ schema only when suitable and true.
- Performance: responsive AVIF/WebP licensed photos, avoid layout shifts, responsive srcset, appropriate image sizes, lazy load offscreen images, prefetch important route chunks selectively, protect hero LCP.
- Analytics with consent where required and event names for discover_search, category_filter, view_experience, start_enquiry, step_completed, submit_enquiry, click_contact. Never include user email/phone or message in event payloads.
- CMS: Inventory (cruises/dahabiyas), Journey Concepts, Destinations, Stories, FAQs, Site Settings, Legal Pages, Media, Contact Settings. Nontechnical editor must update content.
- Required business integrations must be configured from environment variables; no hard-coded secrets.
- Add tests: route integrity, mobile menu, filters/sort/reset, 3-step validation and prefilled enquiry, responsive overflow, unavailable images, 404 states, accessibility audit, sitemap/metadata, form delivery and notifications.

## 5. COMPLETION AND DELIVERY
1. Inspect supplied preview screens and app first; enumerate routes and proposed components.
2. Build design system, header and footer before templating content.
3. Implement category + detail templates; then journeys/destinations/stories; lastly planner and forms.
4. Obtain the client’s approved inventory, photographs, brand copy, contact data, legal copy and booking strategy; keep pending items labelled as pending.
5. Compare screenshots at desktop 1440px and mobile 390px to provided references and fix layout differences, then conduct all interactions tests.
6. Output deployable code, content import/template instructions, SEO plan, acceptance checklist and a clearly marked list of outstanding client assets/decisions.

**Important:** The brand is distinct and travel-led. Build a compelling editorial website that is easy to use, credible and conversion-focused — not a generic travel marketplace and not an exclusively luxury site.
