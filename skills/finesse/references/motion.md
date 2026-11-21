# Motion

Read this when adding transitions, enter and exit animations, layout animation or scroll reveals, in either register.
For GSAP, three.js and parallax read `references/showpiece.md`. Token names come from `assets/tokens.css`.

## Decide in this order

1. **Should it animate at all?** Frequency decides. Actions done many times a day (typing, command palette, keyboard navigation, list selection) get no animation. Occasional actions get a short one. Rare moments (first load, onboarding, a marketing hero) may get more.
2. **What does it communicate?** Feedback (I heard you), state (this changed), spatial (this came from there), or attention (look here). If you cannot name one, cut it.
3. **Curve.** Pick from the table below.
4. **Duration.** Pick from the table below. Product UI stays under 300 ms except layout.

## Durations

| Purpose | Range | Token |
|---|---|---|
| Press and hover feedback | 100 to 160 ms | `--dur-press: 120ms` |
| State change (toggle, tab, colour) | 180 to 250 ms | `--dur-state: 200ms` |
| Overlays (menu, popover, tooltip, toast) | 200 to 300 ms | `--dur-overlay: 240ms` |
| Layout and large panels | 300 to 500 ms | `--dur-layout: 400ms` |
| Marketing entrances | 500 to 800 ms | `--dur-entrance: 600ms` |
| Data draw-in (a chart series on first load, once) | 600 to 800 ms | `--dur-entrance` |

Exit runs at about 70% of the matching enter (`--dur-overlay-exit: calc(var(--dur-overlay) * 0.7)`).

## Curves

| Use | Curve | Token |
|---|---|---|
| Default: entering, state changes, feedback | `cubic-bezier(0.22, 1, 0.36, 1)` | `--curve-out` |
| Travel across the screen (sheet, drawer, carousel step) | `cubic-bezier(0.65, 0, 0.35, 1)` | `--curve-move` |
| Loops and progress only | `linear` | |

Never ease-in for something entering. Never `transition: all`; list the properties. Never bounce or elastic easing in product UI.

## Springs (`motion/react`)

Use springs for things that move or resize. Use tweens for opacity and colour.

| Tier | Settings | Use |
|---|---|---|
| Snappy | `{ type: "spring", stiffness: 400, damping: 40 }` | Indicators, toggles, drag release, reorder |
| Expressive (marketing or playful only) | `{ type: "spring", stiffness: 240, damping: 18 }` | A morph that should read as alive |
| Swap | `{ type: "spring", bounce: 0, visualDuration: 0.3 }` | Content swaps, product moves that must not overshoot |

Product UI does not overshoot. Snappy is critically damped (damping = 2 x the square root of stiffness, at mass 1), so it settles without passing its target. Lower the damping only in the expressive tier.

Import from `motion/react`, never `framer-motion`, and keep one import path per project.

**CSS-only projects.** Use the curve tokens with transitions. For a spring feel without JavaScript, generate a `linear()` easing from the spring (supported in Chrome 113, Safari 17.2, Firefox 112 and later) and keep a `cubic-bezier` fallback declared first.

## Enter and exit

- Never start from `scale(0)`. Start at `scale(0.95)` or more with opacity 0, or translate 8 px (`--enter-y`).
- Popovers and menus scale from their trigger: set `transform-origin` to the trigger side.
- Exit is faster and simpler than enter: opacity plus a smaller move.
- Use `@starting-style` or `AnimatePresence` for elements that mount; do not toggle `display` with a delay hack.

## Content swaps

When one label, icon or number replaces another: opacity 0 to 1, `blur(4px)` to `blur(0)`, scale 0.95 to 1. The outgoing item leaves layout at once (`AnimatePresence mode="popLayout"`) so siblings do not jump. Fix the container size, or stack both items in one grid cell. Numbers that change use `tabular-nums`.

## Layout animation

Animate only `transform`, `opacity`, `filter` and `clip-path`. Never `width`, `height`, `top`, `left` or `margin`.

