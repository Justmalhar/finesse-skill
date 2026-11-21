---
name: finesse
description: Design and build frontend UI with a distinct direction and a hand-finished level of craft, inside the project's own stack (Tailwind, shadcn, React, Next.js, Vue, Svelte, Astro, plain HTML/CSS). Covers websites, landing pages, portfolios, dashboards, analytics and data visualisation, app screens, components, forms and settings. Deals a direction (palette with chart colours, type pairing, shape, signature details) so pages stop converging on the same look, shows the finish to match with worked exemplars including a dense dashboard, and ships one number set for type, colour, space, motion and states, 84 brand design systems, an opt-in GSAP, three.js and parallax showpiece tier, and a zero-dependency checker. Use when the user asks to build, design, redesign, restyle, polish, audit or review web UI; says it looks generic, templated, sparse, flat or AI-made; wants it premium or in the style of a brand (like Linear, Stripe, Vercel); or asks for a scroll-driven, GSAP or three.js showpiece. Not for backend work.
license: MIT
---

# finesse

Correct is not finished. A page that breaks no rule and looks like every other generated page has failed. Two things decide the result: a direction nobody would guess from the brief's category, and finish detail a default build lacks. Product screens are rich by default: a dashboard is dense, colourful and full of real data visualisation. Sparse minimalism is a choice a brief must ask for, never the safe default. The numbers below only keep you out of trouble.

**Precedence.** The user's brief, then the project's existing design system (tokens, components, fonts, `DESIGN.md`), then the dealt direction, then finesse defaults. A ban lifts when the brief or brand asks for the thing: the tell is the unasked-for default. Accessibility floors never lift.

## Modes

- `/finesse`, `/finesse build`: Design and build new UI.
- `/finesse audit`: Read-only review, no edits. Rank findings: floors, then tells, then craft.
- `/finesse polish`: Raise an existing UI to the craft bar. Keep its behaviour, structure and meaning.
- `/finesse like <slug>`: Build in the style of a bundled design system.
- `/finesse showpiece`: Opt in to the GSAP, three.js and parallax tier. Marketing register only.

Free text: "review" means `audit`; "clean up" or "tighten" means `polish`.

## Workflow

1. **Read the room.** Find the stack, existing tokens, fonts, components and any `DESIGN.md`. Pick the register: `marketing` (landing pages, portfolios, launches; the design is the pitch) or `product` (dashboards, app UI, settings, forms; the design serves the task, and a dashboard is dense and colourful by default).
2. **Deal a direction.** If the project has no brand or design system, never choose one from memory. Run the dealer and follow `references/direction.md`:
   ```
   node <skill dir>/scripts/direct.mjs "<the brief>" --register <register>
   ```
   Omit `--register` when the brief names a surface (dashboard, admin, analytics): the dealer infers it. `--surface dashboard,table` overrides what the dealer reads from the brief. Theme words ("dark", "night"; "light", "bright", "airy") deal palettes of that base, and the header prints what it detected. If no candidate fits the mood, deal again with the rejected ids in `--avoid`. Pick the candidate that fits, then write the direction before any code:
   ```
   Direction: P27-T29-S11-G37-G42, product
   Character: a trading desk after the close: carbon greys, one electric blue, dense tiles
   Signatures: edge-bleed sparkline tiles; a dashed benchmark line on the main chart
   ```
   The dealt direction outranks general finesse defaults where they differ: a hard-offset shape replaces the layered shadow, a committed palette puts colour on the background. Accessibility floors still win.
