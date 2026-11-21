import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync, mkdtempSync, chmodSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { validate, parseOklch, ROLES, CHART } from '../skills/finesse/scripts/validate-directions.mjs';
import { understand, deal } from '../skills/finesse/scripts/direct.mjs';

const skill = join(dirname(fileURLToPath(import.meta.url)), '..', 'skills', 'finesse');
const DIRECT = join(skill, 'scripts', 'direct.mjs');
const lib = JSON.parse(readFileSync(join(skill, 'assets', 'directions.json'), 'utf8'));
const byId = Object.fromEntries(['palettes', 'type', 'shape', 'signature'].flatMap((a) => lib[a].map((e) => [e.id, e])));
const clone = () => structuredClone(lib);

function run(args, cwd = mkdtempSync(join(tmpdir(), 'finesse-direct-'))) {
  return execFileSync(process.execPath, [DIRECT, ...args], { cwd, encoding: 'utf8' });
}

function candidates(out) {
  return [...out.matchAll(/^\d+\. (P\d\d)-(T\d\d)-(S\d\d)-(G\d\d)-(G\d\d)$/gm)].map((m) => ({ id: m[0].split(' ')[1], P: m[1], T: m[2], S: m[3], G: [m[4], m[5]] }));
}

// Enough of a CSS reader for the emitted block: comments out, braces balanced, every declaration well formed.
function parseCss(css) {
  const src = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const blocks = [];
  const stack = [];
  let buf = '';
  for (const ch of src) {
    if (ch === '{') { stack.push({ selector: buf.trim(), decls: {} }); buf = ''; }
    else if (ch === '}') {
      const b = stack.pop();
      assert.ok(b, 'unbalanced closing brace');
      for (const d of buf.split(';').map((s) => s.trim()).filter(Boolean)) {
        const m = /^([-\w]+)\s*:\s*([\s\S]+)$/.exec(d);
        assert.ok(m, `malformed declaration "${d}" in ${b.selector}`);
        b.decls[m[1]] = m[2].trim();
      }
      blocks.push(b);
      buf = '';
    } else if (ch === ';' && !stack.length) { buf = ''; }
    else buf += ch;
  }
  assert.equal(stack.length, 0, 'unclosed block');
  return blocks;
}

test('the shipped library passes every offline check', () => {
  const { errors } = validate(lib);
  assert.deepEqual(errors, []);
  assert.ok(lib.palettes.length >= 24 && lib.type.length >= 20 && lib.shape.length >= 8 && lib.signature.length >= 30);
});

test('the validator catches contrast, gamut, tag, id and font-quota failures', () => {
  const bad = clone();
  bad.palettes[0].light.text = bad.palettes[0].light.background;
  bad.palettes[1].dark.accent = 'oklch(0.7 0.4 150)';
  bad.palettes[2].tags.push('vaporwave');
  bad.shape[1].id = bad.shape[0].id;
  bad.type[1].text.family = 'Roboto';
  bad.type[1].css += '&family=Roboto';
  const { errors } = validate(bad);
  const has = (re) => assert.ok(errors.some((e) => re.test(e)), `expected ${re} in\n${errors.join('\n')}`);
  has(new RegExp(`palettes ${bad.palettes[0].id}: light: text on background`));
  has(new RegExp(`palettes ${bad.palettes[1].id}: dark: accent .* outside the sRGB gamut`));
  has(/unknown tag vaporwave/);
  has(/duplicate id/);
  has(/at most one pairing may/);
});

