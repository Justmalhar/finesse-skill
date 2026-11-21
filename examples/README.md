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
