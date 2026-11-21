# Glass

Read this when a design calls for translucent, blurred surfaces ("glass", "frosted", "Liquid Glass" on the web).
It says where glass earns its place, gives a recipe with numbers, and lists the fallbacks and performance limits.
Token names come from `assets/tokens.css`.

## When it fits

Glass is for floating chrome over content that changes underneath: a sticky nav, a toolbar, a bottom sheet, a popover, a media player bar, a floating action pill. The blur tells the reader the layer floats and the content continues behind it.

It is decoration when the background is flat or static. Cards on a plain page, a pricing table, a hero panel on a gradient made only to show off the blur: use an opaque `--surface` instead. Unasked-for glass cards are a tell. The ban lifts when the brand or brief asks for glass, and the recipe below still applies.

## Recipe

| Property | Light theme | Dark theme |
|---|---|---|
| Backdrop blur | 16 to 24 px (nav and toolbars 16 to 20, sheets 24) | same |
| Saturation | 140 to 180% (`saturate(1.6)` default) | 120 to 150% |
| Tint | `--surface` at 64 to 78% alpha | `--surface` at 55 to 70% alpha |
| Hairline border | 1 px, ink at 8 to 12% alpha | 1 px, paper at 8 to 12% alpha |
| Inner top highlight | `inset 0 1px 0`, paper at 40 to 60% alpha | `inset 0 1px 0`, paper at 6 to 10% alpha |
| Shadow | `--elevation-2`, a layered stack with a tight contact layer | `--elevation-2`; borders and lightness carry most of the depth |
| Radius | full pill for nav and toolbars; sheets and popovers from the project's shape family | same |

Text on glass uses `--text` and `--text-muted`, never a lighter tint "to look airy".

## Contrast over the worst case

The tint, not the blur, carries contrast. Blur does not lower the brightest or darkest pixel behind the layer enough to rely on.

1. Find the worst background the layer can sit over: the brightest image, the darkest section, the busiest photo in its scroll path. For a sticky nav, scroll the whole page.
2. Measure text against the tint composited over that background. Body text needs 4.5:1, icons and boundaries 3:1.
3. If it fails, raise the tint alpha toward the top of the range, then past it. Opaque is acceptable; unreadable is not.

## Fallbacks and preferences

- Start opaque. Add translucency only inside `@supports`, so browsers without `backdrop-filter` get a solid `--surface`.
- Safari before 18 needs `-webkit-backdrop-filter`. Declare both.
- `prefers-reduced-transparency: reduce` makes the surface opaque. Only Chromium supports it today (Chrome 118 and later); Safari does not and Firefox has it behind a flag, so treat it as an enhancement.
- `prefers-contrast: more` makes the surface opaque and uses `--border-strong` for the edge.
- `forced-colors: active` drops backgrounds and shadows; keep the 1 px border so the edge survives.

## Performance

- At most 3 blurred layers on screen at once, and together under about a third of the viewport area. A full-screen sheet is the exception while it is open, and it is the only blurred layer then.
- No blur on items inside scrolling lists, grids or tables, and none on elements that move every frame.
- Never animate the blur radius. Fade the layer's opacity instead.
- A backdrop only samples up to its nearest backdrop root. An ancestor with `opacity` below 1, `filter`, `mask`, `clip-path`, `mix-blend-mode` or matching `will-change` breaks the effect; check ancestors when the blur seems to do nothing.
- Test scroll at 60 fps with 4x CPU throttling. If it drops, reduce blur radius first, then area.

## No nested glass

Glass never sits on glass. A popover opened from a glass toolbar is opaque `--surface-raised`, or the toolbar turns opaque while it is open. Stacked blurs muddy the content, cost twice, and lose contrast.

## Example

```css
.glass-bar {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-pill);
  box-shadow: inset 0 1px 0 oklch(0.99 0.005 var(--brand-hue) / 0.5), var(--elevation-2);
  color: var(--text);
}

@supports ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .glass-bar {
    background: color-mix(in oklch, var(--surface) 72%, transparent);
    -webkit-backdrop-filter: blur(20px) saturate(1.6);
    backdrop-filter: blur(20px) saturate(1.6);
  }

  [data-theme="dark"] .glass-bar {
    background: color-mix(in oklch, var(--surface) 62%, transparent);
    box-shadow: inset 0 1px 0 oklch(0.99 0.005 var(--brand-hue) / 0.08), var(--elevation-2);
    -webkit-backdrop-filter: blur(20px) saturate(1.3);
    backdrop-filter: blur(20px) saturate(1.3);
  }
}

@media (prefers-color-scheme: dark) {
  @supports ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
    :root:not([data-theme="light"]) .glass-bar {
      background: color-mix(in oklch, var(--surface) 62%, transparent);
      box-shadow: inset 0 1px 0 oklch(0.99 0.005 var(--brand-hue) / 0.08), var(--elevation-2);
      -webkit-backdrop-filter: blur(20px) saturate(1.3);
      backdrop-filter: blur(20px) saturate(1.3);
    }
  }
}

@media (prefers-reduced-transparency: reduce), (prefers-contrast: more) {
  .glass-bar,
  [data-theme="dark"] .glass-bar,
  :root:not([data-theme="light"]) .glass-bar {
    background: var(--surface);
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
  }
}

@media (prefers-contrast: more) {
  .glass-bar {
    border-color: var(--border-strong);
  }
}
```

The dark block appears twice, once for the OS preference and once for the `[data-theme]` override, matching `assets/tokens.css`.
