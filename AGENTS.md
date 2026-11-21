# AGENTS.md

For agents that change this repository. Users of the skill read `skills/finesse/SKILL.md`.

## Treat SKILL.md as the source of truth

`skills/finesse/SKILL.md` owns every number: sizes, ratios, durations, contrast floors and counts. A reference, script, exemplar or doc that repeats a number must match it. To change a number, edit `SKILL.md` first, then grep for the old value and update every copy in the same commit.

Counts in prose (84 design systems, 29 checker rules, 36 palettes, five exemplars) come from the data. Recount with the scripts before you change one.

## Keep the repo passing its own checker

`npm test` includes `tests/self.test.mjs`, which runs the checker's copy rules over every Markdown file in the repo except the vendored `*.design.md` files, `examples/` and `tests/fixtures/`. Fix findings in the prose. Never edit `check.mjs` to make the repo pass, and never waive a finding in your own writing outside a catalogue of tells.

## Make every sentence earn its length

There is no word budget. Length is fine; filler is not. Keep a sentence only when it changes what an agent builds: a number, a recipe, a trigger, a failure to avoid. Cut background, restated rules and reasons the agent does not need to act. When you cut for length, check that no rule, number or recipe went with it. `tests/frontmatter.test.mjs` still holds the description to 1,024 characters and the `SKILL.md` body to under 500 lines.

## Never hand-edit generated or vendored files

- `skills/finesse/design-systems/` (`*.design.md`, `index.md`, `SOURCE.json`, `LICENSE`) is written by `node scripts/sync-design-systems.mjs`. To change an index line, edit `OVERRIDES` in that script. To drop a brand, add its slug to `EXCLUDED`. Then rerun the script.
- The `.design.md` suffix is deliberate. Named `<slug>.md`, the vendored `claude.md` collides with `CLAUDE.md` on case-insensitive filesystems, and agent harnesses auto-load that file as instructions.
- `skills/finesse/assets/directions.json` is data. After any edit, run `node skills/finesse/scripts/validate-directions.mjs`, and add `--fonts` when you change a type pairing. It checks contrast, gamut, ids, tags and banned separator characters.

## Keep the exemplars at their bar

`assets/exemplars/*.html` set a level of finish, never a look. There are five: controls, surfaces, data, marketing and dashboard. They share `assets/exemplars/base.css`, so shared craft goes there, and each one's nav links to the other four. Every piece shows all its states in both themes, with no placeholder content.

## Give every checker rule fixtures

A rule in `check.mjs` needs `tests/fixtures/<rule-id>/` with at least one `fire*` file and one `pass*` near miss. `tests/check.test.mjs` fails without them.

## Run the tests

```
npm test
```

Node 18 or later. CI runs Node 18, 20 and 22.

## Follow the writing rules

These apply to prose, comments, commit messages and UI copy.

- No em dash, no spaced en dash and no `--` used as a dash. Use a comma, colon, semicolon, parentheses or a full stop.
- No middle dot or bullet as an inline separator.
- No stock marketing vocabulary. The `slop-copy` pattern in `check.mjs` is the list.
- No coloured left-border accent on cards, callouts or quotes.

## Commit conventions

- Branch names: `cc-feature/<name>`, `cc-fix/<name>`, `cc-ui/<name>`, `cc-docs/<name>`.
- One logical change per commit, imperative subject, `npm test` green.
- On a release, bump `version` in `package.json` and `.claude-plugin/marketplace.json` together and add a `CHANGELOG.md` entry. `tests/manifest.test.mjs` checks that the versions agree.
