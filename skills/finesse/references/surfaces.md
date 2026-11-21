# Surfaces: layout by register

Read this when you lay out a marketing page (hero, sections, imagery, copy) or a product screen (shell, dashboard, table, form, settings, empty state). The last section covers responsive checks for both.

## Marketing

### Page structure

Order sections by the buyer's questions: what is it, is it for me, does it work, what does it cost, what next. Typical run: nav (logo, 3 to 5 links, one action), hero, proof, two to four feature sections each with one piece of evidence, pricing or the next step, footer. Proof means real logos, a real quote or a sourced number; omit it when the brief supplies none.

### Hero patterns

The centred headline, subline and two buttons over a gradient is the template. Pick a pattern for the character sentence instead.

| Pattern | Fits |
|---|---|
| Split: copy in 5 columns, product UI in 7, bleeding off the right edge | Software |
| Product first: short headline above one large screenshot or video | Tools whose UI is the pitch |
| Type led: a large headline, one photograph or none | Studios, editorial |
| Full-bleed photograph, headline on a solid band or empty sky, no scrim | Places, physical goods |
| Working demo: a live input (search, code, calculator) in the hero | Developer tools |
| Index: the hero is the list of actual work or offerings | Portfolios, agencies |

These are shared structures. A hero that uses the same pattern as an exemplar is fine; the direction (palette, type, signature, content) is what must differ.

**Bleed off the edge.** Let the product UI run past the container on the right, by up to a quarter of its width. Clip it on the hero section with `overflow-x: clip`, never on `body` or `html`: clipping there breaks `position: sticky` and still lets a phone scroll sideways. Below 768 px stop the bleed and fit the UI to the gutter.

**A chart as the evidence.** Build it to the finish of `assets/exemplars/data.html` (one chart with HTML labels), or `dashboard.html` when the hero shows a whole product screen.

- Left-align by default. Centre only a one-line headline over a symmetric composition.
- The headline names the thing and its buyer in plain words. One concrete fact on the first screen.
- At most two actions: one button, one text link.
- A load-time hero entrance is not the page's one scroll-reveal style.
- The first screen at 1440 by 900 shows the product, not only words.

### Section rhythm

- Section spacing 96 to 128 px on desktop, 64 px on phone. A heading sits 32 px above its content.
- No two neighbouring sections share a layout. Rotate among: media and text split (alternate the side), full-width media, a list or table, one large quote, a bento with unequal cells, a single text column at 60 to 75ch.
- At most one dark or brand-coloured band per page. Separate sections with spacing before colour.
- End with one next step, not three stacked calls to action.

### Imagery

- Product UI: real screenshots at 2x, or the real UI built in HTML, in a believable state.
- Photography: the client's own, or licensed stock you verified loads. No AI-generated people posing as customers.
- Never a coloured `div`, a grey box or a gradient rectangle standing in for an image. With no asset, build the UI in HTML or drop the slot and list it in the report.
- Set `width` and `height` or `aspect-ratio` on every image, `srcset` and `sizes` on large ones, `loading="lazy"` below the fold only.
- `alt` describes what the image shows. Decorative images get `alt=""`.
- One icon set, one stroke width. No emoji as icons.

### Copy

- Headings: sentence case, a noun and a specific claim, at most two lines at 390 px.
- Buttons: verb plus object ("Start a free trial", "Download for Mac", "Book a call"). "Get started" and "Learn more" only when the destination is obvious.
- One idea per paragraph, three lines at most.
- Numbers are exact and sourced, or absent. No invented metrics, customers or quotes.
- Vocabulary and cadence tells are listed in `references/slop.md`.

## Product

### App shell

- Sidebar navigation for five or more destinations, top navigation for fewer. Collapse the sidebar to icons at 1024 px and to a sheet or a tab bar below 768 px.
- Mark the active destination with weight or a filled background, not colour alone.
- Content area padding 24 to 32 px. Width is fluid; prose and forms inside it stay at 60 to 75ch.

### Page header

Every screen uses the same header: title on the left, primary action on the right, secondary actions in an overflow menu, breadcrumbs above when the page is two or more levels deep. The header keeps one height on every screen, so moving between pages does not shift the content.

### Density

Primary text 16 px, secondary 14 px. Table rows 40 px, 32 px for dense data, 48 px for two-line rows. Related controls 8 px apart, groups 24 px apart.

### Dashboards

Read `references/dashboards.md` and open `assets/exemplars/dashboard.html` before you lay one out. A dashboard is dense and colourful by default.

- The first screen at 1440 by 900 holds 40 or more numbers, 6 or more visuals and 3 or more series hues. Its composition is an archetype from `references/dashboards.md`, picked from the product's lead question.
- Tiles on a 12-column grid with 16 px gutters, 16 px padding. Text 14 px, labels and axes 12 px.
- Each figure has a unit, a comparison and a visual, and sibling tiles use different visual types.
- One table under three numbers is not a dashboard. Add the charts the data supports.

### Tables

- Left-align text, right-align numbers with `tabular-nums`; headers follow their column.
- Sticky header, visible sort state, row hover.
- Row actions sit at the row end. They may appear on hover, but stay reachable by keyboard.
- Truncate long cells; show the full value in a tooltip or detail view.
- Empty, loading and error states render inside the table frame, so the layout does not jump.
- On phone, scroll the table inside its own container or turn rows into stacked cards. The page itself never scrolls sideways.

### Forms

- One column. Label above the field, help text below it.
- An error replaces the help text, says how to fix it, and is linked with `aria-describedby`. Validate on blur, then live once a field has shown an error.
- Fields 44 px on touch, 40 px allowed in dense pointer UI. Input text 16 px on touch.
- Group related fields with `fieldset` and `legend`, 24 to 32 px between groups.
- Submit stays enabled and reveals errors on press. While submitting it shows a spinner and keeps its width.

### Settings

Desktop: section heading and one-line description in the left third, controls in the right two thirds; stacked on phone. Save per section, or autosave with a toast. Destructive actions go last, in their own section, and confirm by naming what is destroyed.

### Empty, loading, error

| View | Contains |
|---|---|
| First-run empty | What will appear here and one action to create the first item |
| No results | The query or filters that matched nothing, and a way to clear them |
| Loading | A skeleton shaped like the content, shown only after about 300 ms |
| Error | What happened in plain words, what to do, a retry action. Keep the user's input. |

### Sibling screens

Finish one screen, then derive its siblings from it. Header, padding, table style, action placement, empty states and vocabulary match. A sibling differs only for a reason the user would name.

## Responsive

- Screenshot at 1440 and 390 px in each theme the brief needs; check 320 px for horizontal scroll.
- Size components by their container: `container-type: inline-size` on the slot, `@container` rules in the component.
- Card grids without breakpoints: `grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr))`.
- Safe areas: `viewport-fit=cover` in the viewport meta, `env(safe-area-inset-*)` padding on fixed headers and bottom bars. Use `100dvh`, not `100vh`, for full-height panels.
- Phone: 4 or more nav links go in a sheet behind a menu button. Form actions full width.
- Touch targets 44 px with 8 px between them, 32 px only in dense pointer UI. Pad a small icon's hit area rather than enlarging the icon.
- Gate hover effects with `@media (hover: hover) and (pointer: fine)`, or a tap leaves them stuck. Nothing lives only on hover: row actions and tooltips are reachable by focus and by tap.
- User content breaks safely: `overflow-wrap: anywhere` on names, emails and URLs, `min-width: 0` on flex and grid children that hold text.
