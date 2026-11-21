# Dashboards and data screens

Read this when you build a dashboard, an analytics view or any screen whose job is to show numbers.
Worked example: `assets/exemplars/dashboard.html`. Tables and controls: `references/components.md`.
Sparse is the failure here. Fill the first screen with figures, and give each one a comparison and a visual.

## Composition

- **Shell.** Sidebar 240 to 256 px, top bar 56 px, page padding 24 px, 12 columns, 16 px gutters.
- **Density.** Above the fold at 1440 by 900: 40 or more numbers, 6 or more visuals, 3 or more series hues, and the top of the next row. Tile padding 16 px, radius 12 px. Text 14 px, labels and axes 12 px.
- **Rows.** Tiles in a row share one height. Spans come from the archetype below.
- **Tile surface.** One step above the page: `box-shadow: 0 0 0 1px var(--border), inset 0 1px 0 var(--top-edge)`. No blur. This ring is the default. When the dealt shape says otherwise (borderless stepped panels, hard offset, ledger hairlines), the shape wins: take the tile edge from its `--border-width`, `--elevation-1` and the palette's stepped grounds, and drop the ring.
- **Narrow.** At 1024 the sidebar is a 64 px icon rail. At 390 it is a tab bar, small tiles sit 2 by 2 and every archetype stacks in reading order: lead question first.

### Pick an archetype from the lead question

Before layout, write the product's lead question in one sentence, the question a user opens the screen to answer ("Am I getting paid, and who is late?"). Pick the archetype whose first screen answers it, and name it in the direction block. The dashboard exemplar uses **Ribbon and rail**. Pick that one only when it clearly answers the lead question better than the others, and say why.

**Ribbon and rail.** A row of KPI tiles over a main chart, with a rail of composition and alerts beside it.

```
| KPI 3    | KPI 3    | KPI 3    | KPI 3    |
| main chart 8                   | rail 4   |
| main chart 8                   | rail 4   |
| table or entity grid 8         | feed 4   |
```

Choose it when four peer measures matter equally and one time series explains them. Above the fold: the four tiles, the main chart, the top rail tile.

**Lead tile.** One tile answers the question; small tiles beside it are its drivers.

```
| lead 6: figure, delta, chart   | small 3  | small 3  |
| (spans two rows)               | small 3  | small 3  |
| composition 4  | list or table 8                    |
```

Choose it when one number is the answer (income this month, cash on hand, uptime) and the rest explain it. Above the fold: the lead figure at display size with its chart, the 2 by 2 of drivers, the top of the next row.

**Band.** A full-width chart band, with tiles overlapping its lower edge.

```
| chart band 12, 280 to 360 px, plot bleeds to the tile edges |
|    | KPI 3  | KPI 3  | KPI 3  | KPI 3  |    <- margin-top: -48px
| table 8                        | feed 4   |
```

Choose it when the trend over time is the story (cash flow, traffic, generation). Above the fold: the band with its axis and legend, the overlapping tiles, the top of the table. Give the tiles `position: relative` and a z-index above the band, and keep the band's last 48 px free of labels.

**Narrative split.** A column that says what changed beside a stack of evidence tiles.

```
| narrative 5: headline sentence,  | tile 7: chart       |
| 3 to 5 ranked findings, each     | tile 7: breakdown   |
| linked to its tile               | tile 7: table       |
```

Choose it for a review screen (weekly report, month close, an AI summary) where the user asks "what happened and why". Above the fold: the headline sentence with its figure, the first findings, the first two evidence tiles.

**Master and detail.** A list of entities beside the selected one.

```
| list 4: rows with name, status, | detail 8: header figures       |
| spark and figure; one selected  | main chart                     |
|                                 | table of the entity's records  |
```

Choose it when the question is about one entity among many (which client, which site, which invoice). Above the fold: 8 or more list rows and the full detail header with its chart. The selection is in the URL so a reload keeps it.

## KPI tile

Top row: a 16 px icon, a 14 px muted label, a delta chip. Then the figure at 28 px in `--fw-semibold` (600) with a 16 px muted unit, one visual 44 px tall, and a 12 px caption that states the scale.

- Every figure has a unit, a comparison and a visual.
- Sibling tiles use different visual types: a line, a segmented meter, bars, a status strip.
- Delta chip: the arrow gives direction, the colour says good or bad. Down can be good. Add the words for screen readers.

## Series colours

Define `--chart-1` to `--chart-6` beside the roles, once per theme. The dealt palette already passes the validator: neighbours 50 degrees apart, 3:1 on tiles, apart under protanopia and deuteranopia, clear of the status colours. These rules decide which series gets which colour.

