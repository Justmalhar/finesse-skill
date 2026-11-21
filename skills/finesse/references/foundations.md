# Foundations: tokens and theming

Read this when you derive a palette from a brand colour, add a second theme by hand, or map tokens onto Tailwind v4 or shadcn. A dealt direction already emits both themes: `references/direction.md`.
If the project already has tokens, extend them. Never ship a second, parallel set.

## Colour roles

Components use roles only. Raw `oklch()` values live in the token file.

| Role | Light (hue 220) | Dark (hue 220) |
|---|---|---|
| `background` | `oklch(0.975 0.006 220)` | `oklch(0.16 0.01 220)` |
| `surface` | `oklch(0.985 0.005 220)` | `oklch(0.19 0.01 220)` |
| `surface-raised` | `oklch(0.99 0.005 220)` | `oklch(0.22 0.012 220)` |
| `border` | `oklch(0.2 0.01 220 / 0.1)` | `oklch(0.98 0.005 220 / 0.1)` |
| `border-strong` | `oklch(0.6 0.012 220)` | `oklch(0.52 0.012 220)` |
| `text` | `oklch(0.2 0.015 220)` | `oklch(0.95 0.008 220)` |
| `text-muted` | `oklch(0.48 0.015 220)` | `oklch(0.72 0.012 220)` |
| `accent` | `oklch(0.5 0.09 220)` | `oklch(0.72 0.075 220)` |
| `accent-text` | `oklch(0.99 0.005 220)` | `oklch(0.16 0.01 220)` |
| `danger` | `oklch(0.52 0.19 27)` | `oklch(0.7 0.16 27)` |
| `success` | `oklch(0.52 0.13 150)` | `oklch(0.72 0.13 150)` |
| `warning` | `oklch(0.52 0.11 70)` | `oklch(0.78 0.13 75)` |
| `focus` | `oklch(0.52 0.09 220)` | `oklch(0.75 0.075 220)` |

Measured on `background`, light then dark: `text` 16.8:1 and 16.8:1, `text-muted` 6.1:1 and 7.8:1, `accent` 5.4:1 and 8.0:1; `accent-text` on `accent` 5.7:1 and 8.0:1. `border-strong` is the one role beyond the core list, because a 10% hairline cannot give input boundaries 3:1.

These are the fallback values of `assets/tokens.css`; a new project takes its palette from `scripts/direct.mjs --emit` (see `references/direction.md`).

## A palette from one brand hue

1. Convert the brand colour to OKLCH and take its hue `H`. With no brand colour, deal a palette with `scripts/direct.mjs` instead of picking a hue.
2. Neutrals: hue `H`, chroma 0.005 to 0.015 for a restrained palette, 0.02 to 0.06 for a tinted one. A committed palette puts the brand colour itself on the ground.
   - Light: ink at lightness 0.15 to 0.25, paper at 0.92 to 0.98. A committed light ground sits at 0.75 to 0.92.
   - Dark: background 0.145 to 0.2 for product and most restrained palettes, up to 0.25 for a softer charcoal. A committed dark ground sits at 0.25 to 0.3.
   - Each raised surface is 0.03 to 0.035 lighter than the one below. A dashboard needs all three grounds (page, tile, popover) visibly stepped.
   - `text-muted` sits at least 0.12 lightness away from `text`, or muted and primary text read as one level.
3. Accent: hue `H`, lightness 0.45 to 0.55 in light so it passes 4.5:1 as text. Chroma as high as sRGB allows at that hue and lightness; beyond it the browser clips. Hue 220 tops out near 0.09 at lightness 0.5, hue 27 near 0.21. An accent used only as a fill needs 3:1 on every surface; links then use `text` with an accent underline.
4. Dark accent: lightness 0.7 to 0.78, chroma 10 to 20% below light, dark `accent-text`.
5. Status hues stay fixed (danger 27, success 150, warning 70). Within 30 degrees of `H`, pair status colour with an icon and label.
6. Compute every text pair numerically. Do not judge contrast by eye.

A restrained palette is neutrals plus one accent on 10% of a screen or less. A brief that wants a committed brand colour (30 to 60% of surface) gets it.

Data series are separate from the one-accent rule. `--chart-1` to `--chart-6` take their own hues, `--chart-1` near the accent, so a dashboard carries six series colours and still has one accent for actions. Rules for series colours: `references/dashboards.md`.

## Type scale

Pick one ratio per register: product 1.125 to 1.2, marketing 1.25 to 1.333. At most 6 sizes on a screen. Product: a fixed 1.2 ladder, 12, 14, 16, 19.2, 23, 27.6 px. Marketing: 12, 14, 16 to 18 px body, then fluid h2 28 to 44 px, h1 36 to 64 px, display 40 to 96 px.

Fluid sizes interpolate between two viewport widths. For a display that runs 40 px at 390 px wide to 96 px at 1600 px wide:

```css
/* slope = (96 - 40) / (1600 - 390) = 4.6vw; intercept = 40 - 0.046 * 390 = 22px */
--fs-display: clamp(2.5rem, 1.375rem + 4.6vw, 6rem);
```

Keep the `rem` term in the middle value so browser zoom still scales the text.

## Space, radius, elevation, layers

| Token family | Values |
|---|---|
| Space | 4 px grid, named steps preferred (4, 8, 12, 16, 24, 32, 48, 64, 96, 128 px), optical nudges of 1 to 3 px allowed |
| Radius | one family from the dealt shape: square (0 to 4 px), tight (4 to 8 px), moderate (8 to 16 px) or pill controls; cards never above 24 px |
| Elevation 1 | cards that need lift: 1 px contact ring plus `0 1px 2px` |
| Elevation 2 | menus, popovers: contact ring, `0 1px 2px`, `0 4px 12px` |
| Elevation 3 | dialogs, sheets: contact ring, `0 2px 4px`, `0 8px 16px`, `0 24px 48px` |
| z-index | base 0, dropdown 1000, sticky 1100, overlay 1200, modal 1300, toast 1400, tooltip 1500 |

Radii are concentric while the gap is smaller than the outer radius: inner radius = outer radius minus the gap. Beyond that the inner element keeps its control radius.

Shadows are layered stacks with a tight contact layer, never one wide blur behind a hairline. In dark mode, express elevation by lightness: a menu on `surface` uses `surface-raised` plus a `border`, and its shadow carries little.

## Theming

One set of variable names, values swapped per theme. `assets/tokens.css` shows the pattern: light on `:root, [data-theme="light"]`, dark under `@media (prefers-color-scheme: dark)` on `:root:not([data-theme="light"])`, and again on `[data-theme="dark"]`, so the explicit choice wins both ways.

- A dark-first palette swaps the roles: `direct.mjs --emit` puts dark on `:root, [data-theme="dark"]` and light under `@media (prefers-color-scheme: light)` and `[data-theme="light"]`. A brief that is dark only sets `data-theme="dark"` on `<html>`.
- Set `data-theme` on `<html>` from a stored choice in a blocking inline script in `<head>`, before first paint, or the page flashes the wrong theme.
- `color-scheme` makes scrollbars, form controls and `canvas` defaults follow the theme, and it drives `light-dark()`: `light-dark(<light value>, <dark value>)` picks by the `color-scheme` of the element, so one declaration serves both themes. It needs `color-scheme` set per theme, as `assets/tokens.css` does.
- Add `<meta name="theme-color">` twice, with `media="(prefers-color-scheme: light)"` and `dark`, set to each theme's `background`, so the mobile browser bar matches the page.
- Give images dark variants through `<picture>` with a `prefers-color-scheme` source. Never invert photos.

## Tailwind v4

Import the plain tokens, then expose them as utilities with `@theme inline`, so utilities read the live variables and theme swaps need no `dark:` prefix:

```css
@import "tailwindcss";
@import "./tokens.css";

@theme inline {
  --color-background: var(--background);
  --color-surface: var(--surface);
  --color-fg: var(--text);
  --radius-card: var(--r-card);
  /* full mapping: closing comment of assets/tokens.css */
}
@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));
```

- Never give a plain token the same name as its `@theme` key (`--radius-card: var(--radius-card)` is a cycle). `assets/tokens.css` uses `--r-*`, `--fs-*`, `--curve-*` for this reason.
- Tailwind's default `--spacing: 0.25rem` already is the 4 px grid. Stay on whole steps; `p-[13px]` is off-scale.
- In a new project, start the `@theme` block with `--color-*: initial;` to drop Tailwind's default palette, so `bg-blue-500` stops compiling and only the roles exist. In a project that already uses the default colours, keep them.

## shadcn

shadcn already defines semantic variables. Put finesse values into its names; do not add a second set beside them.

| finesse role | shadcn variable |
|---|---|
| `background` | `--background` |
| `text` | `--foreground` |
| `surface` | `--card`, `--muted` |
| `surface-raised` | `--popover` |
| `text-muted` | `--muted-foreground` |
| `accent` | `--primary` |
| `accent-text` | `--primary-foreground` |
| `border` | `--border` |
| `border-strong` | `--input` |
| `focus` | `--ring` |
| `danger` | `--destructive` |

- shadcn's `--accent` is the subtle hover background for menu items, not the brand colour. Give it a value close to `surface`; the brand goes in `--primary`.
- Set `--radius` from the shape family. shadcn derives its steps from it: at 0.625rem (10 px) buttons and inputs get 8 px (`rounded-md`), cards 14 px (`rounded-xl`).
- shadcn toggles dark mode with a `.dark` class. Keep the project's selector. If you add `[data-theme]`, match both: `.dark, [data-theme="dark"]`.
