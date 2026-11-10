# NileTrails — Information Architecture, Routes and Content Model

## Production navigation
**NILE CRUISES | DAHABIYAS | JOURNEYS | BEYOND THE NILE | NILE STORIES | ABOUT | [PLAN YOUR JOURNEY]**
Logo links to `/`.

## Core routes
| Template | Production URL | Content |
|---|---|---|
| Homepage | `/` | Editorial entry, search, experience families |
| Cruise collection | `/nile-cruises` | Multi-field filters, cruise cards |
| Cruise category | `/nile-cruises/category/[category]` | Luxury / Deluxe / Superior |
| Cruise duration | `/nile-cruises/duration/[nights]` | 3 / 4 / 7 nights |
| Cruise direction | `/nile-cruises/route/[route]` | Luxor to Aswan / Aswan to Luxor |
| Cruise detail | `/nile-cruises/[slug]` | Vessel, itinerary, cabin, inclusions, enquiry |
| Dahabiya collection | `/dahabiyas` | Luxury / Deluxe Traditional / Private |
| Dahabiya category | `/dahabiyas/category/[category]` | Category landing page |
| Dahabiya detail | `/dahabiyas/[slug]` | Boat, itinerary, sailing style, enquiry |
| Why dahabiya | `/dahabiyas/why-sail-by-dahabiya` | Editorial explainer |
| Journey concepts | `/journeys` | 6 curated routes as inspirational concepts |
| Journey detail | `/journeys/[slug]` | Suggested stops, optional variations |
| Destination collection | `/beyond-the-nile` | Geographical exploration |
| Destination detail | `/beyond-the-nile/[slug]` | Discover > Experiences > Hotels > Relevant sailing > Journeys |
| Journal | `/nile-stories` | Stories index, topic filter |
| Story category | `/nile-stories/category/[category]` | Topic-specific articles |
| Article | `/nile-stories/[slug]` | Long-form content with editorial CTA |
| About | `/about` | Positioning, story, belief |
| Story | `/about/our-story` | Approved company narrative |
| Why NileTrails | `/about/why-niletrails` | Value and differentiators |
| Team | `/about/our-team` | Real profiles when provided |
| Travel info | `/travel-information` | Guidance, FAQs, official references |
| Contact | `/contact` | Contact form, verified details |
| Plan | `/plan-your-journey` | Multi-step lead enquiry |
| Legal | `/privacy-policy`, `/terms-and-conditions` | Client-approved legal copy |

The **prototype** implements its routes as `#/...` for portability, renders 16 representative templates plus dynamic content routes, and uses query filters for categories. **Antigravity must replace these with clean production URLs**. No page exists solely to inflate menu size; category templates should work with content and SEO intent.

## Journey concepts (never framed as fixed departures)
1. Classic Nile Journey — Cairo → Luxor → Nile → Aswan.
2. The Complete Nile — Cairo + Luxor + Nile + Aswan + Abu Simbel.
3. Nile & Desert — Nile + Bahariya + White Desert.
4. Nile & Red Sea — Nile + Hurghada / Marsa Alam.
5. Nile & Nubia — Nile + Aswan + Nubian experience.
6. Grand Egypt Journey — Cairo + Nile + Abu Simbel + Red Sea.

## Destination seed collection
Cairo & Giza, Alexandria, Red Sea, Western Desert, Bahariya & White Desert, Alexandria & Siwa Oasis, Fayoum Oasis.

## Nile Stories taxonomy
Stories of the Nile, Ancient Egypt, Temples & Tombs, Life Along the River, Dahabiya Life, Nile Cruise Guide, Travel Tips, Egypt Travel Guide, Food & Culture, News & Updates.

## Data content models
- **Cruise**: id, slug, displayName, category, verifiedClassification, durationNights, from/to, itinerary[], images[], cabins[], facilities[], dates[], pricingPolicy, publishedPrice if allowed, currency, included[], excluded[], FAQs[], vesselVerified, SEO.
- **Dahabiya**: id, slug, name, luxuryLevel, charterType, exactVessel, route, itinerary[], suites[], deckPlan, images[], inclusions[], exclusions[], dates[], SEO.
- **JourneyConcept**: id, slug, title, summary, stages[], recommendedExtensions[], interests[], image, recommendedDuration (if approved), SEO; prices optional/not displayed until confirmed.
- **Destination**: id, slug, region, longDescription, experiences[], accommodation[], relatedProducts[], suggestedJourneys[], gallery, SEO.
- **Article**: id, slug, title, category[], intro, bodyBlocks[], author, publicationDate, relatedArticles[], relatedExperience, images[], SEO.
- **Enquiry**: id (server-generated), contactData, consentTimestamp, selectedTravelType, linkedProductId, destinations, preferredMonth, party, duration, comfort, optionalBudget, notes, status, assignedAgent. Follow privacy retention rules.
- **Settings**: brandContact, websiteSocials, supportedLanguages, analyticsConfiguration, SEO defaults, legal text, privacy consent version.

## Data verification
Mandatory client-supplied input: company legal identity, real boat names, confirmed itineraries, route variations, availability model, inclusion and exclusions, genuine media licenses, phone/email/address, contact SLA, payment policy, cancellation terms, privacy and cookie handling, CMS owner access.
