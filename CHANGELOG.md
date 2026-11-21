# Changelog

All notable changes to finesse are recorded here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Twenty gallery pages under `examples/`, one niche each, with no palette or type pairing shared between them, and their screenshots in the README.

### Changed

- Tell 10 now also covers a single accent coloured word in a hero headline.
- New tell 14: food photography pushed through a duotone or halftone until it stops looking appetising.

## [0.1.0] - 2026-11-21

First public release.

### Added

- The `finesse` skill at `skills/finesse/`, with five modes: `build`, `audit`, `polish`, `like <slug>` and `showpiece`.
- A numeric core in `SKILL.md` for type, colour, space, shape, motion and component states, and a ten-step workflow from reading the project to the final report. The craft file and one exemplar are read before the build, and product screens are rich by default.
- The direction dealer, `scripts/direct.mjs`. It deals three candidate directions from `assets/directions.json` (36 palettes, 36 type pairings, 12 shapes, 52 signature details). It reads the register and the surfaces (dashboard, app, table, settings, landing, pricing, article, docs) from the brief, ignores negated phrases, never pairs entries marked as clashing, drops signatures whose needs the brief rules out, and explains any id with `--explain`. `--emit` prints a font import and a token block, CSS or Tailwind v4, with the palette's base theme as the default.
- Product palettes for dashboards and app screens: dark-first, three stepped grounds, a light theme, and tabular type pairings.
- Chart colours `--chart-1` to `--chart-6` in every palette and theme, held at 3:1 on surfaces and apart from their neighbours under protanopia and deuteranopia.
- `scripts/validate-directions.mjs`, which checks every palette for WCAG contrast floors (on surfaces and on hover, selected and well tints), sRGB gamut, chart series and a 0.12 lightness step between text and muted text in both themes, and checks type and shape entries against the numeric core.
- `scripts/specimen.mjs`, which renders the whole direction library as one HTML page for review by eye.
- A zero-dependency checker, `scripts/check.mjs`, with 29 rules (12 errors, 17 warnings) over CSS, markup, JSX, Tailwind class strings and Markdown, waivers with a required reason, `--json`, `--only`, `--skip` and `--copy-only`.
- Twelve on-demand references: direction, craft, exemplars, dashboards, foundations, surfaces, components, motion, slop, showpiece, glass and design systems. `references/dashboards.md` covers composition, KPI tiles, series colours, chart recipes, status badges and dashboard states.
- Five exemplar files (controls, surfaces, data, marketing, dashboard) that share `assets/exemplars/base.css` and set the level of finish to match. `dashboard.html` is a full screen at dashboard density with its own three palettes, six series colours each, and loading, empty and tooltip states.
- `assets/tokens.css`, a starter token file with the thirteen colour roles, light and dark themes, a `[data-theme]` override and a named z-index scale.
- 84 design systems vendored from VoltAgent/awesome-design-md at a pinned commit, with `SOURCE.json` hashes, an index, the upstream license and a notice. `scripts/sync-design-systems.mjs` regenerates them.
- Install paths for `npx skills add Justmalhar/finesse-skill` and the Claude Code plugin marketplace (`.claude-plugin/marketplace.json`).
- Example builds under `examples/`: Ledgerline, Perigee and Tidewater.
- A `node:test` suite with fixtures for every checker rule, dealer and validator tests, Agent Skills frontmatter checks, a self-check of the repo's own prose, and manifest checks. CI runs it on Node 18, 20 and 22.

[0.1.0]: https://github.com/Justmalhar/finesse-skill/releases/tag/v0.1.0
