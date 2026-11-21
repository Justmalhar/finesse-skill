# Components

Read this when building or polishing an interactive component, or after installing one from a registry.
Tokens: `assets/tokens.css`. Motion: `references/motion.md`. Finish: `references/craft.md`, shown in `assets/exemplars/controls.html` and `surfaces.html`. Charts, KPI tiles, meters and status badges: `references/dashboards.md`.

## State matrix

Controls define default, hover, focus-visible, active, disabled, and loading and error where they can occur. Links have no loading state. Collections and views add empty. Async actions add success. The table says what loading, error and the extra states look like for each class.

| Component | Loading | Error | Extra states |
|---|---|---|---|
| Button | spinner inside, width held | inline message or toast | success (async) |
| Link | not used; navigation shows page loading | broken target is a bug | visited (prose only) |
| Input, textarea | spinner at the end (async validation) | border, message, `aria-invalid` | |
| Select, combobox | skeleton options | message under the field | empty: "No results for ..." |
| Checkbox, switch, radio | spinner beside the label while saving | revert the toggle, say why | on, off, mixed |
| Tabs | skeleton in the panel | error in the panel | selected; empty panel |
| Menu, dropdown | skeleton rows | error row with retry | empty |
| Dialog, sheet | primary button loading | message above the actions | success when it closes on submit |
| Toast | spinner for pending work | `role="alert"` variant | success |
| Tooltip | none | none | none; hover and focus only |
| Card (interactive) | skeleton of the same size | inline message with retry | |
| List row, table | skeleton rows | inline message with retry | empty with next action |
| Progress | indeterminate | stopped bar plus message | success |

Rules for every state:
- Focus ring: 2 px solid `--focus`, 2 px offset (inset `-2px` inside clipping containers), at least 3:1, no transition. Never remove an outline without this replacement.
- No layout shift between states. Keep font weight constant (selected tabs change colour, not weight). Reserve width for the longest label. Fix container height when content swaps.
- Skeletons for loading content. Spinners only inside buttons.
- Disabled: opacity no lower than 0.5; say why nearby when the reason is not obvious.

## Per-component rules

### Button
| Size | Height | Horizontal padding | Label |
|---|---|---|---|
| Dense pointer (product toolbars) | 32 px | 12 px | 14 px |
| Default | 40 px | 16 px | 14 to 16 px |
| Touch and marketing CTA | 44 to 48 px | 24 px | 16 px |

- Radius `--r-control`, from the project's shape family. One choice per product.
- Icon-only buttons are square and carry `aria-label`.
- Press: `scale(var(--press-scale))` (0.97) over `--dur-press`. Hover: colour shift, no growth.
- One primary button per view. A hover sheen, if any, goes on that one only.

**Async button** (idle, loading, success, error):
- Stack all labels in one grid cell (`grid-area: 1 / 1`) so the width fits the longest.
- Show the spinner after 150 ms, then keep it at least 400 ms, so it never flashes.
- While loading set `aria-busy` and `aria-disabled` and ignore clicks. Not `disabled`, which drops focus.
- Success holds 1,500 to 2,000 ms, then idle. Error stays until the next attempt and names the failure.
- Swap labels with the blur swap from `references/motion.md`. Announce the result in a polite live region.

### Link
- Underline links in prose (1 px, offset 2 to 4 px). Nav links may drop it.
- A link navigates; a button acts. Every live link has an `href`, and `href="#"` is never one.

### Inert destination
A link to a screen the build does not include: a nav item, "View all", an entity name, "Upgrade plan".
- Point it at a real section of the page when one exists (`href="#sites"`).
- Otherwise: `<a role="link" aria-disabled="true">Reports</a>`, same classes as its live neighbours. No `href`, so it never jumps and leaves the tab order; `role="link"` keeps it announced as a link; `aria-disabled` says it does nothing. Bind no handler.
- It looks normal: no opacity, no grey ink, no strikethrough, `cursor: default`. Scope any dimming rule to real disabled controls (`button[aria-disabled="true"]`, `:disabled`), never to `[aria-disabled]` alone. A dimmed nav reads as broken in every screenshot.
- List each one under `Open` in the report.

### Input, textarea, select
- Height 40 px (44 px on touch). Text 16 px on touch devices to stop iOS zoom. Padding 12 px horizontal.
- Always a visible label. Placeholder is an example, never the label, at 4.5:1.
- Border `--border-strong` (3:1). Focus adds the ring, not just a border colour.
- Error: `--danger` border, message below tied with `aria-describedby`, `aria-invalid="true"`. Validate on blur, then on input once an error has shown.
- Native `select` unless you need search; then a tested combobox.

### Checkbox, switch, radio
- Real `input type="checkbox"` or `"radio"`; a switch adds `role="switch"`. Box 16 to 20 px, hit area 44 px on touch.
- A switch applies at once; a checkbox waits for submit.
- Thumb travel animates `transform` over `--dur-state`.

### Tabs
- `role="tablist"`, `role="tab"` with `aria-selected` and `aria-controls`, `role="tabpanel"`. Roving `tabindex`: arrow keys move, Home and End jump.
- Selected indicator moves with `transform` (or a shared layout animation) over 180 to 250 ms. Nested pill: inner radius equals outer radius minus a 4 px inset.

