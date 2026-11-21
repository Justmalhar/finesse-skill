#!/usr/bin/env node
// Validates assets/directions.json: contrast floors (on the three surfaces and on the derived tints the craft recipes
// use), a lightness step between text and text-muted, sRGB gamut, chart series (contrast, chroma, hue order, colour-vision-deficiency separation), unique ids,
// registers, surfaces, tags and clashes. --fonts also fetches every font stylesheet and checks tabular figures.
// Usage: node validate-directions.mjs [--fonts] [--json] [path/to/directions.json]
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const DEFAULT_PATH = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'directions.json');
export const ROLES = ['background', 'surface', 'surface-raised', 'border', 'border-strong', 'text', 'text-muted', 'accent', 'accent-text', 'danger', 'success', 'warning', 'focus'];
export const CHART = ['chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5', 'chart-6'];
const SURFACES = ['background', 'surface', 'surface-raised'];
// [foreground role, roles it must contrast with, minimum WCAG 2 ratio]
export const FLOORS = [
  ['text', SURFACES, 4.5],
  ['text-muted', SURFACES, 4.5],
  ['accent', SURFACES, 3],
  ['accent-text', ['accent'], 4.5],
  ['border-strong', SURFACES, 3],
  ['focus', SURFACES, 3],
  ['danger', SURFACES, 4.5],
  ['success', SURFACES, 4.5],
  ['warning', SURFACES, 4.5],
];
// Chart series. Metric: Euclidean distance in OKLab (deltaE OK, where about 0.02 is one just-noticeable step), measured
// after simulating protanopia and deuteranopia (Machado, Oliveira and Fernandes 2009, severity 1) in linear sRGB.
export const CHART_RULES = {
  minContrast: 3, // against surface and surface-raised
  minChroma: 0.08, // below this a series reads as grey
  minNeighbourHue: 50, // degrees between chart-N and chart-N+1
  minNeighbourLightness: 0.04, // neighbours alternate lighter and darker by at least this
  minNeighbourDeltaE: 0.07, // deltaE OK between neighbours under normal vision, protanopia and deuteranopia
  minPairDeltaE: 0.07, // deltaE OK between any two series under normal vision: no near-duplicates
  maxAccentHue: 30, // chart-1 sits within this many degrees of a chromatic accent
  // A series this close in hue to danger, warning or success reads as that status. It may sit there only when it is
  // this much lighter or darker, which reads as a different colour at chart sizes.
  minStatusHue: 20,
  minStatusLightness: 0.15,
  // [from hue, to hue, minimum lightness]: below it, oranges turn brown and yellows and yellow-greens turn olive or mustard.
  muddy: [[35, 64, 0.58], [65, 135, 0.76]],
};
const MIN_COUNTS = { palettes: 24, type: 20, shape: 8, signature: 30 };
const PREFIX = { palettes: 'P', type: 'T', shape: 'S', signature: 'G' };
const AXIS_OF = { P: 'palettes', T: 'type', S: 'shape', G: 'signature' };
const RATIO_RANGE = { product: [1.125, 1.2], marketing: [1.25, 1.333] };
const RESTRICTED_FONTS = ['Inter', 'Roboto', 'Open Sans', 'Poppins', 'Montserrat'];
const SPACE_SCALE = [0, 4, 8, 12, 16, 24, 32, 48, 64, 96, 128];
const SHAPE_TOKENS = ['--r-control', '--r-card', '--r-modal', '--border-width', '--control-h', '--pad-card', '--gap-group'];
// Minimum counts of entries that can be dealt for a dashboard, so a product hand always has range.
const DASHBOARD_MIN = { palettes: 10, type: 8, signature: 12 };
// Muted text closer than this in OKLCH lightness to text reads as the same level, so the hierarchy is lost.
export const MIN_MUTED_STEP = 0.12;
// A dashboard stacks tiles on the page and popovers on tiles. In both themes each ground is at least this much lighter
// than the one below it, so a borderless stepped-fill shape still separates them.
export const MIN_GROUND_STEP = 0.02;

