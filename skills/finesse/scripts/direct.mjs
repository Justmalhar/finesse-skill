#!/usr/bin/env node
// The direction dealer. Deals candidate directions (palette, type, shape, two signatures) from
// assets/directions.json, explains why an id was eligible, and emits a token block for a chosen candidate.
// Zero dependencies, Node 18+.
//   node direct.mjs "<brief>" [--register marketing|product] [--surface dashboard,table] [--count 3] [--seed <n>] [--avoid P07,T12,S03,G40]
//   node direct.mjs --explain P27-T28-S11-G37-G42 "<brief>" [--register product] [--surface dashboard]
//   node direct.mjs --emit P07-T12-S03[-G04-G19] [--format css|tailwind] [--register product]
//   node direct.mjs --list palettes|type|shape|signature
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomInt } from 'node:crypto';
import { ROLES, CHART } from './validate-directions.mjs';

const LIB = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'directions.json'), 'utf8'));
const AXES = ['palettes', 'type', 'shape', 'signature'];
const AXIS_BY_PREFIX = { P: 'palettes', T: 'type', S: 'shape', G: 'signature' };
// Candidates in one run are spread across these properties, so three palettes are not three light restrained ones.
const SPREAD = { palettes: ['base', 'strategy'], type: ['classification'], shape: ['elevation', 'radius'], signature: [] };
const HISTORY_FILE = join(process.cwd(), '.finesse', 'history.json');
const HISTORY_AVOID_RUNS = 3;
const HISTORY_KEEP = 20;
const NEGATORS = new Set(['no', 'not', 'without', 'never', 'avoid', 'dont', 'skip', 'none', 'zero', 'nor']);
// ponytail: a negator reaches at most this many following words in its clause; a parser if briefs get subtler.
const NEGATION_REACH = 3;
const BY_ID = Object.fromEntries(AXES.flatMap((a) => LIB[a].map((e) => [e.id, e])));
// Theme words in a brief. Naming one theme deals only palettes whose base is that theme; naming both, or neither, leaves the base open.
const THEME_WORDS = { dark: ['dark', 'night', 'nighttime', 'dark mode', 'dark theme'], light: ['light', 'bright', 'airy', 'light mode', 'light theme'] };

function fail(message) {
  console.error(`direct: ${message}`);
  process.exit(1);
}

function parseArgs(argv) {
  const opts = { brief: [], count: 3, avoid: new Set() };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => (i + 1 < argv.length ? argv[++i] : fail(`${a} needs a value`));
    if (a === '--register') opts.register = next();
    else if (a === '--surface') opts.surface = next().split(',').map((s) => s.trim()).filter(Boolean);
    else if (a === '--count') opts.count = Number(next());
    else if (a === '--seed') opts.seed = Number(next());
    else if (a === '--avoid') next().split(',').map((s) => s.trim().toUpperCase()).filter(Boolean).forEach((id) => opts.avoid.add(id));
    else if (a === '--emit') opts.emit = next();
    else if (a === '--explain') opts.explain = next();
    else if (a === '--format') opts.format = next();
    else if (a === '--list') opts.list = next();
    else if (a === '--help' || a === '-h') opts.help = true;
    else if (a.startsWith('--')) fail(`unknown flag ${a}`);
    else opts.brief.push(a);
  }
  opts.brief = opts.brief.join(' ');
  if (opts.register && !LIB.registers.includes(opts.register)) fail(`--register must be ${LIB.registers.join(' or ')}`);
  for (const id of opts.avoid) if (!BY_ID[id]) fail(`--avoid: unknown id ${id}; pass palette, type, shape or signature ids such as P07,T12,S03,G40`);
  for (const s of opts.surface || []) if (!LIB.surfaces[s]) fail(`unknown surface ${s}; surfaces are ${Object.keys(LIB.surfaces).join(', ')}`);
  if (!Number.isInteger(opts.count) || opts.count < 1) fail('--count must be a positive integer');
  if (opts.seed !== undefined && !Number.isFinite(opts.seed)) fail('--seed must be a number');
  return opts;
}

function makeRandom(seed) {
  if (seed === undefined) return () => randomInt(2 ** 32) / 2 ** 32;
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 2 ** 32;
  };
}