test('the validator catches chart, tint, surface and clash failures', () => {
  const bad = clone();
  const p = bad.palettes.find((x) => x.id === 'P27');
  p.dark['chart-2'] = p.dark['chart-1'];
  p.light['chart-3'] = 'oklch(0.6 0.02 140)';
  p.light['chart-4'] = 'oklch(0.46 0.12 90)';
  p.dark['text-muted'] = 'oklch(0.6 0.004 260)';
  const q = bad.palettes.find((x) => x.id === 'P01');
  q.light['text-muted'] = q.light.text.replace(/oklch\(([\d.]+)/, (m, l) => `oklch(${(+l + 0.05).toFixed(3)}`);
  bad.signature[0].surfaces = ['billboard'];
  bad.type[0].clashes = ['S99'];
  const { errors } = validate(bad);
  const has = (re) => assert.ok(errors.some((e) => re.test(e)), `expected ${re} in\n${errors.join('\n')}`);
  has(/P27: dark: chart-1 and chart-2 are .* under (normal|protanopia|deuteranopia)/);
  has(/P27: light: chart-3 chroma .* reads as grey/);
  has(/P27: light: chart-4 .* reads as brown or olive/);
  has(/P27: dark: text-muted on hover on surface-raised/);
  has(/P01: light: text and text-muted differ by 0\.050 lightness, need 0\.12/);
  has(/unknown surface billboard/);
  has(/clashes with unknown id S99/);
});

test('the dealer deals distinct candidates on every axis', () => {
  const cs = candidates(run(['coffee roaster shop', '--register', 'marketing', '--count', '3']));
  assert.equal(cs.length, 3);
  for (const axis of ['P', 'T', 'S']) assert.equal(new Set(cs.map((c) => c[axis])).size, 3, `${axis} repeated`);
  assert.equal(new Set(cs.flatMap((c) => c.G)).size, 6, 'signature repeated');
});

test('--seed reproduces a hand and different seeds differ', () => {
  const args = ['invoicing for freelance designers', '--register', 'product', '--seed'];
  assert.equal(run([...args, '42']), run([...args, '42']));
  assert.notEqual(run([...args, '42']), run([...args, '43']));
});

test('unseeded runs in one project avoid the previous hand', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'finesse-history-'));
  const first = candidates(run(['a calm clinic booking site', '--register', 'marketing'], cwd));
  const second = candidates(run(['a calm clinic booking site', '--register', 'marketing'], cwd));
  const firstPalettes = new Set(first.map((c) => c.P));
  const firstTypes = new Set(first.map((c) => c.T));
  assert.ok(second.every((c) => !firstPalettes.has(c.P) && !firstTypes.has(c.T)), 'second run repeated a palette or type');
  assert.ok(JSON.parse(readFileSync(join(cwd, '.finesse', 'history.json'), 'utf8')).runs.length === 2);
});

test('the dealer still works in a read-only project', { skip: process.getuid?.() === 0 }, () => {
  const cwd = mkdtempSync(join(tmpdir(), 'finesse-ro-'));
  chmodSync(cwd, 0o555);
  try {
    assert.equal(candidates(run(['a record shop', '--register', 'marketing'], cwd)).length, 3);
  } finally {
    chmodSync(cwd, 0o755);
    rmSync(cwd, { recursive: true });
  }
});

test('--avoid excludes ids and --register filters every axis', () => {
  const base = candidates(run(['bakery', '--register', 'product', '--seed', '9']));
  const avoid = base.flatMap((c) => [c.P, c.T]).join(',');
  const next = candidates(run(['bakery', '--register', 'product', '--seed', '9', '--avoid', avoid]));
  const avoided = new Set(avoid.split(','));
  assert.ok(next.every((c) => !avoided.has(c.P) && !avoided.has(c.T)));
  for (const c of [...base, ...next]) {
    for (const id of [c.P, c.T, c.S, ...c.G]) assert.ok(byId[id].registers.includes('product'), `${id} is not a product entry`);
  }
});

test('a dashboard brief deals only product entries placed on a dashboard', () => {
  for (const seed of [1, 2, 3, 4, 5]) {
    const out = run(['Admin analytics for a food delivery fleet', '--seed', String(seed)]);
    assert.match(out, /^Register: product \(inferred from dashboard\)/m);
    assert.match(out, /^Surfaces: dashboard \(from the brief\)/m);
    for (const c of candidates(out)) {
      for (const id of [c.P, c.T, c.S, ...c.G]) {
        assert.ok(byId[id].registers.includes('product') && byId[id].surfaces.includes('dashboard'), `${id} dealt for a dashboard`);
      }
      assert.ok(byId[c.T].tabular, `${c.T} lacks tabular figures`);
    }
  }
});

test('--surface overrides the brief and marketing keeps editorial range', () => {
  const out = run(['a reading app', '--register', 'product', '--surface', 'article', '--seed', '3']);
  assert.match(out, /^Surfaces: article \(--surface\)/m);
  for (const c of candidates(out)) assert.ok(byId[c.T].surfaces.includes('article'));
  const serifs = lib.type.filter((t) => t.surfaces.includes('dashboard') && /serif|Didone|slab/i.test(t.classification));
  assert.deepEqual(serifs.map((t) => t.id), [], 'a serif pairing is placed on dashboards');
  const marketing = new Set();
  for (const seed of [1, 2, 3, 4, 5, 6]) candidates(run(['a launch page for a bakery', '--register', 'marketing', '--seed', String(seed)])).forEach((c) => marketing.add(c.T));
  assert.ok([...marketing].some((id) => /serif|Didone|slab|display/i.test(byId[id].classification)), 'marketing lost its display faces');
});