export function parseOklch(value) {
  const m = /^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*([\d.]+)\s*)?\)$/.exec(String(value).trim());
  if (!m) return null;
  return { l: +m[1], c: +m[2], h: +m[3], alpha: m[4] === undefined ? 1 : +m[4] };
}

const toLab = ({ l, c, h }) => [l, c * Math.cos((h * Math.PI) / 180), c * Math.sin((h * Math.PI) / 180)];
const fromLab = ([l, a, b], alpha = 1) => ({ l, c: Math.hypot(a, b), h: ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360, alpha });

export function toLinearRgb(col) {
  const [l, a, b] = toLab(col);
  const L = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const M = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const S = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * L - 3.3077115913 * M + 0.2309699292 * S,
    -1.2684380046 * L + 2.6097574011 * M - 0.3413193965 * S,
    -0.0041960863 * L - 0.7034186147 * M + 1.707614701 * S,
  ];
}

function linearToLab([r, g, b]) {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const encode = (v) => (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055);
const decode = (v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);

export function inGamut(col, eps = 5e-4) {
  return toLinearRgb(col).every((v) => v >= -eps && v <= 1 + eps);
}

export function luminance(col) {
  const [r, g, b] = toLinearRgb(col).map(clamp01);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a, b) {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

// color-mix(in oklab, a p, b): premultiplied interpolation, so mixing with transparent keeps a's colour at alpha p.
export function mixOklab(a, b, p) {
  const alpha = a.alpha * p + b.alpha * (1 - p);
  if (!alpha) return { l: 0, c: 0, h: 0, alpha: 0 };
  const [la, lb] = [toLab(a), toLab(b)];
  return fromLab(la.map((v, i) => (v * a.alpha * p + lb[i] * b.alpha * (1 - p)) / alpha), alpha);
}

// Paint a translucent colour over an opaque one, the way browsers composite: in gamma-encoded sRGB.
export function over(fg, bg) {
  const f = toLinearRgb(fg).map((v) => encode(clamp01(v)));
  const g = toLinearRgb(bg).map((v) => encode(clamp01(v)));
  return fromLab(linearToLab(f.map((v, i) => decode(v * fg.alpha + g[i] * (1 - fg.alpha)))));
}

const TRANSPARENT = { l: 0, c: 0, h: 0, alpha: 0 };
const BLACK = { l: 0, c: 0, h: 0, alpha: 1 };
const wash = (col, p) => mixOklab(col, TRANSPARENT, p);

// The tinted grounds the craft recipes put text on (assets/exemplars/base.css, references/craft.md): the hover wash
// (--wash, text at 6%), the selected row while hovered (accent at 17%, the strongest selected tint) and the sunken well.
export const DERIVED = {
  'hover on background': (t) => over(wash(t.text, 0.06), t.background),
  'hover on surface': (t) => over(wash(t.text, 0.06), t.surface),
  'hover on surface-raised': (t) => over(wash(t.text, 0.06), t['surface-raised']),
  'selected on background': (t) => over(wash(t.accent, 0.17), t.background),
  'selected on surface': (t) => over(wash(t.accent, 0.17), t.surface),
  'selected on surface-raised': (t) => over(wash(t.accent, 0.17), t['surface-raised']),
  well: (t, mode) => (mode === 'light' ? mixOklab(t.text, t.background, 0.05) : mixOklab(BLACK, t.background, 0.3)),
};
export const DERIVED_FLOORS = [['text', 4.5], ['text-muted', 4.5]];

// Machado, Oliveira and Fernandes (2009), severity 1, applied to linear sRGB.
const CVD = {
  protanopia: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
  deuteranopia: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.01182, 0.04294, 0.968881]],
};

export function labUnder(col, vision = 'normal') {
  const rgb = toLinearRgb(col).map(clamp01);
  const m = CVD[vision];
  return linearToLab(m ? m.map((row) => clamp01(row[0] * rgb[0] + row[1] * rgb[1] + row[2] * rgb[2])) : rgb);
}