Assign by meaning, in this order:

1. **One colour per series on the screen.** A series that appears in several charts keeps its colour in every one: a client is the same hue in the donut, the stacked bar and its row swatch.
2. **`--chart-1` goes to the lead measure**, the figure the screen exists to show. It sits on the accent hue.
3. **Comparisons** (last period, forecast, target, budget) take `--chart-2` dashed, or `--text-muted` when the comparison is a reference line.
4. **Order is the fallback.** Only when nothing has a meaning yet, assign `--chart-1` upward in the order series first appear.

Then the limits:

- **Overlaid series in one plot** (lines, stacked or grouped bars, areas): at most 4 hues. Past 4, split into small multiples or add a filter.
- **Part to whole** (donut, composition bar, treemap): the 4-hue limit does not apply. Up to six parts, each in its meaning colour or `--chart-1` to `--chart-6` by size. With more than six parts, show the five largest and group the tail into one "Other" in `--border-strong`, listed last.
- **Status is not a series.** `--danger`, `--warning` and `--success` mean bad, at risk and good, never a category. Up and down use them with an arrow.
- **Never colour alone.** Dash the comparison line, vary the legend marker shape, shorten a bad bar, label the arc.

Lightness ranges, for a palette you derive by hand: dark themes L 0.67 to 0.86, C 0.09 to 0.18; light themes L 0.47 to 0.63, C 0.09 to 0.20. Every series reaches 3:1 on the tile, and no series sits within 20 degrees of hue of a status colour unless its lightness differs by 0.15 or more. Check with `node <skill dir>/scripts/validate-directions.mjs`.

## Chart recipes

Draw marks in SVG with `preserveAspectRatio="none"`. Write labels in HTML so text never scales.

**Area with a comparison line.** x is the sample index, y is `100 - value / max * 100`.

```html
<svg viewBox="0 0 167 100" preserveAspectRatio="none" aria-hidden="true">
  <linearGradient id="f" x2="0" y2="1"><stop offset="0" stop-opacity=".5"/><stop offset="1" stop-opacity="0"/></linearGradient>
  <path class="area" d="... L167 100 L0 100Z"/><path class="cmp" d="..."/><path class="line" d="..."/>
</svg>
```

```css
path { vector-effect: non-scaling-stroke; fill: none; }
#f stop { stop-color: var(--chart-1); }
.area { fill: url(#f); }
.line { stroke: var(--chart-1); stroke-width: 2.5; stroke-linejoin: round; }
.cmp { stroke: var(--chart-2); stroke-width: 1.5; stroke-dasharray: 5 4; }
```

Smooth with Catmull-Rom control points: `p1 + (p2 - p0) / 6` and `p2 - (p3 - p1) / 6`.

**Dotted grid.** A background on the plot. Four intervals make each row 25%, so the dots sit on the tick values.

```css
.plot { padding-block: 2px; background: radial-gradient(circle, var(--grid-dot) .75px, transparent 1.25px) 4px -16.667% / 8px 25% content-box; }
```

`--grid-dot` is `--text` at 26%, `--track` at 10%. For rules use `linear-gradient(var(--border) 1px, transparent 1px) 0 0 / 100% 25%`.

**Axes.** 12 px, muted, `tabular-nums`. 4 or 5 ticks on round values. Areas and bars start at zero. State the unit once, in the subtitle.

**Tooltip and crosshair.** One index drives a 1 px line, an 8 px dot per series with a 2 px surface ring, and the readout.

```css
.cross { position: absolute; inset-block: 0; left: var(--x); width: 1px; background: var(--border-strong); }
.tip { position: absolute; left: min(var(--x) + 12px, 100% - 208px); width: 208px; background: var(--surface-raised); box-shadow: var(--lift-3); }
```

Keep the tooltip a raised surface so swatches keep their contrast. List each series with its marker, value and unit. Make the plot `tabindex="0" role="slider"`, move the index with the arrow keys, and write the readout to `aria-valuetext`. Add a visually hidden table of totals.

**Donut with a centre label.** One circle per slice. `pathLength="100"` turns shares into dash lengths.

```html
<svg viewBox="0 0 144 144" style="rotate: -90deg">
  <circle r="63" cx="72" cy="72" pathLength="100" fill="none" stroke-width="18"
    style="stroke: var(--chart-2); stroke-dasharray: 61.6 38.4; stroke-dashoffset: -0.7"/>
</svg>
```