3. **Tokens first.** In a project with no token file, copy `assets/tokens.css` into it first. In a project limited to a few files (one HTML page, or a brief that caps the file count), inline the token file at the top of its stylesheet instead. Then run `direct.mjs --emit <id> --register <register>`. It prints two sections. Section 1 is the font `@import`: put it on the first line of the stylesheet, or load the fonts with the `<link>` tags in its comment. Section 2 replaces the theme blocks of the copied file, from `/* Light theme` up to `/* Focus:`. A dark-first palette emits dark as the default; a dark-only brief also sets `data-theme="dark"` on `<html>`. In a project with tokens, map the emitted values onto its names. Never ship the starter colours or a default sans unchanged.
4. **Read the craft file and one exemplar.** Read `references/craft.md`, then the one file `references/exemplars.md` names for what you are building, plus `assets/exemplars/base.css` once, plus every reference the routing table triggers for this task (a dashboard: `dashboards.md`, `surfaces.md`, `components.md`, `motion.md`). Read before you build, so the first draft already carries the finish.
5. **Build with real content and every state.** Copy from the brief, real product UI or real photos. When a section needs facts the brief does not supply (testimonials, customer logos, metrics), omit it and list it in the report. A control the brief names but does not specify (a search field, a filter, a nav link to a screen you are not building) either works minimally (search filters the visible rows, a link goes to a real section) or is an inert destination: it looks exactly like its live neighbours (never dimmed), carries `aria-disabled="true"` and no `href`, does nothing, and is listed under `Open` in the report. Recipe: `references/components.md`. Never leave an `href="#"`.
6. **Craft pass.** Put your screenshot beside the exemplar you read and compare finish detail by detail: depth, lines, numbers, states. Add what yours lacks until it matches that finish. Build both signatures properly; they are the identity.
7. **Motion pass.** Add motion last, then confirm the reduced-motion path.
8. **Look and score.** Screenshot at 1440 and 390 px in each theme the brief needs, and check 320 px for overflow (see Looking). Score against the rubric in `references/craft.md`. When the user names reference designs, put your screenshot beside them at every round. "No 0 and at least 5 at 2" is the floor, not the target: the target is the named reference, or the exemplar when none is named. At most 3 rounds; a round is one look and one set of fixes.
9. **Check.** Run the checker, fix, rerun, at most 3 rounds.
10. **Report.** Format below.

## Numeric core

**Type**

- **Size.** Reading text 16 px. Product secondary text 14 px. Nothing below 12 px, including text inside a scaled SVG. Inputs 16 px on touch.
- **Line height.** Body 1.5 to 1.7. Display 1.05 to 1.2, never below 1. Prose measure 60 to 75ch.
- **Scale.** Product ratio 1.125 to 1.2, marketing 1.25 to 1.333. Display fluid `clamp()`, cap 96 px.
- **Tracking.** Display -0.02em to -0.04em, never tighter. All-caps labels +0.04em to +0.08em. Body 0.
- **Families.** At most 2 families and 3 weights in total, from the dealt pairing. No 800 or 900 unless the pairing calls for it.
- **Detail.** `text-wrap: balance` on headings, `pretty` on prose, `tabular-nums` on changing or aligned numbers, real quotation marks and apostrophes.

**Colour**

- **Roles.** OKLCH. Components use only `background, surface, surface-raised, border, border-strong, text, text-muted, accent, accent-text, danger, success, warning, focus`, plus `chart-1` to `chart-6` for data series. Assign series colours by meaning: `chart-1` to the lead measure, one colour per series across every chart, order only when nothing has a meaning yet (`references/dashboards.md`). Pair every series colour with a label or a legend.
- **Contrast.** Body 4.5:1 (7:1 for long reading). Large text 3:1. UI boundaries, icons, focus rings and chart series 3:1. Placeholders 4.5:1. An accent that only reaches 3:1 is a fill, never text: links then use `text` with an accent underline.
- **Accent.** One hue. At most 10% of a screen in a restrained palette; data series do not count toward it. A committed palette carries its colour on large surfaces on purpose.
- **Dark.** Designed, not inverted: raised surfaces get lighter, hairlines and lightness replace heavy shadows. Honour `prefers-color-scheme` and a `[data-theme]` override through the same variables.

**Space and shape**

