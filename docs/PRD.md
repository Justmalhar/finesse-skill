# finesse: product requirements

Status: release 0.1.0, 2026-11-21. Owner: Malhar Ujawane.

## Problem

Coding agents build frontends that converge on one look. Given a brief with no brand, they reach for the same starter palette, the same default sans, the centred hero with two buttons and a glow, rows of identical icon cards, violet gradients, and fade-up on every section. The output is often correct and still reads as generated, because nothing in it was chosen.

The second failure is finish. Default builds stop at the happy path: one theme, no focus ring, no loading or empty state, flat bordered boxes, one wide shadow. A designer notices the missing detail at once.

The third failure is the under-designed product screen. Asked for a dashboard, an agent ships one table under three numbers: no chart, one colour, one surface level. Rules that preach restraint make it worse. The bar is the rich SaaS dashboard: dense, colourful, full of real data visualisation.

Prose rules alone do not fix either problem. An agent told "be distinctive" picks the same distinctive look every time, and an agent told "add polish" has no picture of what polish looks like.

## Who it is for

- Developers who build UI with a coding agent (Claude Code, Codex, Cursor and the other harnesses `npx skills` supports) and want results that do not look templated.
- Teams with a design system who want the agent to follow it and still finish components to a high bar.
- Reviewers who want a deterministic check for accessibility floors and default tells, in the agent loop or in CI.

## Goals

1. Each build without a brand gets a direction the agent did not pick from memory: palette, type pairing, shape and two signature details, dealt by a script and weighted by the brief.
2. The agent sees the level of finish to match, through worked exemplar files, before it judges its own work.
3. One set of numbers covers type, colour, space, shape, motion and states, so results are consistent and reviewable.
4. A checker the user can run anywhere catches accessibility floors and the common tells, with zero install.
5. A small always-loaded footprint. References load only when their trigger applies.
6. The project's own design system always wins over finesse defaults.

## Non-goals

- Generating images, illustrations or photography.
- Replacing a project's existing design system or component library.
- Judging craft automatically. The checker is a lint for floors and tells. Craft is scored by the agent against the rubric in `references/craft.md`.
- Reproducing a brand's logo, fonts, copy or imagery in `like <slug>` mode.
- Native mobile or desktop UI. finesse targets web UI.

## Differentiators

The comparison uses public facts about each project as of 2026-11-21.

| | finesse | taste-skill | impeccable |
|---|---|---|---|
| Direction | Dealt by `direct.mjs` from 36 palettes, 36 type pairings, 12 shapes and 52 signature details, filtered by register and surface and weighted by the brief | Scripts pick layouts and palettes at random from curated sets | Directions catalogue and steering commands such as `bolder` and `quieter` |
| Finish reference | Five exemplar files with numbered notes, one a full dashboard | Prose rules and a browser finish gate | 24 commands and a critique score |
| Checker | 29 rules, one Node file, no dependencies, no browser | Headless Chrome inspection | 62-rule detector in a Rust engine, with SARIF and a Chrome extension |
| Install | `npx skills add`, Claude Code marketplace | `npx skills add`, Claude Code and Codex marketplaces | Own CLI (`npx impeccable install`), marketplaces |
| License | MIT | MIT | Apache-2.0 |

Two more facts about finesse. Every palette the dealer can deal passes WCAG contrast floors in both themes, enforced by `validate-directions.mjs` in the test suite. `like <slug>` mode builds in the style of 84 vendored design systems.

## Success measures

- The checker passes on every example build and on the repo's own prose.
- Three builds from one brief, dealt without a seed, show three different palettes and type pairings.
- No example scores 0 on any rubric criterion, and at least five criteria score 2.
- Always-loaded cost stays near 260 tokens, as reported by `claude plugin details finesse`.
- Adoption: GitHub stars and skills.sh installs, reviewed at 30 and 90 days.

## Release scope for 0.1.0

- The skill: `SKILL.md`, twelve references, the dealer, the direction validator, the specimen page, the checker, tokens, five exemplars and 84 design systems.
- Install through `npx skills add Justmalhar/finesse-skill` and the Claude Code marketplace.
- Example builds under `examples/`.
- A `node:test` suite and CI on Node 18, 20 and 22.

## Deferred

- A blocking finish gate or Stop hook that refuses to end a turn until the checker passes.
- A browser-based checker that reads computed styles, contrast on real pixels and layout overflow.
- A demo site with a gallery and interactive before and after.
- Codex plugin manifests (`.codex-plugin/plugin.json` and `.agents/plugins/marketplace.json`).