export function deltaE(a, b, vision = 'normal') {
  const [x, y] = [labUnder(a, vision), labUnder(b, vision)];
  return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]);
}

export const hueGap = (a, b) => Math.min(Math.abs(a - b), 360 - Math.abs(a - b));
const VISIONS = ['normal', 'protanopia', 'deuteranopia'];

// Every rule a chart series breaks, as messages; the palette generator and the validator share it.
export function chartProblems(theme) {
  const out = [];
  const R = CHART_RULES;
  const cols = CHART.map((k) => parseOklch(theme[k]));
  if (cols.some((c) => !c)) return CHART.filter((k, i) => !cols[i]).map((k) => `${k} missing or not oklch`);
  const surf = ['surface', 'surface-raised'].map((s) => [s, parseOklch(theme[s])]);
  cols.forEach((c, i) => {
    const k = CHART[i];
    if (!inGamut(c)) out.push(`${k} ${theme[k]} is outside the sRGB gamut`);
    if (c.alpha !== 1) out.push(`${k} must be opaque`);
    if (c.c < R.minChroma) out.push(`${k} chroma ${c.c} is below ${R.minChroma}, reads as grey`);
    const mud = R.muddy.find(([a, b, l]) => c.h >= a && c.h <= b && c.l < l);
    if (mud) out.push(`${k} ${theme[k]} reads as brown or olive (hue ${mud[0]} to ${mud[1]} needs lightness ${mud[2]} or more)`);
    for (const [s, bg] of surf) {
      const ratio = contrast(c, bg);
      if (ratio < R.minContrast) out.push(`${k} on ${s} is ${ratio.toFixed(2)}:1, needs ${R.minContrast}:1`);
    }
    const next = cols[i + 1];
    if (!next) return;
    const pair = `${k} and ${CHART[i + 1]}`;
    if (hueGap(c.h, next.h) < R.minNeighbourHue) out.push(`${pair} are ${hueGap(c.h, next.h).toFixed(0)} degrees apart, need ${R.minNeighbourHue}`);
    if (Math.abs(c.l - next.l) < R.minNeighbourLightness) out.push(`${pair} differ by ${Math.abs(c.l - next.l).toFixed(3)} lightness, need ${R.minNeighbourLightness}`);
    const after = cols[i + 2];
    if (after && Math.sign(next.l - c.l) === Math.sign(after.l - next.l)) out.push(`${k} to ${CHART[i + 2]} do not alternate in lightness`);
    for (const v of VISIONS) {
      const d = deltaE(c, next, v);
      if (d < R.minNeighbourDeltaE) out.push(`${pair} are ${d.toFixed(3)} apart under ${v}, need ${R.minNeighbourDeltaE}`);
    }
  });
  for (let i = 0; i < 6; i++) {
    for (let j = i + 2; j < 6; j++) {
      const d = deltaE(cols[i], cols[j]);
      if (d < R.minPairDeltaE) out.push(`${CHART[i]} and ${CHART[j]} are ${d.toFixed(3)} apart, near duplicates`);
    }
  }
  for (const status of ['danger', 'warning', 'success']) {
    const st = parseOklch(theme[status]);
    if (!st) continue;
    cols.forEach((c, i) => {
      if (hueGap(c.h, st.h) < R.minStatusHue && Math.abs(c.l - st.l) < R.minStatusLightness) {
        out.push(`${CHART[i]} ${theme[CHART[i]]} reads as ${status} ${theme[status]}: ${hueGap(c.h, st.h).toFixed(0)} degrees apart, needs ${R.minStatusHue} or a lightness gap of ${R.minStatusLightness}`);
      }
    });
  }
  const acc = parseOklch(theme.accent);
  if (acc && acc.c >= 0.05 && hueGap(acc.h, cols[0].h) > R.maxAccentHue) out.push(`chart-1 hue ${cols[0].h} is more than ${R.maxAccentHue} degrees from the accent hue ${acc.h}`);
  return out;
}

