# Examples

Pages built by an agent following the finesse skill, and the same briefs built without it. Each is a static site with no build step. Open its `index.html` in a browser.

## How they were made

- **Model.** Claude Opus at high effort, for both the with-skill and without-skill builds.
- **With the skill.** The agent was told to read `skills/finesse/SKILL.md` and follow it, then given the brief below.
- **Without the skill.** The agent was given only the brief and told to read no skill or guideline files.
- **Edits after the build.** Three small manual fixes were made after review, and nothing else was touched: Ledgerline's font was swapped from Schibsted Grotesk to Geist, because the first face sets its tabular comma and period a full figure wide; Tidewater's two hairline separators were turned from horizontal to vertical; Perigee's viewfinder labels were given a backing.

## The builds

| Folder | Mode | What it is |
|---|---|---|
| `ledgerline/` | `/finesse build` | A dashboard and invoices page for an invoicing app. Try `?theme=light`, `?page=invoices`, `?sheet=1`, `?view=empty`, `?view=loading`. |
| `tidewater/` | `/finesse build` | A landing page for a tide and swell forecast app. Try `?theme=dark`. |
| `perigee/` | `/finesse showpiece` | A launch page for a pocket star tracker, with a three.js hero and GSAP scroll moments. Loads GSAP and three.js from a CDN. Try `?motion=reduce`. |
| `without-skill/ledgerline/` | none | The Ledgerline brief with no design skill. |
| `without-skill/tidewater/` | none | The Tidewater brief with no design skill. |

## The gallery

Twenty more pages, one niche each, built for the README gallery. Each was built by an agent that read `SKILL.md` and followed its workflow from the brief below. To keep the twenty apart, the coordinator ran the dealer once per brief and passed `--avoid` with every palette and type pairing already dealt, so no two pages share either. The agents chose among the three candidates they were given.

| Folder | Mode | What it is |
|---|---|---|
| `pasteis/` | `/finesse build` | Landing page for a Lisbon pastry bakery. |
| `nachtwerk/` | `/finesse build` | Event page for a monthly techno night in a Leipzig power station. |
| `atelier-vos/` | `/finesse build` | Portfolio for a Rotterdam timber housing studio. |
| `hollowlight/` | `/finesse showpiece` | Launch page for a lighthouse puzzle game, with a three.js beam. Loads three.js from a CDN. |
| `quinta/` | `/finesse build` | Website for a family wine estate in the Douro. Opens dark; try `?theme=light`. |
| `cragline/` | `/finesse build` | App screen for a climbing gym route tracker. |
| `vector-cli/` | `/finesse build` | Landing page for an open source schema diff CLI. |
| `kubewatch/` | `/finesse build` | Observability dashboard for a Kubernetes platform team. |
| `casa-salina/` | `/finesse build` | Website for an eleven room hotel in a Sicilian salt warehouse. |
| `orbit-kids/` | `/finesse build` | Website for a children's science museum. |
| `pennywise/` | `/finesse build` | Personal budgeting dashboard. Opens dark; try `?theme=light`. |
| `stride/` | `/finesse build` | Product drop page for a road running shoe. |
| `marginalia/` | `/finesse build` | Website and newsletter for an independent bookshop. |
| `clinic/` | `/finesse build` | Appointment booking flow for a family clinic, with errors, a fully booked day and a confirmation screen. |
| `modular/` | `/finesse showpiece` | Launch page for a compact analogue synth, with a three.js model and playable patterns. Loads GSAP and three.js from a CDN. |
| `soundcheck/` | `/finesse build` | Artist analytics dashboard for a streaming service. Opens dark; try `?theme=light`. |
| `petal/` | `/finesse build` | Online shop for an Edinburgh florist. |
| `quill-ai/` | `/finesse build` | Landing page for an AI support reply tool. |
| `deepwater/` | `/finesse build` | Annual report microsite for a marine research charity. |
| `ramen/` | `/finesse build` | Website for a fourteen seat ramen counter. |