// Words of the brief, each marked when a negator ("no photos", "without a hero") reaches it.
function readBrief(brief) {
  const words = [];
  for (const clause of brief.toLowerCase().replace(/['’]/g, '').split(/[.,;:!?()]|\bbut\b|\band\b/)) {
    let reach = 0;
    for (const w of clause.split(/[^a-z0-9]+/).filter(Boolean)) {
      if (NEGATORS.has(w)) { reach = NEGATION_REACH; words.push({ w, negated: true }); continue; }
      words.push({ w, negated: reach > 0 });
      reach = Math.max(0, reach - 1);
    }
    words.push(null); // a clause break: phrases never match across it
  }
  return words;
}

const sameWord = (w, k) => w === k || w === `${k}s` || w === `${k}es`;

// Keys of a {name: [keywords]} map whose whole-word keyword appears un-negated, plus the negated hits.
function matchKeywords(words, map) {
  const hits = new Set();
  const negated = new Set();
  for (const [name, keywords] of Object.entries(map)) {
    for (const kw of keywords) {
      const parts = kw.split(' ');
      for (let i = 0; i + parts.length <= words.length; i++) {
        const span = words.slice(i, i + parts.length);
        if (span.some((x) => !x) || !span.every((x, j) => (j === parts.length - 1 ? sameWord(x.w, parts[j]) : x.w === parts[j]))) continue;
        if (span.some((x) => x.negated)) negated.add(kw); else hits.add(name);
      }
    }
  }
  return { hits, negated };
}

export function understand(brief) {
  const words = readBrief(brief);
  const tags = matchKeywords(words, LIB.tags);
  const surfaces = matchKeywords(words, Object.fromEntries(Object.entries(LIB.surfaces).map(([k, v]) => [k, v.keywords])));
  const themes = matchKeywords(words, THEME_WORDS).hits;
  const theme = themes.size === 1 ? [...themes][0] : themes.size ? 'both' : null;
  return { words, tags: tags.hits, surfaces: surfaces.hits, theme, negated: new Set([...tags.negated, ...surfaces.negated]) };
}

export function matchTags(brief) {
  return understand(brief).tags;
}

// Register and surfaces for a deal: the flags win, then the brief, then the register's defaults.
export function placement({ brief = '', register, surface }) {
  const found = understand(brief);
  let reg = register;
  let source = 'given';
  const named = surface || [...found.surfaces];
  if (!reg) {
    const common = LIB.registers.filter((r) => named.length && named.every((s) => LIB.surfaces[s].registers.includes(r)));
    if (common.length !== 1) return { ...found, register: null, surfaces: named };
    [reg, source] = [common[0], `inferred from ${named.join(', ')}`];
  }
  let surfaces = named.filter((s) => LIB.surfaces[s].registers.includes(reg));
  let surfaceSource = surface ? '--surface' : 'from the brief';
  if (!surfaces.length) [surfaces, surfaceSource] = [LIB.default_surfaces[reg], `default for ${reg}`];
  return { ...found, register: reg, registerSource: source, surfaces, surfaceSource };
}

const clashes = (a, b) => (a.clashes || []).includes(b.id) || (b.clashes || []).includes(a.id);

// Why an entry can or cannot be dealt in this placement. eligible is the single rule for every axis.
export function eligibility(entry, { register, surfaces, tags, negated = new Set(), words = [], theme = null }) {
  const surfaceHits = entry.surfaces.filter((s) => surfaces.includes(s));
  const tagHits = entry.tags.filter((t) => tags.has(t));
  const registerOk = entry.registers.includes(register);
  const ruledOut = (entry.needs || []).filter((n) => negated.has(n));
  // A signature that shows a fact a brief must supply (a plan limit) is dealt only when the brief names it.
  const missing = entry.requires && !matchKeywords(words, { r: entry.requires }).hits.size ? entry.requires : [];
  // On a dashboard, a palette must be placed there unless a brief tag calls for it, and type always must (tabular figures).
  const isPalette = 'base' in entry;
  const offDashboard = surfaces.includes('dashboard') && !entry.surfaces.includes('dashboard') && (isPalette ? !tagHits.length : 'tabular' in entry);
  const themeOk = !isPalette || !['dark', 'light'].includes(theme) || entry.base === theme;
  return { eligible: registerOk && surfaceHits.length > 0 && !ruledOut.length && !missing.length && !offDashboard, registerOk, surfaceHits, tagHits, ruledOut, missing, offDashboard, themeOk, weight: (1 + 4 * tagHits.length) * (1 + 2 * surfaceHits.length) };
}

// Weighted draw of one entry: brief matches and surface matches weigh more, kinds already dealt weigh less.
function drawOne(axis, rand, ctx, { taken, partners, recent }) {
  const open = (c) => LIB[axis].filter((e) => !c.avoid.has(e.id) && !taken.has(e.id) && eligibility(e, c).eligible && !partners.some((p) => clashes(e, p)));
  let pool = open(ctx);
  // A theme named in the brief keeps palettes of the other base out while any of its own are left.
  const themed = pool.filter((e) => eligibility(e, ctx).themeOk);
  if (themed.length) pool = themed;
  else if (pool.length && axis === 'palettes' && ['dark', 'light'].includes(ctx.theme)) ctx.themeShort = true;
  if (!pool.length) {
    // A rare surface (a reading view inside an app) can run out; the register's defaults fill in, and the header says so.
    ctx.widened.add(axis);
    pool = open({ ...ctx, surfaces: [...new Set([...ctx.surfaces, ...LIB.default_surfaces[ctx.register]])] });
  }
  const fresh = pool.filter((e) => !recent.has(e.id));
  if (fresh.length) pool = fresh;
  if (!pool.length) fail(`no ${axis} entry fits register ${ctx.register} and surfaces ${ctx.surfaces.join(', ')} after --avoid and clashes; widen --surface or drop an --avoid id`);
  const dealt = [...taken].map((id) => BY_ID[id]);
  const weights = pool.map((e) => eligibility(e, ctx).weight * 0.35 ** SPREAD[axis].filter((k) => dealt.some((p) => p[k] === e[k])).length);
  let r = rand() * weights.reduce((a, b) => a + b, 0);
  let i = 0;
  while (i < pool.length - 1 && (r -= weights[i]) > 0) i++;
  taken.add(pool[i].id);
  return pool[i];
}

export function deal({ brief = '', register, surface, count = 3, seed, avoid = new Set() }) {
  const place = placement({ brief, register, surface });
  if (!place.register) fail('could not tell the register from the brief; pass --register marketing|product');
  const rand = makeRandom(seed);
  // A seeded run ignores history so the same seed always deals the same hand.
  const history = seed === undefined ? readHistory() : { runs: [] };
  const recent = new Set(history.runs.slice(-HISTORY_AVOID_RUNS).flatMap((r) => [...(r.palettes || []), ...(r.type || [])]));
  const ctx = { ...place, avoid, widened: new Set() };
  const taken = Object.fromEntries(AXES.map((a) => [a, new Set()]));
  const candidates = [];
  for (let n = 0; n < count; n++) {
    const picked = [];
    const one = (axis, noRecent) => {
      const e = drawOne(axis, rand, ctx, { taken: taken[axis], partners: picked, recent: noRecent ? new Set() : recent });
      picked.push(e);
      return e;
    };
    const palette = one('palettes');
    const type = one('type');
    const shape = one('shape', true);
    const signatures = [one('signature', true), one('signature', true)];
    candidates.push({ id: picked.map((e) => e.id).join('-'), palette, type, shape, signatures });
  }
  return { ...place, widened: ctx.widened, themeShort: !!ctx.themeShort, candidates };
}

function readHistory() {
  try {
    const h = JSON.parse(readFileSync(HISTORY_FILE, 'utf8'));
    return Array.isArray(h.runs) ? h : { runs: [] };
  } catch {
    return { runs: [] };
  }
}

function writeHistory(history) {
  try {
    mkdirSync(dirname(HISTORY_FILE), { recursive: true });
    writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2) + '\n');
  } catch {
    // ponytail: read-only project or sandbox; the dealer still works, it just cannot avoid recent repeats.
  }
}