// Every text floor a theme misses on its surfaces and on the derived tints.
export function contrastProblems(theme, mode) {
  const out = [];
  const col = Object.fromEntries(ROLES.map((r) => [r, parseOklch(theme[r])]));
  for (const [fg, bgs, min] of FLOORS) {
    for (const bg of bgs) {
      if (!col[fg] || !col[bg]) continue;
      const ratio = contrast(col[fg], col[bg]);
      if (ratio < min) out.push(`${fg} on ${bg} is ${ratio.toFixed(2)}:1, needs ${min}:1`);
    }
  }
  if (!ROLES.every((r) => col[r])) return out;
  for (const [name, derive] of Object.entries(DERIVED)) {
    const ground = derive(col, mode);
    for (const [fg, min] of DERIVED_FLOORS) {
      const ratio = contrast(col[fg], ground);
      if (ratio < min) out.push(`${fg} on ${name} is ${ratio.toFixed(2)}:1, needs ${min}:1`);
    }
  }
  return out;
}

// Minimum contrast of accent against the three surfaces; at 4.5 or more the accent may be used as link text.
export function accentTextSafe(theme) {
  const acc = parseOklch(theme.accent);
  return Math.min(...SURFACES.map((s) => contrast(acc, parseOklch(theme[s])))) >= 4.5;
}

function checkPalette(p, err, warn) {
  for (const mode of ['light', 'dark']) {
    const theme = p[mode];
    if (!theme) { err(`${mode} theme missing`); continue; }
    const keys = Object.keys(theme);
    const missing = [...ROLES, ...CHART].filter((r) => !keys.includes(r));
    const extra = keys.filter((k) => !ROLES.includes(k) && !CHART.includes(k));
    if (missing.length) err(`${mode}: missing roles ${missing.join(', ')}`);
    if (extra.length) err(`${mode}: unknown roles ${extra.join(', ')}`);
    const col = {};
    for (const role of ROLES) {
      if (!(role in theme)) continue;
      const parsed = parseOklch(theme[role]);
      if (!parsed) { err(`${mode}: ${role} is not oklch(L C H [/ A]): ${theme[role]}`); continue; }
      if (!inGamut(parsed)) err(`${mode}: ${role} ${theme[role]} is outside the sRGB gamut`);
      if (role !== 'border' && parsed.alpha !== 1) err(`${mode}: ${role} must be opaque`);
      col[role] = parsed;
    }
    for (const m of contrastProblems(theme, mode)) err(`${mode}: ${m}`);
    if (CHART.every((k) => k in theme)) for (const m of chartProblems(theme)) err(`${mode}: ${m}`);
    if (col.text && col['text-muted'] && Math.abs(col.text.l - col['text-muted'].l) < MIN_MUTED_STEP) {
      err(`${mode}: text and text-muted differ by ${Math.abs(col.text.l - col['text-muted'].l).toFixed(3)} lightness, need ${MIN_MUTED_STEP}`);
    }
    if (col.text && col.background && contrast(col.text, col.background) < 7) warn(`${mode}: text on background is below the 7:1 long-reading aim`);
    if (col.accent && col.accent.c > 0.05 && col.accent.h >= 275 && col.accent.h <= 325) err(`${mode}: violet accent (hue ${col.accent.h}) is the default-palette tell`);
    if (ROLES.every((r) => col[r]) && p.accent_text_safe?.[mode] !== accentTextSafe(theme)) {
      err(`${mode}: accent_text_safe must be ${accentTextSafe(theme)}`);
    }
  }
  if ((p.surfaces || []).includes('dashboard')) {
    for (const mode of ['light', 'dark']) {
      if (!p[mode]) continue;
      const [b, s, r] = SURFACES.map((k) => parseOklch(p[mode][k])?.l);
      if (!(s - b >= MIN_GROUND_STEP - 1e-9 && r - s >= MIN_GROUND_STEP - 1e-9)) err(`${mode}: a dashboard palette needs background, surface and surface-raised each ${MIN_GROUND_STEP} lighter than the last (has ${b}, ${s}, ${r})`);
    }
  }
}