To animate a size or position change:
- In `motion/react`, use the `layout` prop or a shared `layoutId`. Text inside a resizing box gets `layout="position"` so it does not stretch.
- In CSS, measure first and last positions and animate the difference with `transform` (FLIP), or use the View Transitions API where supported.
- Progress and fills use `scaleX` with `transform-origin: left`.

## Stagger

30 to 60 ms per item (`--stagger: 40ms`), total at most 400 ms. Past 8 to 10 items, stagger the first few and show the rest together. Stagger never blocks clicks or scroll.

## Scroll reveals

- At most one reveal style per page. Each element reveals once.
- Content is visible by default without JavaScript. Hide it only after a script or `@supports` check has run.
- Do not fade in every section. Reveal the moments that matter: a figure, a set of cards, a stat.

## Hover

- Card lift at most 2 px. Image zoom at most 1.03 inside `overflow: hidden`.
- Gate hover motion behind `@media (hover: hover) and (pointer: fine)` so touch taps do not leave cards stuck lifted.
- Press is `scale(0.97)` (0.96 to 0.98) on `:active`, outside the hover gate.

## Reduced motion

Under `prefers-reduced-motion: reduce`, remove translation, scale, parallax and loops. Keep opacity and colour fades at 200 ms or less. `assets/tokens.css` already zeroes the motion tokens, so components that read them comply.

In `motion/react`, wrap the app once:

```tsx
import type { ReactNode } from "react";
import { MotionConfig } from "motion/react";

export function Providers({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
```

This disables transform and layout animation and keeps opacity. Loops still need their own check with `useReducedMotion()`.

## Worked example: CSS

A popover that scales from its trigger, with exit, hover gate and reduced motion.

```css
.popover {
  transform-origin: top left;
  opacity: 1;
  transform: scale(1);
  transition:
    opacity var(--dur-overlay) var(--curve-out),
    transform var(--dur-overlay) var(--curve-out),
    display var(--dur-overlay) allow-discrete;
}

.popover[hidden] {
  display: none;
  opacity: 0;
  transform: scale(var(--enter-scale));
  transition-duration: var(--dur-overlay-exit);
}

@starting-style {
  .popover {
    opacity: 0;
    transform: scale(var(--enter-scale));
  }
}

.trigger:active {
  transform: scale(var(--press-scale));
  transition: transform var(--dur-press) var(--curve-out);
}

@media (hover: hover) and (pointer: fine) {
  .trigger:hover {
    background: var(--surface-raised);
  }
}

@media (prefers-reduced-motion: reduce) {
  .popover,
  .popover[hidden] {
    transform: none;
    transition-property: opacity, display;
  }
}
```

## Worked example: `motion/react`

A copy button that swaps its label with the blur swap, keeps its width, announces the result and cleans up its timer.

```tsx
"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

type Status = "idle" | "copied" | "failed";
const LABEL: Record<Status, string> = { idle: "Copy link", copied: "Copied", failed: "Copy failed" };
const swap = { type: "spring", bounce: 0, visualDuration: 0.3 } as const;

export function CopyButton({ value }: { value: string }) {
  const [status, setStatus] = useState<Status>("idle");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  async function copy() {
    clearTimeout(timer.current);
    try {
      await navigator.clipboard.writeText(value);
      setStatus("copied");
    } catch {
      setStatus("failed");
    }
    timer.current = setTimeout(() => setStatus("idle"), 2000);
  }

  return (
    <>
      <button type="button" onClick={copy} className="copy-button">
        <span className="copy-button__sizer" aria-hidden="true">Copy failed</span>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={status}
            initial={{ opacity: 0, filter: "blur(4px)", scale: 0.95 }}
            animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
            exit={{ opacity: 0, filter: "blur(4px)", scale: 0.95 }}
            transition={swap}
          >
            {LABEL[status]}
          </motion.span>
        </AnimatePresence>
      </button>
      <span className="sr-only" aria-live="polite">
        {status === "idle" ? "" : LABEL[status]}
      </span>
    </>
  );
}
```

`.copy-button` is `display: inline-grid` and every child sits in `grid-area: 1 / 1`; the invisible sizer holds the width of the longest label (`visibility: hidden`).
