# Direction: deal, pick, emit

Read this at workflow step 2 when the project has no brand or design system, or the user says the result looks generic. It replaces choosing a palette and fonts from memory.

## Why this step exists

Asked to "choose a direction", a model picks the same one every time: a grey-blue palette, a default sans, a blue button. The dealer draws from 36 palettes, 36 type pairings, 12 shapes and 52 signature details, with real randomness, so two projects start from different places.

## Skip the dealer when

- The project has tokens, a component theme, a `DESIGN.md` or a brand guide with colour and type. Use it.
- The mode is `like <slug>`. The bundled system is the direction.
- The user named the palette and fonts in the brief.

A brand colour alone is not a system. Deal, then adapt the palette (below).

## Procedure

1. Decide the register: `marketing` or `product`. Pass the brief in the user's own words:
   ```
   node <skill dir>/scripts/direct.mjs "<brief>" --register product
   ```
   It prints the register, the surfaces it read (`dashboard`, `app`, `table`, `settings`, `landing`, `pricing`, `article`, `docs`), the tags and the theme, ignoring negated phrases such as "no photos". Theme words ("dark", "night"; "light", "bright", "airy") deal only palettes of that base; naming both leaves the base open. Without `--register` it infers one from the surfaces or stops. `--surface dashboard,table` overrides the reading.
2. Entries list the registers and surfaces they suit, so a dashboard gets dashboard palettes (unless a brief tag calls for another), type with tabular figures and narrow tabular punctuation, and dashboard signatures, never a Didone or a book serif. A signature that shows a fact the brief must supply carries `requires` (G40 needs a plan limit) and is dealt only when the brief names it. Clashing entries never share a candidate. `.finesse/history.json` keeps the last 3 runs' palettes and pairings out; `--seed <n>` reproduces a hand.
3. Pick the candidate that fits the audience, material and density. `--explain <id>` says why each axis was dealt.
4. Swap at most one axis, with a stated reason, browsing with `--list palettes|type|shape|signature`. Replacing one signature with another on the same surface is not that swap: it is a new hand, so deal again.
5. If none fits, deal again with `--avoid`, at most 3 times. It takes palette, type, shape and signature ids (`--avoid P07,T12,S03,G40`). When the user has rejected a look, pass the ids of what they rejected (the palette, the pairing, the shape, a signature) on every later deal. Never fall back to the starter tokens.
6. Emit the tokens:
   ```
   node <skill dir>/scripts/direct.mjs --emit P31-T36-S11-G43-G51 --register product [--format tailwind]
   ```
   Section 1, the font `@import`, goes on the first line of the stylesheet, or load the fonts with the `<link>` tags in the comment. Section 2 replaces the theme blocks of `assets/tokens.css` (copy that file into a new project first): type scale, shape, elevation, every colour role and `--chart-1` to `--chart-6`, for the default theme and both selectors of the other one. A dark-first palette puts dark on `:root` and light under `prefers-color-scheme: light`; a dark-only brief also sets `data-theme="dark"` on `<html>`.
7. Write the direction block before any component code. A worked example, for a route-setting tracker at a climbing gym:
   ```
   Register: product, surfaces dashboard and table
   Direction: P31-T36-S11-G43-G51 (swapped T33 for T36: Figtree reads calmer for front-desk staff)
   Character: a green-black wall map with acid lime holds, dense and quick to scan
   Signatures: G43 a thirty-day heat strip per wall; G51 attention chips for routes due to be stripped
   ```
8. Build both signatures for real, on their surfaces. One that needs a quote, a number or photos you lack is swapped, not faked.

## The dealt direction outranks finesse defaults

Where the direction and a general finesse default differ, the direction wins: a hard-offset shape replaces the layered-shadow recipe, a hairline ledger replaces cards, a committed palette puts colour on the background. Accessibility floors still win over both: contrast, focus rings, target sizes and reduced motion.

## Dashboards and app screens

Read `references/dashboards.md`. A palette placed on dashboards steps its three grounds at least 0.02 in lightness in both themes, so a borderless stepped-fill shape still separates page, tile and popover. Assign series colours by meaning: `--chart-1` (the accent's relative) to the lead measure, one colour per series across charts; the validator holds neighbours apart under protanopia and deuteranopia, at 3:1 on surfaces, and clear of the status colours. Pair every colour with a label, a legend or a pattern, and put figures in tabular numerals.

## Using the emitted tokens

- `Accent as text: no`: the accent is a fill, focus ring or mark; links use `--text` with an accent underline.
- In a `committed` palette cards step lighter on the same hue; never flip them to white.
- `--border-width` applies to cards and panels. Controls keep a 1 px `--border-strong` edge.
- Headings use `--family-display`, `--fw-display` and `--ls-display`. Load only the weights listed.
- `--fw-semibold` is the real weight the pairing loads (600 for every dashboard pairing); dashboard figures use it.

## Adapting a palette to a brand colour

1. Convert the brand colour to OKLCH. Deal as usual, or pick from `--list palettes` a palette whose accent hue sits within 30 degrees of the brand hue.
2. Put the brand colour in `accent`. As a fill it needs 3:1 against `background`, `surface` and `surface-raised`; as link text, 4.5:1. If it fails, keep hue and chroma and move lightness only.
3. Recompute `accent-text`: the near-white or near-black of the brand hue that reaches 4.5:1 on the accent. Move `--chart-1` to the new accent hue.
4. Re-tint `restrained` neutrals toward the brand hue at chroma 0.005 to 0.015. Dark accent: lightness 0.7 to 0.8, chroma 10 to 20% lower.
5. When the brand hue is within 30 degrees of danger (27) or success (150), keep the status hues and pair each status with an icon and a label.
6. Check every changed pair numerically, never by eye:
   ```
   node -e 'import("<skill dir>/scripts/validate-directions.mjs").then(m => console.log(m.contrast(m.parseOklch("oklch(0.55 0.2 30)"), m.parseOklch("oklch(0.97 0.01 30)")).toFixed(2)))'
   ```

## The test for a direction

Remove the logo and name. Could someone tell this page from another finesse page? If not, a signature is missing or the palette and type drifted to defaults. Fix the direction, not the copy. Put the candidate id and any swap in the report's `Direction:` line.