- **Scale.** 4 px grid; prefer 4, 8, 12, 16, 24, 32, 48, 64, 96, 128. Optical nudges of 1 to 3 px are fine.
- **Rhythm.** Related items 8 to 12 px, groups 24 to 32 px. Marketing sections 96 to 128 px (64 px on phone). Product page padding 24 to 32 px. Space inside a group is smaller than space between groups.
- **Container.** Max 1200 to 1280 px. Gutter 24 px, 16 px on phone.
- **Shape.** One family per product, from the dealt shape: square (0 to 4 px), tight (4 to 8 px), moderate (8 to 16 px) or pill controls. Cards never above 24 px. Radii are concentric while the gap is smaller than the outer radius.
- **Edges.** Hairlines at 8 to 12% alpha; control outlines use `border-strong` at 3:1. Shadows are layered stacks with a tight contact layer, never one wide blur behind a hairline.
- **Targets.** 44 px on touch, 32 px in dense pointer UI, never below 24 px. 8 px between targets.
- **Layers.** z-index from the named scale in `assets/tokens.css`, never 999 or 9999.

**Motion**

- **Duration.** Press and hover 100 to 160 ms. State change 180 to 250 ms. Overlays 200 to 300 ms. Layout 300 to 500 ms. Marketing entrances 500 to 800 ms. Data draw-in 600 to 800 ms, once. Exits about 70% of the enter.
- **Curve.** Ease-out `cubic-bezier(0.22, 1, 0.36, 1)`. On-screen travel `cubic-bezier(0.65, 0, 0.35, 1)`. Linear only for loops and progress. Never ease-in on entry.
- **Properties.** Only `transform`, `opacity`, `filter`, `clip-path`. Never `transition: all`.
- **Enter.** From `scale(0.95)` or more with opacity 0, never `scale(0)`. Popovers grow from their trigger.
- **Feedback.** Press `scale(0.97)`. Hover lift at most 2 px, image zoom at most 1.03, gated by `@media (hover: hover) and (pointer: fine)`.
- **Restraint.** No animation on actions repeated many times a day. One scroll-reveal style per page; content is visible without JavaScript. Observe an unclipped wrapper: an element hidden by `clip-path` never intersects and stays hidden.
- **Reduced.** Under `prefers-reduced-motion: reduce` remove translation, scale, parallax and loops. Keep fades at 200 ms or less.

**States.** Controls define default, hover, focus-visible, active, disabled, and loading and error where they can occur. Collections add empty; async actions add success. Focus ring: 2 px solid, 2 px offset (inset inside clipping containers), 3:1, no transition, never removed without a replacement. Skeletons for loading content, spinners only inside buttons. No layout shift between states.

## Top default tells

Avoid unless the brief asks. Full catalogue with fixes: `references/slop.md`. Designed richness is not a tell: tinted badges, series colours, KPI tiles and charts are the finish when they carry data.

1. The starter look, left unchosen: neutral grey-blue or navy, a blue or teal button, a default sans.
2. Violet-to-blue or violet-to-pink gradients, gradient text.
3. A coloured left-border stripe on cards, callouts or quotes.
4. The template hero: centred headline, subline, two buttons, glow blob.
5. Rows of identical cards: icon tile, heading, two lines. In a dashboard: sibling tiles with the same visual.
6. A stat strip of invented round numbers over one-word labels, or a KPI with no unit, comparison or visual.
7. A tracked uppercase eyebrow over every section, a pill chip above the hero headline.
8. Flat bordered boxes for everything, a badge on every row of a long table, cards inside cards.
9. Fade-up on every section, bounce or elastic easing.
10. Two-tone headlines where the second half is muted or accent coloured.
11. Copy tells: seamless, elevate, unlock, effortless; "X. Y." fragment headlines; "It's not just X, it's Y"; em dashes; middle-dot separators. <!-- finesse-ignore slop-copy: catalogue -->
12. Placeholder residue: lorem ipsum, `[Company Name]`, coloured boxes standing in for images, fake logos, quotes or metrics. <!-- finesse-ignore placeholder-residue: catalogue -->
13. A product screen that is one table under three numbers: no charts, one colour, one surface level.

## Routing

Read a reference only when its trigger applies. A showpiece build still reads `references/surfaces.md`, `references/craft.md` and `references/motion.md`.