test('tags match whole words, and negated phrases count for nothing', () => {
  assert.deepEqual([...understand('booking for a barbershop and a career coach').tags], []);
  assert.ok(understand('a bar and a cafe').tags.has('food'));
  assert.ok(!understand('a sidebar and a top bar with a progress bar').tags.has('food'));
  assert.ok(understand('invoices for freelancers').tags.has('finance'), 'plural of a keyword');
  const surf = understand('Landing page for a tide and swell forecasting app for surfers and sailors. I have no photos.');
  assert.ok(!surf.tags.has('creative'), 'no photos must not tag creative');
  assert.ok(surf.negated.has('photo'));
  assert.ok(surf.tags.has('outdoor'));
  assert.deepEqual([...surf.surfaces], ['landing']);
  for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
    const out = run(['Landing page for a surf school. I have no photos.', '--register', 'marketing', '--seed', String(seed)]);
    for (const c of candidates(out)) for (const g of c.G) assert.ok(!(byId[g].needs || []).includes('photo'), `${g} needs photos`);
  }
});

test('no candidate pairs entries the library marks as clashing', () => {
  const pairs = Object.values(byId).flatMap((e) => (e.clashes || []).map((c) => [e.id, c]));
  assert.ok(pairs.length >= 10, 'the library declares clashes');
  for (const [brief, register] of [['a friendly app for kids learning to read', 'product'], ['a gentle poster for a festival', 'marketing']]) {
    for (let seed = 1; seed <= 30; seed++) {
      const { candidates: cs } = deal({ brief, register, seed });
      for (const c of cs) {
        const ids = [c.palette, c.type, c.shape, ...c.signatures].map((e) => e.id);
        for (const [a, b] of pairs) assert.ok(!(ids.includes(a) && ids.includes(b)), `${c.id} pairs ${a} with ${b}`);
      }
    }
  }
  const out = run(['--explain', 'P27-T08-S01-G37-G48', 'an analytics dashboard', '--register', 'product']);
  assert.match(out, /T08 .*: not eligible[\s\S]*clashes +with S01/);
  assert.match(out, /G37 .*: not eligible[\s\S]*clashes +with G48/);
  assert.match(out, /P27 .*: eligible, weight \d+/);
});

test('--emit prints parseable CSS with every role in light and both dark blocks', () => {
  const tokens = readFileSync(join(skill, 'assets', 'tokens.css'), 'utf8');
  const p = lib.palettes[3];
  const t = lib.type[5];
  const s = lib.shape[2];
  for (const format of ['css', 'tailwind']) {
    const css = run(['--emit', `${p.id}-${t.id}-${s.id}-G01-G02`, '--format', format]);
    assert.match(css, new RegExp(`@import url\\("${t.css.replace(/[.?+]/g, '\\$&')}"\\)`));
    const blocks = parseCss(css);
    const find = (sel) => blocks.find((b) => b.selector.replace(/\s+/g, ' ') === sel);
    const themes = { light: find(':root, [data-theme="light"]'), osDark: find(':root:not([data-theme="light"])'), dark: find('[data-theme="dark"]') };
    for (const [name, block] of Object.entries(themes)) {
      assert.ok(block, `${name} block missing`);
      for (const role of ROLES) {
        assert.ok(parseOklch(block.decls[`--${role}`]), `${name} --${role} missing or not oklch`);
        assert.ok(tokens.includes(`--${role}:`), `--${role} is not a tokens.css variable`);
      }
      for (const k of CHART) {
        assert.ok(parseOklch(block.decls[`--${k}`]), `${name} --${k} missing`);
        assert.ok(tokens.includes(`--${k}:`), `--${k} is not a tokens.css variable`);
      }
    }
    assert.deepEqual(themes.osDark.decls, themes.dark.decls, 'the two dark blocks differ');
    assert.ok(blocks.some((b) => b.selector === '@media (prefers-color-scheme: dark)'));
    const root = find(':root');
    for (const v of ['--family-display', '--family-sans', '--family-mono', '--r-control', '--r-card', '--r-modal']) {
      assert.ok(root.decls[v] && tokens.includes(`${v}:`), `${v} missing or unknown to tokens.css`);
    }
    for (const v of ['--fs-lg', '--fs-2xl', '--fs-h2', '--fs-h1', '--fs-display']) assert.ok(root.decls[v], `${v} missing from :root`);
    if (format === 'tailwind') assert.ok(find('@theme inline')?.decls['--color-chart-6']);
  }
});

