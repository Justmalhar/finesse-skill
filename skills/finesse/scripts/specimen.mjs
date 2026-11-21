#!/usr/bin/env node
// Writes a self-contained HTML specimen of assets/directions.json so the library can be judged by eye:
// every palette in both themes with a small UI fragment and its chart series (area, donut, bar strip, and the strip
// as seen with protanopia and deuteranopia), every type pairing, every shape.
// Usage: node specimen.mjs [out.html] [--only palettes|type|shape] [--ids P27,P28]   (default out: OS temp dir)
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve, relative } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const skillDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const lib = JSON.parse(readFileSync(join(skillDir, 'assets', 'directions.json'), 'utf8'));
const args = process.argv.slice(2);
const flag = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : null);
const only = flag('--only');
const ids = flag('--ids')?.split(',');
const out = resolve(args.find((a, i) => !a.startsWith('--') && !['--only', '--ids'].includes(args[i - 1])) || join(tmpdir(), 'finesse-specimen.html'));
if (!relative(skillDir, out).startsWith('..')) {
  console.error('specimen: write the specimen outside the skill folder');
  process.exit(1);
}
const pick = (list) => (ids ? list.filter((e) => ids.includes(e.id)) : list);

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const vars = (theme) => Object.entries(theme).map(([k, v]) => `--${k}:${v}`).join(';');

// Fixed sample data so every palette is judged on the same shapes.
const SERIES = [[30, 34, 31, 42, 47, 44, 58, 55, 63, 70, 66, 78], [26, 28, 33, 31, 36, 40, 39, 43, 45, 44, 50, 52]];
const SHARE = [34, 22, 16, 12, 9, 7];
const BARS = [72, 54, 88, 40, 64, 30];

function area(uid) {
  const w = 240, h = 88, max = 84;
  const pts = (s) => s.map((v, i) => [(i / (s.length - 1)) * w, h - (v / max) * h]);
  const line = (s) => pts(s).map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const fill = (s, n) => `<path d="${line(s)} L${w} ${h} L0 ${h} Z" fill="url(#${uid}g${n})"/>`;
  const grad = (n) => `<linearGradient id="${uid}g${n}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="var(--chart-${n})" stop-opacity="0.32"/><stop offset="1" stop-color="var(--chart-${n})" stop-opacity="0"/></linearGradient>`;
  return `<svg class="area" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true"><defs>${grad(1)}${grad(2)}</defs>
    ${fill(SERIES[1], 2)}<path d="${line(SERIES[1])}" fill="none" stroke="var(--chart-2)" stroke-width="1.5" stroke-dasharray="4 3" vector-effect="non-scaling-stroke"/>
    ${fill(SERIES[0], 1)}<path d="${line(SERIES[0])}" fill="none" stroke="var(--chart-1)" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>`;
}

function donut() {
  const r = 30, c = 2 * Math.PI * r;
  let at = 0;
  const arcs = SHARE.map((v, i) => {
    const len = (v / 100) * c - 2;
    const seg = `<circle r="${r}" cx="40" cy="40" fill="none" stroke="var(--chart-${i + 1})" stroke-width="12" stroke-dasharray="${len.toFixed(2)} ${c}" stroke-dashoffset="${(-at).toFixed(2)}" transform="rotate(-90 40 40)"/>`;
    at += (v / 100) * c;
    return seg;
  }).join('');
  return `<svg class="donut" viewBox="0 0 80 80" aria-hidden="true">${arcs}<text x="40" y="44" text-anchor="middle">6</text></svg>`;
}

const strip = (filter = '') => `<div class="bars"${filter ? ` style="filter:url(#${filter})"` : ''}>${BARS.map((v, i) => `<i style="height:${v}%;background:var(--chart-${i + 1})"></i>`).join('')}</div>`;

