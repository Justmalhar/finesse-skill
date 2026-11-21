# Craft: the finishing pass

Read this at workflow step 4 of every `build` and `polish`, before you build, and again to score a screenshot.
Each technique: when to use it, the recipe, the mistake that ruins it. Then score a screenshot against the rubric.
Worked pieces at this level: `references/exemplars.md`.

## One light

Light comes from above the page. Raised things get a highlight on the top edge and a shadow below. Sunken things get the reverse. Declare the light once, beside the tokens:

```css
:root, [data-theme] {
  --cast-xs: light-dark(color-mix(in oklab, var(--text) 5%, transparent), oklch(0 0 0 / 0.28));
  --cast-sm: light-dark(color-mix(in oklab, var(--text) 8%, transparent), oklch(0 0 0 / 0.4));
  --cast-md: light-dark(color-mix(in oklab, var(--text) 14%, transparent), oklch(0 0 0 / 0.55));
  --top-edge: light-dark(oklch(1 0 0 / 0.9), oklch(1 0 0 / 0.09));
  --lift-1: 0 0 0 1px var(--border), 0 1px 1px -0.5px var(--cast-sm), 0 2px 3px -1px var(--cast-xs), inset 0 1px 0 var(--top-edge);
  --lift-2: 0 0 0 1px var(--border), 0 1px 1px -0.5px var(--cast-xs), 0 3px 3px -1.5px var(--cast-xs),
    0 6px 6px -3px var(--cast-xs), 0 12px 12px -6px var(--cast-xs), inset 0 1px 0 var(--top-edge);
  --lift-3: 0 0 0 1px var(--border), 0 2px 4px -1px var(--cast-xs), 0 8px 12px -4px var(--cast-sm),
    0 24px 48px -12px var(--cast-md), inset 0 1px 0 var(--top-edge);
}
```

`light-dark()` follows the `color-scheme` that `assets/tokens.css` sets per theme. Mix in `oklab`: mixing with black or white in `oklch` shifts the hue.

## Depth

**Layered shadow.** Use on raised controls (`--lift-1`), cards, menus and toasts (`--lift-2`), dialogs and chart tooltips (`--lift-3`). A 1 px ring, then layers whose offset and blur double while a negative spread of half the blur pulls each one in. Light theme: ink-tinted, 5 to 8% per layer. Dark theme: shadows barely read, so the ring and the top highlight draw the edge and the surface steps 0.03 lighter. Ruins it: one wide blur with no tight layer under it, or a neutral grey shadow on a tinted page.

**Raised control.** Use on filled buttons, switch thumbs and selected segments.

```css
.button-primary {
  background: var(--accent) linear-gradient(to bottom, oklch(1 0 0 / 0.14), transparent 55%, oklch(0 0 0 / 0.08));
  box-shadow: 0 0 0 1px color-mix(in oklab, var(--accent) 82%, oklch(0 0 0)),
    0 1px 2px var(--cast-md), inset 0 1px 0 oklch(1 0 0 / 0.24);
}
```

Ruins it: a gradient strong enough to read as a gradient, or a highlight on all four sides.

**Well.** Use for inputs, tracks, readouts and code: things that sit below the surface.

```css
.well {
  background: color-mix(in oklab, var(--text) 5%, var(--background));
  box-shadow: inset 0 1px 2px var(--cast-sm), inset 0 0 0 1px var(--border), 0 1px 0 var(--top-edge);
}
```

Ruins it: a well inside a well, or a well and a raised card with the same fill.

**Surface tint.** Use to separate regions without a box: a footer strip or hover row at `color-mix(in oklab, var(--text) 6%, transparent)`, a selected row at accent 12%, one corner `radial-gradient` of accent at 12% behind a hero. Check a corner glow against the ground it sits on: the two hues mix, so a red glow over a blue ground reads mauve. Ruins it: a tint strong enough that you can name its colour, or more than one decorative gradient per view. Chart fills are data and do not count.

## Lines

- **On a surface:** `var(--border)`, ink at 10% alpha, never a solid grey. It stays correct on any fill.
- **On a raised element:** draw it as the ring inside `box-shadow`. It adds no size and follows the radius.
- **Inside an image:** `::after { inset: 0; border-radius: inherit; box-shadow: inset 0 0 0 1px var(--border); }`. A border outside the image doubles its edge.
- **Fading separator:** `linear-gradient(to right, transparent, var(--border) 16%, var(--border) 84%, transparent)` at 1 px tall.

| Weight | Use |
|---|---|
| 1 px | Boundaries and control outlines. It is 2 or 3 device pixels on phones. |
| 0.5 px | Decorative separators in dense UI, only under `@media (min-resolution: 2dppx)`. Never a 3:1 boundary. |
| 1.5 to 2.5 px | SVG chart strokes: 2 to 2.5 px for the lead series, 1.5 px for comparisons. `vector-effect: non-scaling-stroke` keeps the width at any size. |


## Alignment

- **Icon and label:** `display: inline-flex; align-items: center; gap: 8px`. A 16 px icon beside 14 px text. Never baseline-align an SVG.
- **Padding compensation:** the icon side of a button gets 4 px less than the text side (12 and 16). Icon-only buttons are square.
- **Asymmetric glyphs:** arrows, chevrons and play triangles move 1 px toward their point. Nudge 1 to 3 px by eye.
- **First line:** a checkbox beside wrapped text takes `margin-top: (line height - box) / 2`.
- **Concentric radii:** inner radius = outer radius minus the gap, while the gap is smaller than the outer radius. Track 10, padding 4, thumb 6. Card 16, frame 4, image 12. With a gap of 12 px or more the inner element keeps the control radius.