test('--emit rejects an unknown id and --list prints every entry', () => {
  const bad = spawnSync(process.execPath, [DIRECT, '--emit', 'P99-T01-S01'], { encoding: 'utf8' });
  assert.notEqual(bad.status, 0);
  for (const axis of ['palettes', 'type', 'shape', 'signature']) {
    const out = run(['--list', axis]);
    assert.equal(out.split('\n').filter((l) => /^[PTSG]\d\d {2}/.test(l)).length, lib[axis].length, axis);
  }
});

test('--emit puts a dark-first palette on :root and answers OS light mode with its light theme', () => {
  const darkFirst = lib.palettes.find((p) => p.base === 'dark');
  const lightFirst = lib.palettes.find((p) => p.base === 'light');
  const blocksOf = (p) => {
    const blocks = parseCss(run(['--emit', `${p.id}-T01-S01`]));
    return (sel) => blocks.find((b) => b.selector.replace(/\s+/g, ' ') === sel);
  };
  const dark = blocksOf(darkFirst);
  assert.equal(dark(':root, [data-theme="dark"]')?.decls['--background'], darkFirst.dark.background);
  assert.equal(dark(':root:not([data-theme="dark"])')?.decls['--background'], darkFirst.light.background);
  assert.deepEqual(dark(':root:not([data-theme="dark"])').decls, dark('[data-theme="light"]').decls);
  assert.ok(dark('@media (prefers-color-scheme: light)'));
  const light = blocksOf(lightFirst);
  assert.equal(light(':root, [data-theme="light"]')?.decls['--background'], lightFirst.light.background);
  assert.ok(light('@media (prefers-color-scheme: dark)') && light('[data-theme="dark"]'));
});