Dash length is the share minus a 1.4 gap. Offset is the negative running total. Put the total and its unit in the centre and each share outside its arc. Draw the arcs from the legend table, so the table is the text alternative.

**Spark line and spark bars.** The area recipe at 44 px tall with no axis, ending in an 8 px dot on the latest value. Bars: `<i>` elements in a grid, 3 px gap, `height: calc(var(--v) * 100%)`. Diverging bars use two rows around a 1 px midline.

**Segmented and striped progress.** One element each.

```css
.segbar { height: 20px; background: linear-gradient(to right, var(--c) var(--p), var(--track) 0);
  mask: linear-gradient(to right, #000 calc(100% - 3px), transparent 0) 0 0 / calc(100% / var(--n)) 100%; }
.stripe i { width: var(--p); background: repeating-linear-gradient(-45deg, var(--c) 0 4px, color-mix(in oklab, var(--c) 62%, var(--surface)) 4px 8px); }
```

**Meter.** A 4 px track with a fill at `width: var(--p)`, `role="meter"`, the three `aria-value` attributes and a label. Mark a target with a 1 px tick and its value.

## Status

- **Tinted badge.** Use it on cards, headers and chips, one per entity. Height 24 px, 12 px medium text, a 12 px glyph whose shape differs per state. Fill: the role at 14%. Ring: the role at 30%. Ink: `color-mix(in oklab, var(--role) 76%, var(--text))`, checked at 4.5:1 on the tint.
- **Glyph plus words.** Use it in tables past 8 rows, where a column of badges turns into stripes.

## Shell

- Sidebar groups of 3 to 5 links under a 12 px label, counts at the row end. The active link changes fill, ink and icon colour, never weight.
- A search field with a `kbd` hint that works: set `aria-keyshortcuts` and bind the key.
- One range control, one primary action, a user chip (avatar, name, role).
- A contextual card shows usage against a limit, the date it runs out and one action.

## Numbers

- `font-variant-numeric: tabular-nums lining-nums` on every figure, axis and table cell.
- Figures in `--fw-semibold`, tracking -0.02em. Units in small caps, muted.
- Tiles show 3 or 4 significant figures. Tables and tooltips show full precision.
- Siblings share a unit. A percentage change says against what.

### Money in tables

- Right-align the column, header included. Every row shows the same number of decimals, so the decimal points line up.
- Put the currency once, in the header ("Amount, USD") or as a muted symbol in its own span before the figure. Mixed currencies get their code after the figure in muted 12 px.
- Negative amounts take a minus sign (U+2212) or parentheses, never colour alone.
- Check the face. With `tabular-nums` some faces also swap the comma and period for figure-wide glyphs, which sets `$2,200.00` as "$2,200 . 00". Every pairing the dealer places on a dashboard or table is measured clean by `node <skill dir>/scripts/tabular-punctuation.mjs`. A project's own face: render `$12,345.67` in a cell and look before you build the table.
- When a face's tabular punctuation is wide, keep tabular digits and set the separators proportional: wrap each comma and period in `<span class="sep">` with `.sep { font-variant-numeric: normal; }`, or set the money column in the pairing's mono face, whose punctuation is one figure wide by design.

## Motion

- Draw the main series in once: `clip-path: inset(0 100% 0 0)` to `inset(0)`, 600 to 800 ms, ease-out. Bars grow with `scaleY` from the baseline.
- Count-up: 600 ms at most, first load only, never on refresh or polling. Skip it by default.
- Tooltip: no delay, no easing on position, 100 ms fade out.

## Empty, loading, error

- **Loading.** Keep the content in place with `visibility: hidden` and overlay bars shaped like it. A chart skeleton keeps its grid.
- **Empty.** A ghost of the chart, one sentence that says what will appear and when, one primary action for the screen. Tiles say "No readings yet", never zero.
- **Error.** One tile fails alone: what failed, a retry button, the last good value with its time. Never blank the dashboard.

## What reads as generated

| Tell | Fix |
|---|---|
| Four identical tiles: label, number, green arrow | A different visual in each, with a caption that states its scale |
| Every dashboard on the exemplar's layout | An archetype picked from the lead question |
| One accent and grey charts | Six series colours, assigned by meaning, the lead measure in `--chart-1` |
| A chart with no axis, values or unit | Ticks on round values, a legend with totals, a readout |
| Fake precision or round invented numbers | Figures that add up: slices sum to the centre, tiles agree with the chart |
| Colour as the only key | Dash, shape, length or a label as well |
| Every status a coloured pill | Tint the exceptions, outline the facts |
