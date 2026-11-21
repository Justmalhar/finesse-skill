import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { scan } from '../skills/finesse/scripts/check.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
// Vendored design systems are upstream text, examples are builds with their own copy, fixtures are tells on purpose.
const SKIP = new Set(['node_modules', 'examples', join('tests', 'fixtures')]);

function markdown(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    if (e.isDirectory()) return e.name.startsWith('.') || SKIP.has(relative(root, p)) || SKIP.has(e.name) ? [] : markdown(p);
    return /\.mdx?$/.test(e.name) && !e.name.endsWith('.design.md') ? [p] : [];
  });
}

test("the repo's own prose passes the copy rules", () => {
  const files = markdown(root);
  assert.ok(files.some((f) => f.endsWith(join('skills', 'finesse', 'SKILL.md'))) && files.some((f) => f.endsWith('AGENTS.md')), 'walk found the skill and root docs');
  const { findings } = scan(files, { copyOnly: true });
  const report = findings.map((f) => `${relative(root, f.file)}:${f.line} ${f.rule}`).join('\n');
  assert.equal(findings.length, 0, report);
});
