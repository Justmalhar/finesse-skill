# Contributing to finesse

Every change needs proof: a fixture, a validator pass or a test. Open an issue first for anything larger than one entry.

## Set up and test

You need Node 18 or later. There is nothing to install.

```
npm test
node skills/finesse/scripts/check.mjs --copy-only <your Markdown files>
```

Read `AGENTS.md` for the writing rules and file conventions.

## Propose a rule in SKILL.md

Say which default output it prevents, and show a screenshot or code sample of that output. Every sentence in `SKILL.md` must change what an agent builds; say what the new rule changes, and what it replaces if it overlaps an existing one.

## Propose a palette, type pairing or shape

1. Add the entry to `skills/finesse/assets/directions.json` with the next free id.
2. Run `node skills/finesse/scripts/validate-directions.mjs`. Add `--fonts` for a type pairing.
3. Run `node skills/finesse/scripts/specimen.mjs /tmp/specimen.html` and attach a screenshot of your entry in both themes.

Every entry lists its `registers` and `surfaces` (see `surfaces` at the top of the file), and `clashes` when it must never share a candidate with another id. Palettes must pass every contrast floor in both themes, on the hover, selected and well tints too, and carry `chart-1` to `chart-6` that the validator accepts. Type pairings use fonts with an open license and say whether they have `tabular` figures; `--fonts` checks that claim.

## Propose a signature detail

Add it to `directions.json` with `what`, `build`, `registers` and `surfaces`, plus `needs` when it cannot be built without something a brief may rule out ("no photos"). Link a live page or a screenshot that shows it built.

## Propose a checker rule

1. Add the rule to the `rules` array in `skills/finesse/scripts/check.mjs` with `id`, `severity`, `kinds`, `message`, `fix`, `why` and `detect`.
2. Add `tests/fixtures/<rule-id>/` with at least one `fire*` file the rule must catch and one `pass*` near miss it must ignore.
3. Run `npm test`.

Errors are for accessibility floors and clear bugs. Default tells are warnings.

## Design systems

Do not edit `skills/finesse/design-systems/` by hand. Changes go upstream to VoltAgent/awesome-design-md, then through `node scripts/sync-design-systems.mjs`. Brand owners can request removal through an issue.