test('the emitted token block pastes into tokens.css with every variable defined', () => {
  const tokens = readFileSync(join(skill, 'assets', 'tokens.css'), 'utf8');
  for (const id of ['P27-T28-S11-G37-G42', 'P01-T10-S07', 'P31-T33-S12-G43']) {
    const css = run(['--emit', id, '--register', 'product']);
    const mark = css.indexOf('/* 2. Tokens:');
    assert.ok(mark > 0, 'token section marker');
    const [fonts, block] = [css.slice(0, mark), css.slice(mark)];
    assert.match(fonts, /@import url\(/);
    assert.ok(!/^@import/m.test(block), 'the token block must not carry an @import rule');
    const start = tokens.indexOf('/* Light theme');
    const end = tokens.indexOf('/* Focus:');
    assert.ok(start > 0 && end > start, 'tokens.css theme region');
    const pasted = `${fonts}\n${tokens.slice(0, start)}${block}\n${tokens.slice(end)}`;
    parseCss(pasted);
    const defined = new Set([...pasted.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]));
    const used = new Set([...pasted.matchAll(/var\(\s*(--[\w-]+)/g)].map((m) => m[1]));
    assert.deepEqual([...used].filter((v) => !defined.has(v)), [], `${id}: undefined variables`);
    assert.ok(pasted.trimStart().startsWith('/* 1. Font import'), 'the import section leads the file');
  }
});

const LEDGERLINE = "Build the dashboard for Ledgerline, an invoicing app for freelancers. App shell with a sidebar and a top bar with search and a 'New invoice' action. The Overview page is the main thing: this month's income, outstanding and overdue amounts, average days to get paid, a cash flow chart of income against expenses over the last 12 months, where the money comes from by client, an ageing breakdown of unpaid invoices, recent invoices with status, and upcoming payments due this week. Dark and light.";

test('the validator keeps series off status colours, steps dashboard grounds and loads semibold', () => {
  const bad = clone();
  const p = bad.palettes.find((x) => x.id === 'P27');
  p.dark['chart-5'] = 'oklch(0.66 0.19 24)';
  p.light.surface = p.light['surface-raised'];
  const t = bad.type.find((x) => x.surfaces.includes('dashboard'));
  t.text.weights = [400, 500];
  bad.signature[0].requires = ['Plan Limit'];
  const { errors } = validate(bad);
  const has = (re) => assert.ok(errors.some((e) => re.test(e)), `expected ${re} in\n${errors.join('\n')}`);
  has(/P27: dark: chart-5 .* reads as danger/);
  has(/P27: light: a dashboard palette needs background, surface and surface-raised each 0\.02 lighter/);
  has(new RegExp(`type ${t.id}: a dashboard or table pairing loads 600`));
  has(/requires must list lower-case words/);
  const near = clone().palettes.find((x) => x.id === 'P27');
  near.dark['chart-5'] = 'oklch(0.86 0.19 24)';
  assert.ok(!validate({ ...clone(), palettes: clone().palettes.map((x) => (x.id === 'P27' ? near : x)) }).errors.some((e) => /chart-5 .* reads as danger/.test(e)), 'a 0.16 lightness gap clears the status rule');
});

test('the dealer reads theme words from the brief', () => {
  assert.equal(understand('a monitoring console, dark by nature').theme, 'dark');
  assert.equal(understand('a night shift rota').theme, 'dark');
  assert.equal(understand('a bright, airy booking page').theme, 'light');
  assert.equal(understand('Dark and light.').theme, 'both');
  assert.equal(understand('no dark mode please').theme, null);
  for (const [brief, base] of [['analytics dashboard, dark by nature', 'dark'], ['a light, airy analytics dashboard', 'light']]) {
    for (const seed of [1, 2, 3, 4, 5]) {
      const out = run([brief, '--seed', String(seed)]);
      assert.match(out, new RegExp(`^Theme: ${base} named`, 'm'));
      const fit = lib.palettes.filter((x) => x.base === base && x.registers.includes('product') && x.surfaces.includes('dashboard')).length;
      const got = candidates(out).filter((c) => byId[c.P].base === base).length;
      assert.equal(got, Math.min(3, fit), `"${brief}" dealt ${got} ${base}-first palettes of ${fit} that fit`);
    }
  }
  assert.match(run([LEDGERLINE, '--seed', '1']), /^Theme: dark and light both named/m);
});

test('an invoicing dashboard deals product palettes and clean tabular type', () => {
  const found = understand(LEDGERLINE);
  assert.ok(!found.tags.has('food'), 'a top bar is not a bar');
  assert.ok(found.tags.has('finance'));
  for (let seed = 1; seed <= 20; seed++) {
    for (const c of candidates(run([LEDGERLINE, '--seed', String(seed)]))) {
      assert.ok(byId[c.P].surfaces.includes('dashboard'), `${c.P} is not a dashboard palette`);
      assert.ok(byId[c.T].surfaces.includes('dashboard') && byId[c.T].tabular, `${c.T} dealt for a dashboard`);
      assert.ok(!c.G.includes('G40'), 'G40 needs a plan limit the brief does not give');
    }
  }
  assert.match(run(['--explain', 'P26-G40', LEDGERLINE]), /P26 .*: not eligible[\s\S]*dashboard +not placed on dashboards[\s\S]*G40 .*: not eligible[\s\S]*requires/);
  assert.match(run(['--explain', 'G40', 'a usage dashboard that shows each plan limit']), /G40 .*: eligible/);
});

test('--avoid takes every axis and rejects unknown ids; --emit gives semibold its real weight', () => {
  const base = candidates(run(['analytics dashboard', '--seed', '4']));
  const avoid = base.flatMap((c) => [c.S, ...c.G]).join(',');
  const next = candidates(run(['analytics dashboard', '--seed', '4', '--avoid', avoid]));
  const avoided = new Set(avoid.split(','));
  assert.ok(next.every((c) => !avoided.has(c.S) && c.G.every((g) => !avoided.has(g))));
  assert.notEqual(spawnSync(process.execPath, [DIRECT, 'dashboard', '--avoid', 'X99'], { encoding: 'utf8' }).status, 0);
  const t = lib.type.find((x) => x.surfaces.includes('dashboard'));
  const root = parseCss(run(['--emit', `P27-${t.id}-S01`])).find((b) => b.selector === ':root');
  assert.equal(root.decls['--fw-semibold'], '600');
  assert.equal(root.decls['--fw-medium'], '500');
});
