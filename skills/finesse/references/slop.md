# Slop: the catalogue of AI tells

Read this in `audit` and `polish`, or when the user says the UI looks generic or AI-made.
Kind: **F** is a floor that never lifts. **D** is a default that lifts when the brief or the existing brand asks for the thing; the tell is the unasked-for default.
Rule ids are checker rules (`scripts/check.mjs`). Rows without one need your eyes.

## Visual

| Tell | Why it reads generated | Fix | Kind |
|---|---|---|---|
| Violet-to-blue or violet-to-pink gradients, purple accents | The model's default palette | Brand hue from the tokens, one accent | D `default-gradient` |
| Gradient text on headings | Decoration in place of hierarchy | Solid `text`; size and weight carry emphasis | D `gradient-text` |
| Cream, sand or beige "paper" backgrounds | The default warm editorial look | Neutrals tinted to the brand hue | D |
| Pure black text or pure white page | Unconsidered extremes | Ink at lightness 0.15 to 0.25, paper at 0.92 to 0.98 | D `pure-black-white` |
| Dark mode with neon glows | The template dark theme | Lighter raised surfaces, borders, accent chroma 10 to 20% lower | D |
| Coloured left-border stripe on cards, callouts, quotes | The most repeated generated accent | Background tint, heading, or spacing | D `side-stripe` |
| Ghost card: hairline plus wide soft shadow | Two elevation signals disagree | Border alone, or a layered shadow stack | D `ghost-card` |
| Cards rounded past 24 px | Toy-like softness on serious content | Radius from the dealt shape family | D `over-rounded` |
| Glass as decoration on static content | Blur with nothing behind it to reveal | Opaque surfaces; see `references/glass.md` | D |
| Stripe gradients, `feTurbulence` grain, hand-drawn SVG doodles | Texture hiding an empty layout | Real imagery or plain surfaces | D |
| Dark scrim over every photograph | Hides the photo to fix contrast | Text on a solid band or empty sky | D |
| Inter, Poppins, Space Grotesk as an unconsidered marketing face; italic serif display | Default faces of generated pages | The project's font, or one chosen for the brand. Inter is fine in product UI | D |
| Display at 800 or 900, above 96 px, or tracked below -0.04em | Shouting, not hierarchy | Weight 500 to 600, cap 96 px (160 px showpiece word), tracking -0.02em to -0.04em | D `heavy-display`, `tight-tracking` |
| Text below 12 px | Unreadable | 12 px floor, 16 px for reading | F `tiny-text` |
| Grey text on colour, faint muted body | Fails contrast | 4.5:1 body, 3:1 large text and UI | F |
| `outline: none` with no replacement | Keyboard users lose their place | 2 px solid focus ring, 2 px offset | F `outline-removed` |
| Emoji as UI icons | Inconsistent rendering | One icon set, one stroke width | D `emoji-icon` |

## Layout and structure

| Tell | Why it reads generated | Fix | Kind |
|---|---|---|---|
| Centred headline, subline, two buttons, glow blob | The template hero | A hero pattern from `references/surfaces.md` | D |
| Rows of identical cards: icon tile, heading, two lines | Filler shaped like content | Real UI, data or photos in varied layouts | D |
| Marketing stat strip of 3 or 4 big numbers over one-word labels | Invented proof | One sourced number, or none | D |
| KPI tiles that are a label and a bare number, or four tiles with the same visual | Nothing to compare against, so nothing reads | A unit, a comparison and a different visual per tile (`references/dashboards.md`) | D |
| A product screen that is one table under three numbers: no chart, one colour, one surface level | The data is there and nothing encodes it | The charts the data supports, series colours, page, tile and raised surfaces | D |
| A badge on every row of a table past 8 rows | The column turns into stripes | Glyph plus words in the table; tinted badges on cards and headers | D |
| Tracked uppercase eyebrow over every section, pill chip above the hero | Ornament repeated into noise | One eyebrow per page at most | D |
| Numbered section markers 01, 02, 03 | Fake editorial structure | Headings that name the section | D |
| Cards inside cards | Boxes without hierarchy | One container, spacing for groups | D |
| Every section the same layout | No rhythm | Neighbours never share a layout | D |
| Coloured box standing in for an image | Unfinished page | Real UI, a real photo, or no slot | F |
| Off-grid spacing (13 px, 18 px, 22 px) | No system | The 4 px scale | D `off-scale-spacing` |
| `z-index: 9999` | Layer wars | Named z-index scale | F `zindex-magic` |
| Click handler on a `div` or `span` | Unreachable by keyboard | A `button` or `a` | F `div-onclick` |
| Image with no `alt` | Invisible to screen readers | Describe it, or `alt=""` when decorative | F `img-no-alt` |

## Motion

| Tell | Why it reads generated | Fix | Kind |
|---|---|---|---|
| Fade-up on every section | Motion as filler | One reveal style per page, visible without JavaScript | D |
| Bounce or elastic easing on UI | Toy feel, slows the task | Ease-out; overshoot only in expressive marketing springs | D `bounce-easing` |
| `transition: all` | Animates layout by accident | List the properties | F `transition-all` |
| Entering from `scale(0)` | Things do not grow from nothing | Start at `scale(0.95)` or more with opacity 0 | F `scale-from-zero` |
| Ease-in on entering elements | Sluggish at the moment of attention | Ease-out | F `ease-in-enter` |
| Animating `width`, `height`, `top`, `left`, `margin` | Layout thrash | `transform`, `opacity`, `filter`, `clip-path` | F `layout-animation` |
| Ungated hover scale | Sticks on touch | `@media (hover: hover) and (pointer: fine)` | D `hover-ungated-scale` |
| Animation with no reduced-motion path | Harms vestibular users | Under `prefers-reduced-motion`, drop translation, scale, parallax, loops | F `motion-no-reduced` |
| Parallax on body text, scroll-jacking, full-page snap | Takes control from the reader | Parallax on imagery only, native scroll | F |
| Tilt cards, autoplay carousels | Motion nobody asked for | Static cards; carousels with controls, no autoplay | D |

## Copy

| Tell | Why it reads generated | Fix | Kind |
|---|---|---|---|
| seamless, elevate, unlock, effortless, robust, leverage, delve, cutting-edge; "The future of X is here", "Ready to transform your X?" | Generated vocabulary and stock lines | Plain verbs, the specific thing, and who it is for | D `slop-copy` | <!-- finesse-ignore slop-copy: catalogue -->
| "It's not just X, it's Y", "X. Y." fragment headlines, "The result?" | Aphoristic cadence | One plain sentence with a claim | D |
| Copy that narrates itself ("Here's the thing") | Theatre, not content | Delete it | D |
| Em dashes | The most recognised generated punctuation | Comma, colon, full stop, parentheses | F `em-dash` |
| Middle dots or bullets as inline separators | Template metadata styling | Separate elements or plain words | F `middot-separator` |
| Invented testimonials, customers, logos, metrics | False claims | Supplied facts, or omit the section | F |
| Lorem ipsum, `[Company Name]`, "Your text here", chatbot residue | Unfinished output | Real copy from the brief | F `placeholder-residue` | <!-- finesse-ignore placeholder-residue: catalogue -->
