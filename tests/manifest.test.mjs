import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'));
const pkg = readJson('package.json');
const market = readJson('.claude-plugin/marketplace.json');

function assertRelativeInside(base, p, label) {
  assert.match(p, /^\.\//, `${label} ${p} must start with ./`);
  assert.ok(!p.split('/').includes('..'), `${label} ${p} must not contain ..`);
  const abs = resolve(base, p);
  assert.ok(!relative(root, abs).startsWith('..'), `${label} ${p} escapes the repo`);
  assert.ok(existsSync(abs), `${label} ${p} does not exist`);
  return abs;
}

test('marketplace name matches package.json and owner is set', () => {
  assert.equal(market.name, pkg.name);
  assert.equal(market.owner?.name, 'Malhar Ujawane');
  assert.ok(Array.isArray(market.plugins) && market.plugins.length === 1);
});

test('the finesse entry agrees with package.json and points at an installable skill', () => {
  const [entry] = market.plugins;
  assert.equal(entry.name, 'finesse');
  assert.equal(entry.version, pkg.version);
  assert.equal(entry.license, pkg.license);
  const pluginRoot = assertRelativeInside(root, entry.source, 'source');
  for (const s of entry.skills ? [].concat(entry.skills) : ['./skills/finesse']) {
    const dir = assertRelativeInside(pluginRoot, s, 'skills path');
    assert.ok(existsSync(join(dir, 'SKILL.md')), `${s} has no SKILL.md`);
  }
  const skill = readFileSync(join(pluginRoot, 'skills/finesse/SKILL.md'), 'utf8');
  assert.match(skill, /^---\n[\s\S]*?^name: finesse$/m);
});