function reasons(entry, ctx) {
  const { surfaceHits, tagHits } = eligibility(entry, ctx);
  return `  [${[...surfaceHits, ...tagHits].join(', ')}]`;
}

function header(place) {
  return [
    `Register: ${place.register} (${place.registerSource})`,
    `Surfaces: ${place.surfaces.join(', ')} (${place.surfaceSource})`,
    `Brief tags: ${place.tags.size ? [...place.tags].join(', ') : 'none matched; weighting by surface only'}`,
    `Theme: ${{ dark: 'dark named; palettes are dark-first', light: 'light named; palettes are light-first', both: 'dark and light both named; either base' }[place.theme] || 'none named; either base'}${place.themeShort ? `, until no ${place.theme}-first palette fits these surfaces` : ''}`,
    ...(place.negated.size ? [`Ignored as negated: ${[...place.negated].join(', ')}`] : []),
  ];
}

function printDeal(opts) {
  const result = deal(opts);
  const history = readHistory();
  history.runs.push({ at: new Date().toISOString(), palettes: result.candidates.map((c) => c.palette.id), type: result.candidates.map((c) => c.type.id) });
  history.runs = history.runs.slice(-HISTORY_KEEP);
  writeHistory(history);
  const out = [...header(result), ...(result.widened.size ? [`Widened to ${LIB.default_surfaces[result.register].join(', ')} for: ${[...result.widened].join(', ')} (too few entries on ${result.surfaces.join(', ')})`] : []), ''];
  result.candidates.forEach((c, n) => {
    const { palette: p, type: t, shape: s } = c;
    out.push(`${n + 1}. ${c.id}`);
    out.push(`   palette    ${p.id} ${p.name} (${p.base}-first, ${p.strategy}): ${p.character}${reasons(p, result)}`);
    out.push(`   type       ${t.id} ${t.name} (${t.classification}${t.tabular ? ', tabular figures' : ''}): ${t.character}${reasons(t, result)}`);
    out.push(`   shape      ${s.id} ${s.name} (${s.radius} radius, ${s.elevation}, ${s.density}): ${s.character}${reasons(s, result)}`);
    for (const g of c.signatures) out.push(`   signature  ${g.id} ${g.name}: ${g.what}${reasons(g, result)}`);
    out.push('');
  });
  out.push(`Pick one, then: node <skill dir>/scripts/direct.mjs --emit <id> --register ${result.register} [--format tailwind]`);
  console.log(out.join('\n'));
}