function px(value) {
  const m = /^(\d+(?:\.\d+)?)px$/.exec(String(value));
  return m ? +m[1] : NaN;
}

function checkType(t, err) {
  const families = new Set([t.display?.family, t.text?.family, t.mono?.family].filter(Boolean));
  if (families.size > 2) err(`uses ${families.size} families, at most 2`);
  for (const part of ['display', 'text']) {
    const f = t[part];
    if (!f?.family || !f.fallback || !Array.isArray(f.weights) || !f.weights.length) { err(`${part} needs family, fallback and weights`); continue; }
    if (f.weights.some((w) => w >= 800)) err(`${part} loads weight 800 or 900`);
  }
  if (t.display?.weights?.some((w) => w > 600)) err('display weight above 600');
  const weights = new Set([...(t.display?.weights || []), ...(t.text?.weights || []), ...(t.mono?.weights || [])].map(String));
  if (weights.size > 3) err(`loads ${weights.size} weights, at most 3`);
  if (!(t.tracking >= -0.04 && t.tracking <= -0.02)) err(`display tracking ${t.tracking} outside -0.04 to -0.02`);
  for (const reg of t.registers || []) {
    const r = t.ratio?.[reg];
    const [lo, hi] = RATIO_RANGE[reg] || [];
    if (!(r >= lo && r <= hi)) err(`ratio for ${reg} is ${r}, needs ${lo} to ${hi}`);
  }
  if (!/^https:\/\/fonts\.googleapis\.com\/css2\?/.test(t.css || '')) err('css must be a Google Fonts css2 URL');
  for (const fam of families) {
    if (!(t.css || '').includes(`family=${fam.replace(/ /g, '+')}`)) err(`css URL does not request ${fam}`);
  }
  if (!t.classification || !t.suits || !t.license) err('needs classification, suits and license');
  if (typeof t.tabular !== 'boolean') err('needs tabular: true or false (whether display and text both have tabular figures that keep the comma and period narrow; scripts/tabular-punctuation.mjs measures it)');
  if (['dashboard', 'table'].some((s) => (t.surfaces || []).includes(s))) {
    if (!t.tabular) err('a dashboard or table pairing needs tabular figures');
    // Dashboard figures are set semibold, so the text family loads 600.
    if (!(t.text?.weights || []).includes(600)) err('a dashboard or table pairing loads 600 in its text family for semibold figures');
  }
}

function checkShape(s, err) {
  for (const k of SHAPE_TOKENS) if (!(k in (s.tokens || {}))) err(`tokens missing ${k}`);
  const card = px(s.tokens?.['--r-card']);
  if (!(card <= 24)) err(`--r-card ${s.tokens?.['--r-card']} must be 24px or less`);
  for (const k of ['--pad-card', '--gap-group']) if (!SPACE_SCALE.includes(px(s.tokens?.[k]))) err(`${k} ${s.tokens?.[k]} is off the spacing scale`);
  for (const mode of ['light', 'dark']) {
    for (let i = 1; i <= 3; i++) if (!s[mode]?.[`--elevation-${i}`]) err(`${mode} missing --elevation-${i}`);
  }
  if (!['compact', 'regular', 'airy'].includes(s.density)) err(`density ${s.density} invalid`);
}

function checkPlacement(entry, lib, err) {
  const surfaces = lib.surfaces || {};
  if (!Array.isArray(entry.surfaces) || !entry.surfaces.length) { err('needs at least one surface'); return; }
  for (const s of entry.surfaces) if (!surfaces[s]) err(`unknown surface ${s}`);
  // A register an entry claims must be reachable through one of its surfaces, or the dealer can never deal it there.
  for (const r of entry.registers || []) {
    if (!entry.surfaces.some((s) => surfaces[s]?.registers.includes(r))) err(`register ${r} has none of its surfaces (${entry.surfaces.join(', ')})`);
  }
}