function panel(p, mode) {
  const link = p.accent_text_safe[mode] ? 'link' : 'link quiet';
  return `<div class="panel" style="${vars(p[mode])}">
    <div class="meta">${p.id} ${mode}</div>
    <h3>Twelve invoices are waiting</h3>
    <p>The oldest is 24 days late. <a class="${link}" href="#">Send reminders</a> to the four clients past due.</p>
    <div class="row"><button>New invoice</button><span class="badge ok">Paid</span><span class="badge warn">Due soon</span><span class="badge bad">Overdue</span></div>
    <div class="tile"><div class="tiles">
      <div><span class="muted">Revenue</span><b class="fig">$48,210</b>${area(`${p.id}${mode}`)}</div>
      <div class="donutbox">${donut()}</div>
      <div class="stack">${strip()}<div class="cvd">${strip('protan')}${strip('deutan')}</div><span class="muted tiny">normal, protanopia, deuteranopia</span></div>
    </div>
    <div class="rows"><div class="r hover"><span>Hovered row</span><span class="muted">4 days late</span></div><div class="r sel"><span>Selected row</span><span class="muted">due 2 Dec</span></div></div></div>
  </div>`;
}

const palettes = pick(lib.palettes).map((p) => `<section class="pal">
  <header><b>${p.id} ${esc(p.name)}</b> <span>${p.base}-first, ${p.strategy}, ${p.registers.join(' and ')}</span><p>${esc(p.character)}</p></header>
  <div class="pair">${panel(p, 'light')}${panel(p, 'dark')}</div>
</section>`).join('\n');

const fam = (f) => `"${f.family}", ${f.fallback}`;
const types = pick(lib.type).map((t) => `<section class="type">
  <div class="meta">${t.id} ${esc(t.name)}: ${esc(t.classification)}${t.tabular ? ', tabular figures' : ''}; ${t.registers.join(' and ')}</div>
  <h2 style="font-family:${esc(fam(t.display))};font-weight:${t.display.weights[0]};letter-spacing:${t.tracking}em">Small batches, roasted on Thursdays</h2>
  <p class="nums" style="font-family:${esc(fam(t.display))};font-weight:${t.display.weights[0]};letter-spacing:${t.tracking}em">$2,841,907.50 <span style="font-family:${esc(fam(t.text))};font-weight:${t.text.weights[0]}">+14.7% 1,111 0.08</span></p>
  <p style="font-family:${esc(fam(t.text))};font-weight:${t.text.weights[0]}">We buy green coffee from four farms we have visited, roast it in twelve kilo lots and post it the same afternoon. Every bag carries the roast date, the farm and the altitude.</p>
  <p class="suits" style="font-family:${esc(fam(t.text))};font-weight:${t.text.weights[1] || t.text.weights[0]}">Suits ${esc(t.suits)}</p>
</section>`).join('\n');

const shapeRef = lib.palettes.find((p) => p.id === 'P10') || lib.palettes[0];
const shapes = pick(lib.shape).map((s) => `<section class="shape" style="${vars(shapeRef.light)};${Object.entries({ ...s.tokens, ...s.light }).map(([k, v]) => `${k}:${v}`).join(';')};--shadow-color:${shapeRef.light.text}">
  <div class="meta">${s.id} ${esc(s.name)}: ${s.radius}, ${s.elevation}, ${s.density}</div>
  <div class="scard"><b>Starter plan</b><p>Five projects, one seat.</p><div class="row"><button>Choose plan</button><input placeholder="Coupon code" aria-label="Coupon code"></div></div>
</section>`).join('\n');

// Machado, Oliveira and Fernandes (2009), severity 1, in linear RGB, the same matrices validate-directions.mjs uses.
const cvd = (id, m) => `<filter id="${id}" color-interpolation-filters="linearRGB"><feColorMatrix type="matrix" values="${m.map((r) => `${r.join(' ')} 0 0`).join(' ')} 0 0 0 1 0"/></filter>`;
const filters = `<svg width="0" height="0" style="position:absolute">${cvd('protan', [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]])}${cvd('deutan', [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.01182, 0.04294, 0.968881]])}</svg>`;