function find(id) {
  const axis = AXIS_BY_PREFIX[id[0]];
  const entry = axis && LIB[axis].find((e) => e.id === id);
  return entry || fail(`unknown id ${id}`);
}

export function explain(id, opts) {
  const place = placement(opts);
  if (!place.register) fail('could not tell the register from the brief; pass --register marketing|product');
  const entries = id.toUpperCase().split('-').filter(Boolean).map(find);
  const out = [...header(place), ''];
  for (const e of entries) {
    const r = eligibility(e, place);
    const clash = entries.filter((o) => o !== e && clashes(e, o)).map((o) => o.id);
    const ok = r.eligible && !clash.length;
    out.push(`${e.id} ${e.name}: ${ok ? `eligible, weight ${r.weight}` : 'not eligible'}`);
    out.push(`   register   ${r.registerOk ? 'yes' : 'no'}: lists ${e.registers.join(', ')}`);
    out.push(`   surfaces   ${r.surfaceHits.length ? r.surfaceHits.join(', ') : 'none'} of ${place.surfaces.join(', ')} (lists ${e.surfaces.join(', ')})`);
    out.push(`   tags       ${r.tagHits.length ? r.tagHits.join(', ') : 'none'} matched (lists ${e.tags.join(', ')})`);
    out.push(`   clashes    ${clash.length ? `with ${clash.join(', ')}` : 'none in this id'}`);
    if (e.needs) out.push(`   needs      ${e.needs.join(', ')}${r.ruledOut.length ? ', which the brief rules out' : ''}`);
    if (e.requires) out.push(`   requires   one of ${e.requires.join(', ')}${r.missing.length ? ', which the brief does not name' : ''}`);
    if (r.offDashboard) out.push(`   dashboard  not placed on dashboards${'tabular' in e ? ', so its figures are not checked for tables' : ', and no brief tag calls for it'}`);
    if (!r.themeOk) out.push(`   theme      ${e.base}-first, but the brief names ${place.theme}`);
  }
  return out.join('\n');
}