function checkKeywords(lib, errors) {
  const seen = new Map();
  for (const [kind, map] of [['tag', lib.tags || {}], ['surface', Object.fromEntries(Object.entries(lib.surfaces || {}).map(([k, v]) => [k, v.keywords]))]]) {
    for (const [name, words] of Object.entries(map)) {
      if (!Array.isArray(words) || !words.length) errors.push(`${kind} ${name}: needs keywords`);
      for (const w of words || []) {
        if (w !== w.toLowerCase() || !/^[a-z0-9]+( [a-z0-9]+)*$/.test(w)) errors.push(`${kind} ${name}: keyword "${w}" must be lower-case whole words`);
        const key = `${kind}:${w}`;
        if (seen.has(key) && seen.get(key) !== name) errors.push(`${kind} ${name}: keyword "${w}" also belongs to ${seen.get(key)}`);
        seen.set(key, name);
      }
    }
  }
  for (const [name, s] of Object.entries(lib.surfaces || {})) {
    for (const r of s.registers || []) if (!(lib.registers || []).includes(r)) errors.push(`surface ${name}: unknown register ${r}`);
  }
  for (const r of lib.registers || []) {
    const d = lib.default_surfaces?.[r];
    if (!Array.isArray(d) || !d.length || d.some((s) => !lib.surfaces?.[s]?.registers.includes(r))) errors.push(`default_surfaces.${r} must list surfaces of that register`);
  }
}