const links = pick(lib.type).map((t) => `<link rel="stylesheet" href="${t.css}">`).join('\n');
const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>finesse direction specimen</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
${only && only !== 'type' ? '' : links}
<style>
  body { margin: 0; padding: 32px; background: oklch(0.93 0 0); color: oklch(0.2 0 0); font: 14px/1.5 system-ui, sans-serif; }
  h1 { font-size: 24px; margin: 0 0 24px; }
  .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; margin-bottom: 48px; }
  .grid.three { grid-template-columns: repeat(3, 1fr); }
  .grid.five { grid-template-columns: repeat(5, 1fr); }
  .pal header { margin-bottom: 8px; } .pal header span { color: oklch(0.45 0 0); } .pal header p { margin: 0; color: oklch(0.4 0 0); }
  .pair { display: grid; grid-template-columns: 1fr 1fr; }
  .panel { background: var(--background); color: var(--text); padding: 20px; display: grid; gap: 12px; align-content: start; }
  .panel h3 { margin: 0; font-size: 18px; font-weight: 600; letter-spacing: -0.02em; }
  .panel p { margin: 0; font-size: 14px; } .muted { color: var(--text-muted); } .tiny { font-size: 12px; }
  .meta { font: 12px/1.4 ui-monospace, monospace; color: inherit; opacity: 0.7; }
  .link { color: var(--accent); text-underline-offset: 0.2em; } .link.quiet { color: var(--text); text-decoration-color: var(--accent); text-decoration-thickness: 2px; }
  .row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
  button { background: var(--accent); color: var(--accent-text); border: 0; border-radius: var(--r-control, 8px); padding: 0 16px; height: var(--control-h, 36px); font: 500 14px system-ui, sans-serif; outline: 2px solid var(--focus); outline-offset: 2px; }
  .badge { font-size: 12px; font-weight: 500; padding: 2px 8px; border-radius: 4px; border: 1px solid currentColor; }
  .ok { color: var(--success); } .warn { color: var(--warning); } .bad { color: var(--danger); }
  input { background: var(--surface-raised); color: var(--text); border: max(1px, var(--border-width, 1px)) solid var(--border-strong); border-radius: var(--r-control, 8px); height: var(--control-h, 36px); padding: 0 12px; font: 14px system-ui, sans-serif; }
  .tile { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 12px; display: grid; gap: 10px; }
  .tiles { display: grid; grid-template-columns: 1.6fr 0.8fr 1fr; gap: 12px; align-items: end; }
  .tiles > div { display: grid; gap: 4px; min-width: 0; }
  .fig { font-size: 20px; font-weight: 600; font-variant-numeric: tabular-nums; letter-spacing: -0.02em; }
  .area { width: 100%; height: 72px; display: block; }
  .donut { width: 80px; height: 80px; } .donut text { fill: var(--text); font: 600 16px system-ui, sans-serif; }
  .bars { display: flex; align-items: flex-end; gap: 3px; height: 56px; } .bars i { flex: 1; border-radius: 2px 2px 0 0; }
  .cvd { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; } .cvd .bars { height: 24px; gap: 2px; }
  .rows { display: grid; font-size: 13px; } .r { display: flex; justify-content: space-between; padding: 6px 8px; border-radius: 6px; }
  .r.hover { background: color-mix(in oklab, var(--text) 6%, transparent); } .r.sel { background: color-mix(in oklab, var(--accent) 17%, transparent); }
  .type { background: oklch(0.985 0 0); padding: 24px; }
  .type h2 { font-size: 40px; line-height: 1.08; margin: 8px 0 12px; text-wrap: balance; }
  .type .nums { font-size: 32px; margin: 0 0 12px; font-variant-numeric: tabular-nums; } .type .nums span { font-size: 13px; }
  .type p { font-size: 16px; line-height: 1.6; margin: 0 0 8px; } .type .suits { font-size: 13px; color: oklch(0.45 0 0); }
  .shape { background: var(--background); color: var(--text); padding: 24px; }
  .scard { margin-top: 12px; background: var(--surface-raised); border: var(--border-width) solid var(--border); border-radius: var(--r-card); padding: var(--pad-card); box-shadow: var(--elevation-2); display: grid; gap: 12px; }
  .scard p { margin: 0; } .scard input { width: 120px; }
</style></head><body>${filters}
${!only || only === 'palettes' ? `<h1>Palettes (${pick(lib.palettes).length}), light and dark</h1><div class="grid">${palettes}</div>` : ''}
${!only || only === 'type' ? `<h1>Type pairings (${pick(lib.type).length})</h1><div class="grid three">${types}</div>` : ''}
${!only || only === 'shape' ? `<h1>Shapes (${pick(lib.shape).length}) on ${shapeRef.id}</h1><div class="grid five">${shapes}</div>` : ''}
</body></html>
`;
writeFileSync(out, html);
console.log(out);