function block(selector, vars, indent = '  ') {
  return `${selector} {\n${Object.entries(vars).map(([k, v]) => `${indent}${k}: ${v};`).join('\n')}\n}`;
}

function themeVars(palette, shape, mode) {
  const vars = { 'color-scheme': mode };
  for (const role of [...ROLES, ...CHART]) vars[`--${role}`] = palette[mode][role];
  vars['--shadow-color'] = mode === 'light' ? palette.light.text : 'oklch(0.1 0 0)';
  Object.assign(vars, shape[mode]);
  return vars;
}

const fontStack = (f) => `"${f.family}", ${f.fallback}`;
const rem = (n) => `${+n.toFixed(3)}rem`;

// Heading steps continue the pairing's ratio; each is fluid from 390 px to 1600 px wide, two steps smaller on phones.
function fluid(max, ratio) {
  const min = max / ratio ** 2;
  const slope = ((max - min) * 16) / (1600 - 390);
  return `clamp(${rem(min)}, ${rem(min - (slope * 390) / 16)} + ${+(slope * 100).toFixed(3)}vw, ${rem(max)})`;
}

export function typeScale(ratio) {
  return {
    '--fs-xs': '0.75rem',
    '--fs-sm': '0.875rem',
    '--fs-base': '1rem',
    '--fs-lg': rem(ratio),
    '--fs-xl': rem(ratio ** 2),
    '--fs-2xl': rem(ratio ** 3),
    '--fs-h2': fluid(ratio ** 4, ratio),
    '--fs-h1': fluid(ratio ** 5, ratio),
    '--fs-display': fluid(Math.min(6, ratio ** 7), ratio),
  };
}

export const TOKEN_MARK = '/* 2. Tokens:';