Some pages read the real clock: Kaedama's open or closed badge, Petal & Stem's delivery cut-off, Orbit's opening card, and the countdowns on Soundcheck and Stride. Screenshots taken at another time show other states. Cragline and Stride follow the system theme; their screenshots use `?theme=light`.

Two agents swapped the type pairing they were dealt for Darker Grotesque, so Nachtwerk and Stride share a display face with each other and with Perigee. Every palette is still unique.

Photographs come from Wikimedia Commons and Unsplash under their licences. Each page that uses them lists every file, source, author and licence in its own `CREDITS.md`. Everything else is drawn in HTML, CSS, SVG or three.js.

**Edits after the gallery build.** After review, a second agent round changed five pages, and nothing else was touched. Nata & Co. and Kaedama had both pushed their food photographs through a halftone until they stopped looking edible, so their heroes went back to full colour (Kaedama keeps the halftone on secondary bowls). Nata & Co., Orbit and Deepwater lost an accent coloured word in the headline. Quinta's white wine was drawn in red in the light theme, and now takes its colour from the wine. Deepwater's noise heat map was regrouped into three bands that stay apart in both themes. The first two problems became tells 10 and 14 in `SKILL.md`.

### Gallery briefs

| Page | Brief |
|---|---|
| Nata & Co. | Landing page for Nata & Co, a Lisbon pastry bakery that sells pastéis de nata and bakes in front of the window from 6am. Opening hours, the four pastries they make, preorder boxes of 6 and 12, and how to find the shop in Bairro Alto. |
| Nachtwerk | Event page for Nachtwerk, a monthly techno night in a former power station in Leipzig. Next three dates with line-ups, door policy and house rules, ticket prices, and how to get there at night. Bold, loud, after dark. |
| Atelier Vos | Portfolio site for Atelier Vos, a three-person architecture studio in Rotterdam that designs timber housing. Selected projects with drawings and key figures, the studio's approach, the team, and contact. |
| Hollowlight | Launch page for Hollowlight, an indie puzzle-exploration game about a lighthouse keeper, coming to Steam and Switch in spring. Story hook, gameplay pillars, a press kit section, system requirements and a wishlist call to action. Dark, atmospheric. |
| Quinta do Vale Alto | Website for Quinta do Vale Alto, a small family wine estate in the Douro valley. The four wines with tasting notes and vintage data, harvest and terroir, visiting and tastings, and buying direct. No photos supplied. |
| Cragline | App screen for Cragline, a climbing gym route tracker: the member's logbook with sends by grade over time, a grade pyramid, current projects with attempts, the gym's wall map with new routes this week, and session history. |
| Vector | Landing page for Vector, an open-source command-line tool that diffs database schemas and generates migrations for Postgres and MySQL. Install command, a terminal example of a diff, how it works in CI, benchmarks against two named alternatives as relative numbers only, and docs links. For developers. |
| Kubewatch | Observability dashboard for a Kubernetes platform team: cluster health, request rate, error rate and p95 latency over 24 hours, pods by namespace, a deploys timeline, active alerts with severity, and the noisiest services. |
| Casa Salina | Website for Casa Salina, a boutique hotel of 11 rooms in an old salt warehouse on the Sicilian coast. The rooms, the kitchen, the salt flats nearby, rates by season, and booking. Calm, sun-bleached. |
| Orbit | Website for Orbit, a hands-on science museum for children aged 4 to 12. Today's opening hours, the five galleries, school visits, birthday parties, tickets and family memberships. Playful but clear for parents. |
| Pennywise | Personal budgeting app dashboard: this month's spending against budget by category, a running balance chart, upcoming bills, savings goals with progress, recent transactions with merchant and category, and a monthly summary. Dark and light. |
| Stride | Product drop page for the Stride Tempo 3, a road running shoe: the launch date and time, colourways, the foam and plate story with numbers (stack height, drop, weight), sizing guide, and a notify-me signup. Energetic, sporty. |
| Marginalia | Website for Marginalia, an independent bookstore with a weekly newsletter. This week's staff picks with short reviews, upcoming author readings, the book club, opening hours, and newsletter signup. Literary, warm. |
| Northside Family Clinic | Appointment booking flow for Northside Family Clinic: choose a reason for the visit, pick a clinician with availability, choose a time slot on a calendar, enter patient details, and confirm. Include validation errors, a fully booked day and the confirmation screen. Calm, trustworthy, accessible. |
| Fieldform M8 | Launch page for the Fieldform M8, a compact analogue synthesiser with an 8-step sequencer: hero with the instrument, the signal path explained, the panel controls, audio demo track list, specs, and preorder at 649 dollars. A showpiece: three.js hero of the instrument, scroll moments. |
| Soundcheck | Artist analytics dashboard for a music streaming service: monthly listeners and streams over time, top tracks with trend, listener geography by city, playlist adds, audience age and source breakdown, and upcoming release countdown. |
| Petal & Stem | Online shop for Petal & Stem, a florist that delivers seasonal bouquets in Edinburgh. This week's bouquets with prices, a subscription for weekly flowers, delivery areas and cut-off times, and the story of the studio. |
| Quill | Landing page for Quill, an AI writing assistant for support teams that drafts replies in the company's own tone from their help centre. How it works, an example ticket and drafted reply, integrations with Zendesk and Intercom, security and data handling, pricing per seat. Avoid every cliché of AI startup landing pages. |
| Deepwater Trust | Annual report microsite for the Deepwater Trust, a marine research nonprofit: the year in numbers, three research stories told with charts and maps drawn from data, where the money went, and how to donate. Editorial data storytelling. |
| Kaedama | Website for Kaedama, a 14-seat ramen counter in Melbourne. The three bowls, the broth process, no bookings and how the queue works, opening hours, and location. Small, confident, appetising. |

