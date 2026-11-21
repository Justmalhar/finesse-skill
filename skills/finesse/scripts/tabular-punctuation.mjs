#!/usr/bin/env node
// Measures tabular punctuation. With tabular-nums some faces also swap the comma and period for figure-wide glyphs,
// which sets $2,200.00 as "$2,200 . 00". Renders every face of each pairing at 14 px in headless Chrome and prints the
// advance of the comma and the period as a share of a digit, with tabular-nums and without. A face fails when
// tabular-nums widens either past MAX_SHARE. A monospaced face is wide without it too, and passes.
// Usage: node tabular-punctuation.mjs [T07 T13 ...]   (default: every pairing placed on dashboard or table)
// Needs Google Chrome or Chromium and the network. Set CHROME to the binary if it is not found.
import { readFileSync, writeFileSync, mkdtempSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { DEFAULT_PATH } from './validate-directions.mjs';

// A proportional comma or period is about 0.25 to 0.35 of a digit; a tabular one is 1.0.
export const MAX_SHARE = 0.6;
const CHROMES = [
  process.env.CHROME,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
];

function faces(t) {
  const out = [];
  for (const part of ['display', 'text', 'mono']) {
    const f = t[part];
    if (!f) continue;
    for (const w of f.weights) if (!out.some((o) => o.family === f.family && o.weight === w)) out.push({ family: f.family, weight: w });
  }
  return out;
}

function page(pairings) {
  const links = [...new Set(pairings.map((t) => t.css))].map((u) => `<link rel="stylesheet" href="${u}">`).join('\n');
  const jobs = JSON.stringify(pairings.map((t) => ({ id: t.id, faces: faces(t) })));
  return `<!doctype html><meta charset="utf-8">${links}
<style>span { font-size: 14px; font-variant-numeric: tabular-nums lining-nums; white-space: pre; display: inline-block; }</style>
<pre id="out"></pre>
<script>
(async () => {
  const jobs = ${jobs};
  const width = (face, text, plain) => {
    const s = document.createElement('span');
    if (plain) s.style.fontVariantNumeric = 'normal';
    s.style.fontFamily = JSON.stringify(face.family);
    s.style.fontWeight = face.weight;
    s.textContent = text;
    document.body.append(s);
    const w = s.getBoundingClientRect().width;
    s.remove();
    return w;
  };
  const rows = [];
  for (const job of jobs) for (const face of job.faces) {
    const spec = face.weight + ' 14px "' + face.family + '"';
    await document.fonts.load(spec, '$0123456789,.').catch(() => {});
    const loaded = document.fonts.check(spec, '0,.');
    const digit = width(face, '0000000000') / 10;
    const plainDigit = width(face, '0000000000', true) / 10;
    rows.push({ id: job.id, ...face, loaded, comma: width(face, ',') / digit, period: width(face, '.') / digit,
      plainComma: width(face, ',', true) / plainDigit, plainPeriod: width(face, '.', true) / plainDigit,
      specimen: [width(face, '$12,345.67'), width(face, '1,204.50')] });
  }
  document.getElementById('out').textContent = JSON.stringify(rows);
})();
</script>`;
}

export function measure(pairings) {
  const chrome = CHROMES.find((p) => p && existsSync(p));
  if (!chrome) throw new Error('no Chrome found; set CHROME to the browser binary');
  const dir = mkdtempSync(join(tmpdir(), 'finesse-tnum-'));
  const file = join(dir, 'specimen.html');
  writeFileSync(file, page(pairings));
  const dom = execFileSync(chrome, ['--headless=new', '--disable-gpu', '--virtual-time-budget=20000', '--dump-dom', pathToFileURL(file).href], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 120000 });
  const json = /<pre id="out">([\s\S]*?)<\/pre>/.exec(dom)?.[1];
  if (!json) throw new Error('the specimen page did not finish; raise --virtual-time-budget or check the network');
  return JSON.parse(json.replace(/&quot;/g, '"').replace(/&amp;/g, '&'));
}

function main(argv) {
  const lib = JSON.parse(readFileSync(DEFAULT_PATH, 'utf8'));
  const ids = new Set(argv.map((a) => a.toUpperCase()));
  const pairings = lib.type.filter((t) => (ids.size ? ids.has(t.id) : t.surfaces.some((s) => s === 'dashboard' || s === 'table')));
  const rows = measure(pairings);
  let failed = 0;
  for (const r of rows) {
    const mono = r.plainComma > MAX_SHARE && r.plainPeriod > MAX_SHARE;
    const bad = !r.loaded || (!mono && (r.comma > MAX_SHARE || r.period > MAX_SHARE));
    if (bad) failed++;
    const note = !r.loaded ? 'FAIL font did not load' : bad ? 'FAIL tabular-nums widens the punctuation' : mono ? 'ok, monospaced' : 'ok';
    const share = (t, p) => `${t.toFixed(2)} (${p.toFixed(2)} without)`;
    console.log(`${r.id}  ${`${r.family} ${r.weight}`.padEnd(26)} comma ${share(r.comma, r.plainComma)}  period ${share(r.period, r.plainPeriod)}  ${note}`);
  }
  console.log(failed ? `TABULAR PUNCTUATION: FAIL ${failed} faces wider than ${MAX_SHARE} of a digit` : `TABULAR PUNCTUATION: PASS ${rows.length} faces in ${pairings.length} pairings`);
  process.exitCode = failed ? 1 : 0;
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) main(process.argv.slice(2));