Ruins it: equal radii nested 4 px apart. The corner gap pinches.

## Type detail

| Detail | Recipe |
|---|---|
| Aligned or changing numbers | `font-variant-numeric: tabular-nums lining-nums` |
| Units | `font-variant-caps: all-small-caps; letter-spacing: 0.02em`, muted. In a table the unit goes in the header, once. |
| Decimals | Wrap the fraction in `small` at the same size, muted. The integer stays ink. |
| Currency and period | Symbol and "per month" at a third of the figure size, muted. |
| Quotes | Use “ ” and ’, never straight marks. Hang the opening mark: `text-indent: -0.42em`. |
| Headings | `text-wrap: balance`. One accent word at most. |
| Selected state | Changes colour, never weight. |

Ruins it: small caps faked by shrinking text below 12 px, or a muted integer beside a bold unit.

## Numbers and status

- **The figure is the design.** Display size, 12 px label above, a delta below made of an arrow glyph plus words. In a dashboard tile the figure also gets a unit and a small visual (`references/dashboards.md`).
- **Value against target:** a 40 px bar that grows left or right from a centre tick with `transform: scaleX()`.
- **Status in a dense table:** a glyph that encodes the state, then plain words. A ring for time left, ticks for days done, a check, a warning triangle. Colour goes on the glyph; text stays ink unless it passes 4.5:1.
- **Status on a card or header:** a tinted badge with a glyph, one per entity. Recipe in `references/dashboards.md`.

Ruins it: colour as the only signal, or a badge on every row of a long table.

## Icons

One set, one stroke weight (1.5 px at 16 px), round caps. Two sizes: 16 and 20. Keep the stroke when scaling. `aria-hidden` beside a label. Draw a custom mark for the brand, and for a status glyph that carries data. A tinted icon tile is allowed when its colour encodes a category or a series; never as decoration.

## Texture

- **Grain:** SVG `feTurbulence` at `baseFrequency="0.9"`, `mix-blend-mode: soft-light`, over images and large flat colour only.
- **Dotted ground:** `radial-gradient(circle at 1px 1px, <ink 16%> 1px, transparent 0) 0 0 / 16px 16px`. It marks a canvas or an empty area.
- **Rules:** column lines behind an editorial layout.

Where it stops: fade it out with `mask-image` before it reaches an edge. Never behind body text. One texture per view.

## Images

Fix the `aspect-ratio` and use `object-fit: cover`. Frame with 4 px and a concentric radius. For duotone, map lights and darks to two roles so it follows the theme. Put captions on a blurred chip, never on the raw image. With no photograph, show a real product fragment cropped by its container, never a grey box.

## Hover, press, focus

- **Hover:** background shifts 6%. Cards may lift 2 px while `--lift-1` becomes `--lift-2`.
- **Press:** the control sinks. `scale(0.97)`, the drop shadow is replaced by `inset 0 1px 2px var(--cast-sm)`, the fill darkens 8%. A switch thumb stretches `scaleX(1.18)` toward its destination.
- **Focus:** 2 px solid `--focus`, shaped to the element. Offset 2 px on standalone controls. On the frame for composite fields: `.field:has(:focus-visible)`. Inset with `outline-offset: -2px` inside clipping containers: segments, menu items, tabs, table rows.

Ruins it: hover that grows the element, or a ring clipped by `overflow: hidden`.

## The last 10 percent

- [ ] Widths hold across loading, success and error. Stack the faces in one grid cell.
- [ ] Help and error text share one reserved line.
- [ ] `::selection` uses the accent at 28%.
- [ ] Sticky headers are translucent and gain a shadow only after scroll.
- [ ] Separators start where the text starts, and disappear beside a hovered row.
- [ ] Tooltips and floating bars invert the page colours, so they need no border. Chart tooltips stay a raised surface, so series swatches keep their contrast.
- [ ] Empty states show a ghost of the real content and one primary action.
- [ ] Skeleton bars match the shape of the row they replace.
- [ ] Dark theme checked on its own: thumbs, rings and highlights still visible.

## Rubric

Screenshot the result at 1440 and 390 px in each theme the brief needs. Score each row 0, 1 or 2. The ninth row applies to dashboards and analytics views only.

| Criterion | 0 | 2 |
|---|---|---|
| Hierarchy at a squint | Everything has the same weight | Three clear levels survive a blur |
| Depth | Flat boxes, or one soft glow | One light: raised, level and sunken all read |
| Detail density | Default controls | Five or more details a default build lacks |
| Typographic care | Straight quotes, ragged numbers | Tabular figures, quiet units, balanced headings |
| Identity | Could be any product | A signature detail from the direction, used with intent |
| State completeness | Default state only | Every state drawn, no layout shift |
| Restraint | Decoration without a job | Every effect earns its place; accent under 10%, data colour aside |
| Responsiveness | Breaks or scrolls sideways | Recomposed for 390, not shrunk |
| Data richness (dashboards only) | Bare numbers, identical tiles, grey charts | Each figure has a unit, comparison and visual; sibling tiles differ; 3 or more series hues; axes on every chart |

A dealt shape with hairlines and no shadow (flat, ledger, tile grid) still earns Depth 2: wells for inputs and readouts, rules that group, and surface steps between page, tile and popover do the work that lift does elsewhere.

Iterate until no criterion scores 0 and at least 5 score 2. That is the floor, not the target: aim at the reference the user named, or the exemplar when none is named. When the user names reference designs, put your screenshot beside them at every round and score both; the report's `Compared:` line says, criterion by criterion, where yours matches and where it falls short. A round is one look at fresh screenshots and one set of fixes. Stop after 3 rounds and report the scores with their labels, in row order.