## The briefs

**Ledgerline**

> Build the dashboard for Ledgerline, an invoicing app for freelancers. App shell with a sidebar (Overview, Invoices, Clients, Expenses, Reports, Settings) and a top bar with search and a 'New invoice' action. The Overview page is the main thing: this month's income, outstanding and overdue amounts, average days to get paid, a cash flow chart of income against expenses over the last 12 months, where the money comes from by client, an ageing breakdown of unpaid invoices, recent invoices with status, and upcoming payments due this week. I also want the Invoices page: filter tabs (All, Draft, Sent, Overdue, Paid) and a table with number, client, issued, due, amount and status; clicking a row opens a detail sheet with line items and a 'Send reminder' action that shows loading then success. Show me the empty and loading states too. Dark and light.

**Tidewater**

> Build the landing page for Tidewater, a tide and swell forecasting app for surfers and sailors. It gives a 7-day forecast for any break or harbour: tide curve, swell height, period and direction, wind, and a plain-language 'best window' for each day. It is free for one saved spot and 4 dollars a month for unlimited spots and alerts. Sections I want: hero, how the forecast reads (show the product), the alerts feature, pricing, and a footer. Support light and dark. I have no photos, so show the product itself.

**Perigee**

> Build the launch page for Perigee, a pocket-sized star tracker for astrophotography: a motorised mount that counter-rotates a camera against the Earth's spin so long exposures keep stars sharp. 640 grams, 5 kg payload, 20 hours on one charge, polar-aligns itself with a built-in camera in about 90 seconds, 349 dollars, ships in March. I want this one to be a showpiece: a three.js hero, scroll-driven moments with GSAP explaining how it works, parallax depth, and a clean specs and pre-order section at the end. Dark by nature, but it must still be readable and accessible. No photos available.

## Known gaps in these builds

- Ledgerline's Clients, Expenses, Reports and Settings links and its upgrade button do nothing. "New invoice" only creates an empty draft.
- Tidewater's sign-up buttons go to in-page anchors. Perigee's pre-order form has no backend and says so.
- All product names, people and figures are invented for the demos.