export function validate(lib) {
  const errors = [];
  const warnings = [];
  const tagNames = Object.keys(lib.tags || {});
  const ids = new Set(Object.keys(MIN_COUNTS).flatMap((a) => (lib[a] || []).map((e) => e.id)));
  checkKeywords(lib, errors);
  const keywords = new Set(Object.values(lib.tags || {}).flat());
  for (const axis of Object.keys(MIN_COUNTS)) {
    const list = lib[axis];
    if (!Array.isArray(list)) { errors.push(`${axis}: missing`); continue; }
    if (list.length < MIN_COUNTS[axis]) errors.push(`${axis}: ${list.length} entries, needs ${MIN_COUNTS[axis]}`);
    const seen = new Set();
    for (const entry of list) {
      const where = `${axis} ${entry.id || '?'}`;
      const err = (m) => errors.push(`${where}: ${m}`);
      const warn = (m) => warnings.push(`${where}: ${m}`);
      if (!new RegExp(`^${PREFIX[axis]}\\d{2}$`).test(entry.id || '')) err(`id must look like ${PREFIX[axis]}01`);
      if (seen.has(entry.id)) err('duplicate id');
      seen.add(entry.id);
      if (!entry.name) err('missing name');
      if (!(entry.character || entry.what)) err('missing character');
      if (!Array.isArray(entry.registers) || !entry.registers.length) err('needs at least one register');
      for (const r of entry.registers || []) if (!(lib.registers || []).includes(r)) err(`unknown register ${r}`);
      if (!Array.isArray(entry.tags) || !entry.tags.length) err('needs at least one tag');
      for (const t of entry.tags || []) if (!tagNames.includes(t)) err(`unknown tag ${t}`);
      checkPlacement(entry, lib, err);
      for (const c of entry.clashes || []) {
        if (!ids.has(c)) err(`clashes with unknown id ${c}`);
        else if (c === entry.id) err('clashes with itself');
      }
      for (const n of entry.needs || []) if (!keywords.has(n)) err(`needs "${n}", which is not a tag keyword a brief can negate`);
      if ('requires' in entry && (!Array.isArray(entry.requires) || !entry.requires.length || entry.requires.some((w) => !/^[a-z0-9]+( [a-z0-9]+)*$/.test(w)))) err('requires must list lower-case words, one of which the brief must name');
      if (axis === 'palettes') checkPalette(entry, err, warn);
      if (axis === 'type') checkType(entry, err);
      if (axis === 'shape') checkShape(entry, err);
      if (axis === 'signature' && !(entry.what && entry.build)) err('needs what and build');
      if ('where' in entry) err('placement belongs in surfaces, not where');
    }
  }
  for (const [axis, min] of Object.entries(DASHBOARD_MIN)) {
    const n = (lib[axis] || []).filter((e) => e.registers?.includes('product') && e.surfaces?.includes('dashboard')).length;
    if (n < min) errors.push(`${axis}: ${n} product entries list the dashboard surface, needs ${min}`);
  }
  // A hand of 3 needs 3 entries per axis (6 signatures); a thinner surface makes the dealer widen to the register's defaults.
  for (const [name, s] of Object.entries(lib.surfaces || {})) {
    for (const r of s.registers || []) {
      const thin = Object.keys(MIN_COUNTS).filter((a) => (lib[a] || []).filter((e) => e.registers?.includes(r) && e.surfaces?.includes(name)).length < (a === 'signature' ? 6 : 3));
      if (thin.length) warnings.push(`surface ${name} (${r}): too few ${thin.join(', ')} for a hand of 3; the dealer widens to the defaults`);
    }
  }
  const pals = lib.palettes || [];
  for (let i = 0; i < pals.length; i++) {
    for (let j = i + 1; j < pals.length; j++) {
      const [a, b] = [pals[i], pals[j]];
      const close = (role) => deltaE(parseOklch(a.dark?.[role]) || BLACK, parseOklch(b.dark?.[role]) || BLACK);
      if (a.base === b.base && close('accent') < 0.05 && close('background') < 0.03) errors.push(`palettes ${a.id} and ${b.id}: same base, accent and ground; near duplicates`);
    }
  }
  const restricted = (lib.type || []).filter((t) => [t.display?.family, t.text?.family].some((f) => RESTRICTED_FONTS.includes(f)));
  if (restricted.length > 1) errors.push(`type: ${restricted.map((t) => t.id).join(', ')} use ${RESTRICTED_FONTS.join('/')}; at most one pairing may`);
  const banned = /[–—·•]/;
  const walk = (v, path) => {
    if (typeof v === 'string' && banned.test(v)) errors.push(`${path}: contains a dash or dot separator character`);
    else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walk(x, `${path}.${k}`);
  };
  walk(lib, 'directions');
  return { errors, warnings };
}

// TrueType tables: does the font substitute tabular figures (GSUB tnum), or are its digits one width already?
export function hasTabularFigures(buf) {
  const u16 = (o) => buf.readUInt16BE(o);
  const tables = {};
  for (let i = 0, n = u16(4); i < n; i++) tables[buf.toString('latin1', 12 + 16 * i, 16 + 16 * i)] = buf.readUInt32BE(20 + 16 * i);
  if (tables.GSUB) {
    const list = tables.GSUB + u16(tables.GSUB + 6);
    for (let i = 0, n = u16(list); i < n; i++) if (buf.toString('latin1', list + 2 + 6 * i, list + 6 + 6 * i) === 'tnum') return true;
  }
  if (!tables.cmap || !tables.hmtx || !tables.hhea) return false;
  let sub = null;
  for (let i = 0, n = u16(tables.cmap + 2); i < n; i++) {
    const off = tables.cmap + buf.readUInt32BE(tables.cmap + 8 + 8 * i);
    if (u16(off) === 4) { sub = off; break; }
  }
  if (sub === null) return false;
  const segs = u16(sub + 6) / 2;
  const glyph = (code) => {
    for (let s = 0; s < segs; s++) {
      const end = u16(sub + 14 + 2 * s);
      if (code > end) continue;
      const start = u16(sub + 16 + 2 * segs + 2 * s);
      if (code < start) return 0;
      const delta = buf.readInt16BE(sub + 16 + 4 * segs + 2 * s);
      const roAt = sub + 16 + 6 * segs + 2 * s;
      const ro = u16(roAt);
      if (!ro) return (code + delta) & 0xffff;
      const g = u16(roAt + ro + 2 * (code - start));
      return g ? (g + delta) & 0xffff : 0;
    }
    return 0;
  };
  const metrics = u16(tables.hhea + 34);
  const advance = (g) => u16(tables.hmtx + 4 * Math.min(g, metrics - 1));
  return new Set([...'0123456789'].map((d) => advance(glyph(d.charCodeAt(0))))).size === 1;
}