export function emit(id, format = 'css', register) {
  const parts = id.toUpperCase().split('-').filter(Boolean);
  const ids = Object.fromEntries(['P', 'T', 'S'].map((k) => [k, parts.find((x) => x[0] === k)]));
  for (const [k, v] of Object.entries(ids)) if (!v) fail(`--emit needs a ${AXIS_BY_PREFIX[k]} id (${k}01) in ${id}`);
  const palette = find(ids.P);
  const type = find(ids.T);
  const shape = find(ids.S);
  const signatures = parts.filter((x) => x[0] === 'G').map(find);
  const reg = register && type.ratio[register] ? register : Object.keys(type.ratio)[0];
  const ratio = type.ratio[reg];
  const textWeights = type.text.weights;
  const hue = Number(/oklch\([\d.]+ [\d.]+ ([\d.]+)/.exec(palette.light.accent)[1]);
  const safe = (m) => (palette.accent_text_safe[m] ? 'yes' : 'no, links use --text with an --accent underline');

  const comment = [
    `finesse direction ${parts.join('-')}`,
    `Palette ${palette.id} ${palette.name}: ${palette.character}`,
    `Type ${type.id} ${type.name}: ${type.character}`,
    `Shape ${shape.id} ${shape.name}: ${shape.character}`,
    ...signatures.map((g) => `Signature ${g.id} ${g.name}: ${g.what} Surfaces: ${g.surfaces.join(', ')}. Build: ${g.build}`),
    `Accent as text on light: ${safe('light')}. On dark: ${safe('dark')}.`,
    'Charts: assign by meaning (references/dashboards.md): --chart-1 to the lead measure, one colour per series across charts. Neighbours stay apart for common colour-vision deficiencies and clear of the status colours.',
    `Scale ratio ${ratio} (${reg}). Fonts: ${type.source}, ${type.license}. To load from <head> instead of @import:`,
    '<link rel="preconnect" href="https://fonts.googleapis.com">',
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
    `<link rel="stylesheet" href="${type.css}">`,
    'Self-host or use next/font in production; keep font-display: swap.',
  ];
  const root = {
    '--brand-hue': hue,
    '--family-display': fontStack(type.display),
    '--family-sans': fontStack(type.text),
    '--family-mono': type.mono ? fontStack(type.mono) : 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
    '--fw-regular': textWeights[0],
    '--fw-medium': textWeights.find((w) => w >= 500 && w < 600) ?? textWeights[textWeights.length - 1],
    '--fw-semibold': textWeights.find((w) => w >= 600) ?? textWeights[textWeights.length - 1],
    '--fw-display': type.display.weights[0],
    '--ls-display': `${type.tracking}em`,
    ...typeScale(ratio),
    ...shape.tokens,
    '--r-pill': '9999px',
  };
  // The palette's base theme sits on :root; the other theme answers the OS preference and its [data-theme] override.
  const first = palette.base === 'dark' ? 'dark' : 'light';
  const second = first === 'dark' ? 'light' : 'dark';
  const other = themeVars(palette, shape, second);
  if (first === 'dark') comment.push('Dark-first palette: dark is the default. For a dark-only brief set data-theme="dark" on <html> so OS light mode never switches it.');
  const where = format === 'tailwind' ? ', above @import "tailwindcss"' : '';
  const css = [
    `/* 1. Font import: put this line first in the stylesheet${where}. CSS ignores an @import after any other rule. */\n@import url("${type.css}");`,
    `${TOKEN_MARK} paste everything below over the theme blocks of assets/tokens.css (after its :root block). */`,
    `/*\n  ${comment.join('\n  ')}\n*/`,
    block(':root', root),
    block(`:root,\n[data-theme="${first}"]`, themeVars(palette, shape, first)),
    `@media (prefers-color-scheme: ${second}) {\n  ${block(`:root:not([data-theme="${first}"])`, other, '    ').replace(/\n}$/, '\n  }')}\n}`,
    block(`[data-theme="${second}"]`, other),
  ];
  if (format === 'tailwind') {
    const theme = {
      ...Object.fromEntries([...ROLES, ...CHART].map((r) => [`--color-${{ text: 'fg', 'text-muted': 'muted' }[r] || r}`, `var(--${r})`])),
      '--font-sans': 'var(--family-sans)', '--font-display': 'var(--family-display)', '--font-mono': 'var(--family-mono)',
      ...Object.fromEntries(Object.keys(typeScale(ratio)).map((k) => [k.replace('--fs-', '--text-'), `var(${k})`])),
      '--radius-control': 'var(--r-control)', '--radius-card': 'var(--r-card)', '--radius-modal': 'var(--r-modal)',
      '--shadow-1': 'var(--elevation-1)', '--shadow-2': 'var(--elevation-2)', '--shadow-3': 'var(--elevation-3)',
    };
    css.push(block('@theme inline', theme), '@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));');
  } else if (format !== 'css') fail('--format must be css or tailwind');
  return css.join('\n\n') + '\n';
}

function list(axis) {
  const key = { palette: 'palettes', palettes: 'palettes', type: 'type', shape: 'shape', shapes: 'shape', signature: 'signature', signatures: 'signature' }[axis];
  if (!key) fail('--list takes palettes, type, shape or signature');
  for (const e of LIB[key]) {
    const extra = key === 'palettes' ? ` (${e.base}-first, ${e.strategy})` : key === 'type' ? ` (${e.classification})` : key === 'shape' ? ` (${e.radius}, ${e.elevation}, ${e.density})` : '';
    console.log(`${e.id}  ${e.name}${extra}  [${e.registers.join(', ')}; ${e.surfaces.join(', ')}; ${e.tags.join(', ')}]\n     ${e.character || e.what}`);
  }
}

function main(argv) {
  const opts = parseArgs(argv);
  if (opts.help || !argv.length) {
    console.log(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(3, 8).map((l) => l.replace(/^\/\/ ?/, '')).join('\n'));
    return;
  }
  if (opts.list) return list(opts.list);
  if (opts.emit) return process.stdout.write(emit(opts.emit, opts.format, opts.register));
  if (opts.explain) return console.log(explain(opts.explain, opts));
  printDeal(opts);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main(process.argv.slice(2));