### Menu, dropdown
- Opens on click or Enter, not hover. Trigger has `aria-haspopup` and `aria-expanded`.
- Arrows move, Home and End jump, typeahead works, Escape closes and refocuses the trigger.
- Scales from 0.95 at the trigger edge (`transform-origin`), 200 to 300 ms in, about 70% out. `--z-dropdown`.
- Rows 32 px dense, 44 px touch. Destructive items use `--danger` text and sit last.

### Dialog, sheet
- Native `dialog` with `showModal()` gives modality, an inert page and Escape. Add `aria-labelledby`.
- Open: focus the first field or the safe action, never the destructive one. Close: refocus the trigger.
- Lock page scroll. Radius `--r-modal`, from the project's shape family. Form dialogs about 560 px wide.
- Dialog enters from `scale(0.95)` with opacity, 200 to 300 ms. Sheets slide from their edge, 300 to 500 ms, `--curve-move`.
- Never stack modals. Backdrop click closes only when no input would be lost.

### Toast
- `role="status"` for confirmations; `role="alert"` only for errors.
- Dismiss after 4,000 to 6,000 ms; with an action, at least 10,000 ms or until dismissed. Pause on hover and focus.
- At most 3 visible, newest nearest the edge, older ones scaled down 0.05 per step and offset 8 px. `--z-toast`.
- Bottom right on desktop, bottom centre on phone, inside the safe area. Enter 8 to 16 px from the edge, 200 to 300 ms.
- Never the only copy of important information.

### Tooltip
- Opens 500 ms after hover, at once on focus. While one is open, neighbours open with no delay for 300 ms.
- `role="tooltip"` via `aria-describedby`. Escape dismisses. Hovering the tooltip keeps it open.
- Plain text only. Never on a disabled button, which gets no events.
- `--z-tooltip`. Fade and scale from 0.97, 200 ms, from the trigger side.

### Card
- Radius from the project's shape family, never above 24 px. Padding 16 to 24 px. Nested radius equals card radius minus the gap while the gap is under the radius.
- Clickable card: one real link on the title, stretched with a pseudo-element. Secondary actions sit above it.
- Hover lift at most 2 px, image zoom at most 1.03 in `overflow: hidden`, gated by `@media (hover: hover) and (pointer: fine)`.

### List row
- Min height 44 px touch, 32 px dense. Hover is a background tint, never a border that adds width.
- Reorder animates with transform. Keys are stable ids, never the array index.

### Table
- Numbers right-aligned with `tabular-nums`. `th` with `scope`. Sortable headers are buttons with `aria-sort` on the `th`.
- Sticky header at `--z-sticky`. Row height 40 to 44 px, 32 px dense. Status is a glyph plus words; past 8 rows never a badge per row. A card or page header carries a tinted badge instead (`references/dashboards.md`).
- Empty state says what would appear and offers the next action.

### Progress
- `role="progressbar"` with `aria-valuemin`, `aria-valuemax`, `aria-valuenow`, and a label. Indeterminate omits `aria-valuenow`.
- Fill with `transform: scaleX()` and `transform-origin: left` when the value animates. A meter that never animates may set `width` (recipe in `references/dashboards.md`). Linear easing only here and in loops.
- Under reduced motion the indeterminate loop stops; show a static bar plus text.

## Accessibility floor

- Real elements: `button`, `a href`, `input`, `select`, `dialog`. No click handlers on `div` or `span`.
- Icon-only controls have an accessible name. Decorative icons get `aria-hidden="true"`.
- Transient feedback goes through `aria-live="polite"`, in a region that exists before the message.
- Escape closes every overlay; focus returns to its opener.
- Targets 44 px on touch, 32 px dense pointer, never below 24 px, 8 px apart.

## Engineering floor

- Clear timers on unmount and before re-arming.
- Every async action handles failure (network, clipboard permission, abort) and shows the error state.
- Abort in-flight requests on unmount. Block double submit while loading.
- One motion import path (`motion/react`), never mixed with `framer-motion`.

## Registry or build

Install when the behaviour is complex and solved (combobox, date picker, command palette, toasts, sortable lists). Build when it is one element with a few states. Prefer the project's own components, then shadcn/ui (`npx shadcn@latest add <name>`), then animated registries such as Watermelon UI:

```bash
npx shadcn@latest add https://registry.watermelon.sh/r/<name>.json
```

An installed file is a first draft. Animated registry components often skip these, so fix them before calling it done:

1. Hard-coded hex and `dark:` hex pairs become semantic tokens (`bg-surface`, `text-text`). Install a token-based variant when offered.
2. Reduced motion: `MotionConfig reducedMotion="user"` at the root, and infinite loops (shimmers, decorative spinners) stop.
3. Focus ring added; `outline-none` without a replacement deleted.
4. Clickable `div`s become `button`s; roles (`tab`, `dialog`, `progressbar`) and labels added.
5. `aria-live` on confirmations. Timers cleared, async rejections caught.
6. Animated `width` or `height` becomes `transform`; font weight constant across states.
7. Index keys become ids. Sizes, radius and spacing moved onto the finesse scales.
8. Chart colours (Recharts, Tremor, shadcn charts) become `--chart-1` to `--chart-6`, assigned by meaning as `references/dashboards.md` says, with a legend or label per series. Placeholder data (January to June, round demo figures, `desktop` and `mobile` series) becomes the brief's real figures, or the chart comes out and the report says so.

Then run the craft pass and the checker on the installed file.
