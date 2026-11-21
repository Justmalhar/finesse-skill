import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readdirSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { scan, rules } from '../skills/finesse/scripts/check.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const CHECK = join(here, '../skills/finesse/scripts/check.mjs');
const FIX = join(here, 'fixtures');
const run = (...args) => spawnSync(process.execPath, [CHECK, ...args], { encoding: 'utf8' });
const ruleHits = (path, id) => scan([path], { only: [id] }).findings.filter((f) => f.rule === id);

for (const rule of rules) {
  test(`${rule.id}: fires on every fire fixture and stays quiet on every near miss`, () => {
    const entries = readdirSync(join(FIX, rule.id));
    const fire = entries.filter((e) => e.startsWith('fire'));
    const pass = entries.filter((e) => e.startsWith('pass'));
    assert.ok(fire.length && pass.length, `${rule.id} needs fire* and pass* fixtures`);
    for (const e of fire) assert.ok(ruleHits(join(FIX, rule.id, e), rule.id).length > 0, `${rule.id} should fire on ${e}`);
    for (const e of pass) assert.deepEqual(ruleHits(join(FIX, rule.id, e), rule.id), [], `${rule.id} should not fire on ${e}`);
  });
}

test('findings carry the line number of the offending text', () => {
  const [hit] = ruleHits(join(FIX, 'em-dash/fire.md'), 'em-dash');
  assert.equal(hit.line, 3);
  const lines = ruleHits(join(FIX, 'scale-from-zero/fire.tsx'), 'scale-from-zero').map((f) => f.line);
  assert.deepEqual(lines, [2, 3]);
});

test('a valid waiver suppresses the finding on the next line', () => {
  const { findings } = scan([join(FIX, 'waiver-invalid/pass.tsx')]);
  assert.deepEqual(findings, []);
});

test('a waiver with no reason is an error and suppresses nothing', () => {
  const ids = scan([join(FIX, 'waiver-invalid/fire.tsx')]).findings.map((f) => f.rule).sort();
  assert.deepEqual(ids, ['em-dash', 'waiver-invalid']);
});

test('exit code is 1 with errors, 0 with only warnings or nothing', () => {
  assert.equal(run(join(FIX, 'transition-all/fire.css')).status, 1);
  assert.equal(run(join(FIX, 'heavy-display/fire.css')).status, 0);
  assert.equal(run(join(FIX, 'transition-all/pass.tsx')).status, 0);
});

test('prints one line per finding and an exact final line', () => {
  const fail = run(join(FIX, 'transition-all/fire.css'), join(FIX, 'heavy-display/fire.css'));
  const lines = fail.stdout.trim().split('\n');
  assert.equal(lines.at(-1), 'FINESSE: FAIL 1 errors, 1 warnings');
  for (const l of lines.slice(0, -1)) assert.match(l, /^\S+:\d+ {2}(error|warn) {2}[a-z-]+ {2}.+ {2}\(fix: .+\)$/);
  assert.ok(lines.some((l) => /transition-all\/fire\.css:1 {2}error {2}transition-all /.test(l)));
  assert.equal(run(join(FIX, 'transition-all/pass.tsx')).stdout.trim(), 'FINESSE: PASS');
});

test('--json emits machine output with counts', () => {
  const r = run('--json', join(FIX, 'tiny-text/fire.tsx'));
  const out = JSON.parse(r.stdout);
  assert.equal(r.status, 1);
  assert.equal(out.files, 1);
  assert.equal(out.errors, 1);
  assert.deepEqual(Object.keys(out.findings[0]).sort(), ['file', 'fix', 'line', 'message', 'rule', 'severity']);
  assert.equal(out.findings[0].rule, 'tiny-text');
});

test('--only runs just the named rules and --skip removes them', () => {
  const file = join(FIX, 'em-dash/fire.tsx');
  const all = JSON.parse(run('--json', file).stdout).findings.map((f) => f.rule);
  assert.ok(all.includes('em-dash'));
  assert.deepEqual(JSON.parse(run('--json', '--only', 'tiny-text', file).stdout).findings, []);
  assert.ok(!JSON.parse(run('--json', '--skip=em-dash', file).stdout).findings.some((f) => f.rule === 'em-dash'));
  assert.equal(run('--only', 'no-such-rule', file).status, 2);
});

test('--copy-only applies copy rules only', () => {
  const dir = mkdtempSync(join(tmpdir(), 'finesse-'));
  try {
    writeFileSync(join(dir, 'a.tsx'), 'export const A = () => <p className="transition-all">Fast — free</p>;\n');
    const ids = JSON.parse(run('--json', '--copy-only', dir).stdout).findings.map((f) => f.rule);
    assert.deepEqual(ids, ['em-dash']);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('--rules lists every rule id', () => {
  const out = run('--rules').stdout;
  for (const r of rules) assert.match(out, new RegExp(`^${r.id} `, 'm'));
});

test('directory scans skip vendored and build directories', () => {
  const dir = mkdtempSync(join(tmpdir(), 'finesse-'));
  try {
    for (const d of ['node_modules/x', 'design-systems', 'dist', '.next', 'src']) mkdirSync(join(dir, d), { recursive: true });
    for (const d of ['node_modules/x', 'design-systems', 'dist', '.next']) writeFileSync(join(dir, d, 'a.css'), '.a { transition: all 1s; }\n');
    writeFileSync(join(dir, 'src', 'a.css'), '.a { transition: all 1s; }\n');
    const r = scan([dir]);
    assert.equal(r.files, 1);
    assert.equal(r.errors, 1);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