const BROWSER_UA = 'Mozilla/5.0 (Macintosh) AppleWebKit/537.36 Chrome/130 Safari/537.36';

// Without a browser user agent Google Fonts serves plain TrueType, which is the format hasTabularFigures reads.
async function tabularProblems(t, fetchImpl) {
  const css = await (await fetchImpl(t.css, { signal: AbortSignal.timeout(15000) })).text();
  const out = [];
  for (const fam of new Set([t.display.family, t.text.family])) {
    const url = new RegExp(`font-family: '${fam}';[^}]*?url\\((\\S+?\\.ttf)\\)`).exec(css)?.[1];
    if (!url) { out.push(`${t.id}: no TrueType file for ${fam}`); continue; }
    const buf = Buffer.from(await (await fetchImpl(url, { signal: AbortSignal.timeout(30000) })).arrayBuffer());
    if (!hasTabularFigures(buf)) out.push(`${t.id}: ${fam} has no tabular figures but the pairing says tabular: true`);
  }
  return out;
}

export async function checkFonts(lib, fetchImpl = fetch) {
  const results = await Promise.all((lib.type || []).map(async (t) => {
    const families = [...new Set([t.display?.family, t.text?.family, t.mono?.family].filter(Boolean))];
    try {
      const res = await fetchImpl(t.css, { headers: { 'user-agent': BROWSER_UA }, signal: AbortSignal.timeout(15000) });
      const body = await res.text();
      if (res.status !== 200) return [`${t.id}: HTTP ${res.status} ${t.css}`];
      const absent = families.filter((f) => !body.includes(`font-family: '${f}'`));
      if (absent.length) return [`${t.id}: stylesheet lacks ${absent.join(', ')}`];
      return t.tabular ? await tabularProblems(t, fetchImpl) : [];
    } catch (e) {
      return [`${t.id}: ${e.name === 'TimeoutError' ? 'timed out' : e.message} ${t.css}`];
    }
  }));
  return results.flat();
}

async function main(argv) {
  const flags = new Set(argv.filter((a) => a.startsWith('--')));
  const path = argv.find((a) => !a.startsWith('--')) || DEFAULT_PATH;
  const lib = JSON.parse(readFileSync(path, 'utf8'));
  const { errors, warnings } = validate(lib);
  if (flags.has('--fonts')) errors.push(...(await checkFonts(lib)).map((m) => `fonts ${m}`));
  const counts = Object.keys(MIN_COUNTS).map((a) => `${(lib[a] || []).length} ${a}`).join(', ');
  if (flags.has('--json')) {
    console.log(JSON.stringify({ errors, warnings, counts }, null, 2));
  } else {
    for (const e of errors) console.log(`error  ${e}`);
    for (const w of warnings) console.log(`warn   ${w}`);
    const tab = (lib.type || []).filter((t) => t.tabular).length;
    const fonts = flags.has('--fonts') ? `, ${(lib.type || []).length} font stylesheets fetched, tabular figures confirmed in ${tab} pairings` : '';
    console.log(errors.length ? `DIRECTIONS: FAIL ${errors.length} errors, ${warnings.length} warnings` : `DIRECTIONS: PASS ${counts}${fonts}, ${warnings.length} warnings`);
  }
  process.exitCode = errors.length ? 1 : 0;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main(process.argv.slice(2));