| Read | When |
|---|---|
| `references/direction.md` | Step 2 of any build with no existing brand, or the user says it looks generic. |
| `references/craft.md` | Step 4 of every `build` and `polish`, and to score any screenshot. |
| `references/exemplars.md` | Step 4, to pick the one exemplar file to open. |
| `references/dashboards.md` | A dashboard, analytics view, KPI tile or chart, before laying it out. |
| `references/foundations.md` | Deriving a palette from a brand colour, adding a second theme by hand, Tailwind v4 or shadcn mapping. |
| `references/surfaces.md` | Laying out a page or screen: hero, sections, imagery, copy, app shell, tables, forms, responsive. |
| `references/components.md` | Building or reviewing an interactive component and its states. |
| `references/motion.md` | Any transition, animation, spring or gesture. |
| `references/slop.md` | `audit` and `polish`, or the user says it looks AI-made. |
| `references/showpiece.md` | `showpiece` mode, or the brief asks for GSAP, three.js, WebGL, parallax or pinned sections. |
| `references/glass.md` | Translucent, frosted or blurred materials, or "Liquid Glass". |
| `references/design-systems.md` | `like <slug>` mode, or "in the style of <brand>". |

## Looking

Judge pixels, not code. Use the browser tool you have. With none, headless Chrome works:

```
chrome --headless=new --hide-scrollbars --window-size=1440,900 --screenshot=out.png "<url>"
```

- Force the theme in the URL or markup. Headless Chrome follows the OS setting.
- Headless Chrome will not lay out narrower than about 500 px. For 390 and 320, load the page in an iframe of that width, or use a tool that emulates a device.
- A screenshot cannot scroll. Use a tall window for long pages and a query parameter to open states (sheet, loading, error).
- A tall window breaks `100svh` heroes: the hero stretches to the window. Capture the hero at 1440 by 900 and the sections below it separately.
- Content revealed on scroll stays blank in a full-page capture, because nothing scrolls. Force the revealed state for screenshots (a query parameter or a class on `<html>`).
- Any page with draw-in or entrance animation needs `--virtual-time-budget=<ms>` longer than the animation, or the capture catches it mid-animation. WebGL also needs `--enable-unsafe-swiftshader`.
- Read the image. Ask what a designer would notice first, and whether that is the signature or a flaw.
- Then look for what the rubric does not score: labels that overlap or clip, text over busy imagery, content hidden by a state bug (a reveal that never fired, a panel stuck closed), and horizontal scroll at any width.

## Checker

```
node <skill dir>/scripts/check.mjs <paths>
```

Run it on the files you touched. Node 18+, nothing to install. One line per finding: `file:line  severity  rule-id  message  (fix: ...)`. The last line is exactly `FINESSE: PASS` or `FINESSE: FAIL <n> errors, <m> warnings`; exit code 1 means errors remain. `--rules` lists every rule.

- The checker is a lint for floors and tells. A pass says nothing about craft; step 8 does.
- Fix every error. Fix every warning unless the brief asked for that thing.
- When the brief did ask, waive it on the same or previous line, reason 8+ characters: `/* finesse-ignore default-gradient: brand gradient specified in brief */`. Waive an error only for a false positive, and say so in the report.
- Stop after 3 rounds and report what is open. Never edit the checker to pass.

## Report

```
Direction: <candidate id, register>. <character sentence>. Signatures: <two>.
Changed: <files>
Rubric: Hierarchy 2, Depth 2, Detail 2, Type 2, Identity 1, States 2, Restraint 2, Responsive 2[, Data 2]; <n> at 2, none at 0
Compared: <the named reference, or the exemplar>: per criterion, where yours matches and where it falls short
Checker: FINESSE: PASS (round 2 of 3)
Waivers: <rule-id: reason>, or none
Viewed: <widths and themes>, or "not viewed: no browser tool"
Assumed: <facts or assets you assumed>
Open: <what is unresolved and why, including inert controls>
```

`Rubric:` lists every score with its label, in the rubric's row order: 8 scores, or 9 on a dashboard with Data last.

For `audit`, replace Changed with a findings table: severity, `file:line`, rule or tell, fix.
