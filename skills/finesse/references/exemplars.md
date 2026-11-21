# Exemplars

Read this at workflow step 4, before you build a component, table, chart, dashboard or marketing section.
Open one file, the one that covers what you are building, plus `assets/exemplars/base.css`. Never open all five.
The files are large (30 to 85 KB). Skip the inline SVG path data (`d="..."` and `<symbol>` sprites); read the notes, the CSS and the markup structure.
The techniques behind them are named in `references/craft.md`.

## Which file

| Building | Open | It shows |
|---|---|---|
| Buttons, inputs, select, checkbox, switch, segmented control, tabs | `assets/exemplars/controls.html` | Raised and sunken controls, a state matrix, the async button that never changes width, a sliding tab indicator |
| Cards, list rows, dialog, sheet, menu, toast, tooltip | `assets/exemplars/surfaces.html` | Five card types that are not a bordered box, concentric radii, and every overlay drawn open and working |
| Tables, empty, loading and error states, a single chart | `assets/exemplars/data.html` | Numeric alignment, status as a glyph plus words, sticky header, selection bar, a teaching empty state, a skeleton, an SVG chart with HTML labels |
| Dashboards, analytics views, KPI tiles, charts inside an app shell | `assets/exemplars/dashboard.html` | A full screen at dashboard density in the **Ribbon and rail** archetype from `references/dashboards.md`: sidebar and top bar, four KPI tiles with four visual types, an area chart with a forecast line and a keyboard readout, a donut drawn from its table, entity cards with tinted status badges, a feed, loading and empty states |
| A marketing hero whose evidence is one chart | `assets/exemplars/data.html` | The SVG chart with HTML labels; take the hero layout from `references/surfaces.md` |
| Heroes, feature sections, pricing, footers | `assets/exemplars/marketing.html` | Three hero compositions (split, type-led, editorial), a feature list with three kinds of evidence, pricing on one surface, a footer |

## How to read one

- `assets/exemplars/base.css` holds what all five share: the craft layer (shadow stacks, edge highlights, hairlines) and the shared controls. Read it once, in addition to the one file.
- Read the numbered notes beside each piece first. They name the details to match. In `dashboard.html` they sit under the screen.
- Each piece has its own short CSS section with a comment that states the idea.
- Open the file in a browser to see it. `?palette=clay|cobalt|moss` and `?theme=light|dark` switch the roles. `?state=` opens a state where the file supports it (`dialog`, `sheet`, `loading`, `scrolled`, `yearly`).
- `dashboard.html` has its own palettes, each with six series colours: `?palette=graphite|linen|spruce`. Its states are `?state=loading`, `empty` and `tooltip`. Its rules are in `references/dashboards.md`.
- `dashboard.html` shows one composition, Ribbon and rail. Take its finish, never its layout by default: pick your archetype from the product's lead question. Its nav shows the inert-destination recipe: links to unbuilt screens carry `aria-disabled` and look normal.

## The rule

An exemplar sets the level of finish. It is never the design.

- Take from it: how depth is built, how states are completed, how numbers and status are set, how much detail a finished piece carries, and how dense a finished screen is.
- Sharing a common layout pattern is fine: a split hero, a sidebar shell. A dashboard's composition comes from its lead question, not from the exemplar.
- What must differ is the direction: the palette, the typeface, the signature details and the content. Never take the roasting or energy product, its copy or its demo palettes. Those come from the project's direction: its register, character and signature detail.
- Never import an exemplar file or paste its markup as a starting kit. Rebuild the technique in the project's stack and tokens.
- If a viewer would take your page for the exemplar with new words, you copied. Change the palette, type and signatures until the direction is what a viewer notices first.

After building, score your screenshot with the rubric in `references/craft.md`.
