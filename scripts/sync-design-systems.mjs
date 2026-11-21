#!/usr/bin/env node
// Vendors the DESIGN.md files from VoltAgent/awesome-design-md into
// skills/finesse/design-systems/. Zero dependencies, Node 18+, needs git.
//
//   node scripts/sync-design-systems.mjs [--ref <sha-or-branch>] [--source <local clone>]
//
// Reruns at the same upstream commit produce identical output: the recorded
// date is the upstream commit date, never the wall clock.

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const UPSTREAM = 'https://github.com/VoltAgent/awesome-design-md';
const OUT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../skills/finesse/design-systems');
const PROTECTED = new Set(['index.md', 'NOTICE.md', 'LICENSE', 'SOURCE.json']);
const MAX_WORDS = 14;
// `<slug>.md` would make `claude.md`, which case-insensitive filesystems treat as CLAUDE.md,
// a file agent harnesses auto-load as instructions. The suffix keeps every slug clear of that.
const fileFor = (slug) => `${slug}.design.md`;
// Slugs removed at a brand owner's request (see design-systems/NOTICE.md). Never vendored again.
const EXCLUDED = new Set([]);
const BANNED = /[\u2014\u2013\u00b7\u2022]/;

const ALIASES = {
  linear: 'linear.app',
  x: 'x.ai',
  xai: 'x.ai',
  mistral: 'mistral.ai',
  together: 'together.ai',
  opencode: 'opencode.ai',
  runway: 'runwayml',
  'cal.com': 'cal',
  verge: 'theverge',
  'the-verge': 'theverge',
  dell: 'dell-1996',
  nintendo: 'nintendo-2001',
};

// Hand-reviewed character lines. They win over the derived line so the
// review survives a rerun. Each must stay factual about the vendored file.
const OVERRIDES = {
  '1win': 'Near-black casino and sportsbook, vivid green CTAs, electric blue, dense game-tile rails, heavy Inter.',
  airbnb: 'Warm white marketplace, single Rausch pink-red accent, photography first, modest-weight Cereal.',
  airtable: 'Sober white editorial canvas, coral, green, peach and navy feature cards, near-black pills.',
  aljazeera: 'Flat white news paper, dense Roboto headlines, orange signature bar, live red, black pills.',
  apple: 'Photography-first gallery, alternating light and dark tiles, SF Pro, one action blue.',
  binance: 'Dark trading floor, signature yellow on every CTA, modest-weight custom sans.',
  'bmw-m': 'Near-black motorsport canvas, uppercase white display, tricolor stripe used sparingly, track photography.',
  bmw: 'Light corporate automotive, BMW blue CTAs, dark navy hero bands.',
  bugatti: 'Near-black austerity, white uppercase letterspaced display, full-bleed photography is the only color.',
  cal: 'Friendly white SaaS, black CTAs, Cal Sans display, 12px cards, dark navy footer.',
  claude: 'Warm cream editorial canvas, serif display, coral CTAs, dark navy product surfaces.',
  clay: 'White canvas, saturated single-color feature cards, rounded display type, claymation illustrations.',
  clickhouse: 'Near-black database brand, electric yellow accent and stat numbers, confident white sans.',
  cohere: 'Stark white enterprise AI, deep green-black bands, mineral surfaces, mono-feeling display.',
  coinbase: 'Institutional white fintech, one Coinbase blue used sparingly, modest-weight custom sans.',
  composio: 'Near-black developer tool, single deep electric blue, one sans family.',
  cursor: 'Warm cream editorial code-editor site, warm near-black ink, 400-weight display, negative tracking.',
  'dell-1996': 'Retro 1996 catalog web, black page frame, flat color-block cards, Helvetica Black over Times.',
  dji: 'White product showroom, square photo tiles, engineering-blue pills, tightly tracked Open Sans.',
  elevenlabs: 'Off-white editorial voice-AI, warm ink, pastel gradient orbs, light-weight Waldenburg display.',
  expo: 'Pure white developer platform, near-black ink, black CTAs, sky-blue hero wash.',
  ferrari: 'Near-black cinematic editorial, white display, Rosso Corsa red used sparingly on CTAs.',
  figma: 'Monochrome black and white frame, pill CTAs, oversized pastel color-block sections.',
  framer: 'Pure black artboard, tightly tracked white GT Walsheim, blue links, vivid gradient panels.',
  hashicorp: 'Near-black enterprise infrastructure, per-product accent colors, 600 to 700 display.',
  hp: 'White paper enterprise, electric blue signal CTA, geometric Forma DJR, blue chevron decorations.',
  ibm: 'Carbon-faithful white and charcoal, IBM Blue accent, 0 to 4px corners, light Plex display.',
  intercom: 'Soft cream-white editorial, charcoal Saans type, Fin orange accent, hairline tiles.',
  jobright: 'Spring-mint green on black and white, condensed Titillium headlines, black pill CTAs.',
  kraken: 'Clean white crypto exchange, commanding purple accent, bold display with negative tracking.',
  lamborghini: 'True black void, white type, Lamborghini gold accent, custom Neo-Grotesk display.',
  'linear.app': 'Near-black product canvas, light gray text, single lavender-blue accent, dense and technical.',
  lovable: 'Cream parchment canvas, near-black text, warm and approachable developer builder.',
  mastercard: 'Warm putty-cream editorial, signal orange, oversized pill and circle shapes.',
  mercury: 'Ink-violet night homepage and near-white product pages, indigo action pill, light custom sans.',
  meta: 'Stark white hardware store, photographic product cards, black and outlined CTAs, cobalt blue.',
  minimax: 'Stark white, black pill CTAs, vivid gradient model cards, DM Sans.',
  mintlify: 'Sky-gradient marketing heroes over dense docs surfaces, Inter and Geist Mono, green accent.',
  miro: 'White canvas, canary yellow wordmark, pastel sticky-note feature tints, black pill buttons.',
  'mistral.ai': 'Mustard-to-red sunset gradients, warm cream surfaces, orange CTA, near-serif display.',
  mongodb: 'Dark teal hero bands, bright green pill CTAs, white docs surfaces, Euclid Circular A.',
  mydealz: 'Dense white-card deals feed on cool gray, brand green, hot and cold vote pill.',
  nerdwallet: 'Deep spruce green with mint washes, near-square corners, hairline-separated comparison tables.',
  nike: 'Photography-first retail, towering uppercase Futura, near-monochrome chrome, black pill CTAs.',
  'nintendo-2001': 'Retro Y2K console chrome, beveled periwinkle metal panels, amber-glow nav, outlined display.',
  notion: 'Deep navy hero, purple pill CTA, pastel feature cards, illustration-rich workspace.',
  nvidia: 'Black hero and footer chapters around paper-white body, saturated NVIDIA green on every CTA.',
  ollama: 'Defiantly minimal README-like page, paper white, one black pill, no gradients.',
  'opencode.ai': 'Everything in Berkeley Mono, warm cream canvas, near-black ink, 4px corners, manpage feel.',
  oracle: 'Warm neutral grey ladder, charcoal-only actions, red kept for the wordmark.',
  oura: 'Warm paper cream wellness, editorial serif with quiet grotesque, earth tones, one action blue.',
  pinterest: 'Photography-first masonry grid, Pinterest red CTA, soft warm-cream chrome, Pin Sans.',
  playstation: 'Alternating black, white and PlayStation blue chapters, console-launch pacing, one purpose per section.',
  posthog: 'Warm cream developer blog, olive-charcoal ink, hand-drawn hedgehog marginalia, IBM Plex Sans.',
  raycast: 'Near-black product-screenshot chrome, hairline borders, command-palette cards, Inter ss03, white pill.',
  renault: 'Stark black and white automotive, Sunlight Yellow accent, NouvelR display, photography first.',
  replicate: 'Warm cream ML playground, hot orange accent, oversized display at 72px and up.',
  resend: 'Near-black developer tool, off-white text, editorial serif display headlines.',
  revolut: 'Stark black fintech, cobalt-violet brand, saturated product palette, oversized display.',
  runwayml: 'Cinematic dark film-festival editorial, full-bleed photography and video as the UI.',
  sanity: 'Near-black nocturnal command center, 112px display, mono eyebrows, one coral-red CTA.',
  sap: 'White enterprise application frame, two greys and one blue, flat bands, 8px controls.',
  sentry: 'Deep purple-violet midnight canvas, electric lime accents, chunky playful display, illustrated personality.',
  shopify: 'Near-black cinematic commerce, full-bleed merchant photography, thin giant Neue Haas display.',
  slack: 'Deep aubergine primary, cream-lavender hero gradients, blue links, pill CTAs.',
  spacex: 'Pure black aerospace, full-bleed rocket imagery, uppercase D-DIN, one ghost pill per band.',
  spotify: 'Near-black charcoal player, album art supplies the color, green accent.',
  starbucks: 'Warm cream retail flagship, four-tier green system, proprietary SoDoSans.',
  stripe: 'Deep navy ink, electric indigo primary, gradient mesh hero, thin 300-weight display.',
  supabase: 'Clean white and near-black database brand, single emerald CTA, dense product UI mockups.',
  superhuman: 'Dark indigo editorial hero over a quiet white body, variable display sans, tight tracking.',
  tesla: 'Radical subtraction, full-viewport car photography, almost no interface.',
  theverge: 'Near-black editorial, heavy Manuka display up to 107px, acid-mint and ultraviolet accents.',
  'together.ai': 'Near-black hero bands and white research bands, orange-magenta-periwinkle gradient, mono eyebrows.',
  uber: 'Black and white duet, custom geometric display sans, 999px pill on every control.',
  vercel: 'Black and ink on near-white, multi-color mesh gradient hero, geometric sans, mono labels.',
  vodafone: 'Photography heroes, massive uppercase 800-weight display, scarlet red CTA, clean white bands.',
  voltagent: 'Unrelenting near-black canvas, single electric-green accent, code-editor hero, dark feature card grid.',
  warp: 'Warm near-charcoal terminal brand, Inter with Instrument Serif italic moments, understated CTAs.',
  webflow: 'Near-black and white contrast, five-color product accent system, restrained WF Visual Sans.',
  wired: 'Black and white magazine, tall narrow display serif, serif body text, sans metadata.',
  wise: 'Pale green-tinted canvas, lime-green accent, weight-900 display sans, rounded white cards.',
  'x.ai': 'Strict near-black canvas, white pill outlines, rare sunset gradients, uppercase tracked mono captions.',
  zapier: 'Warm cream neutrals, deep coffee ink, single saturated orange CTA, Degular Display.',
};

function parseArgs(argv) {
  const args = { ref: null, source: null };
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    if (flag === '--ref' || flag === '--source') {
      const value = argv[++i];
      if (!value) fail(`${flag} needs a value`);
      args[flag.slice(2)] = value;
    } else {
      fail(`unknown argument ${flag}\nusage: node scripts/sync-design-systems.mjs [--ref <sha-or-branch>] [--source <local clone path>]`);
    }
  }
  return args;
}

function fail(message) {
  console.error(`sync-design-systems: ${message}`);
  process.exit(1);
}

function git(dir, args, encoding = 'utf8') {
  return execFileSync('git', ['-C', dir, ...args], { encoding, maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] });
}

function obtainTree({ ref, source }) {
  if (source) {
    const dir = resolve(source);
    return { dir, sha: git(dir, ['rev-parse', `${ref ?? 'HEAD'}^{commit}`]).trim(), cleanup() {} };
  }
  const dir = mkdtempSync(join(tmpdir(), 'awesome-design-md-'));
  git(dir, ['init', '-q']);
  git(dir, ['remote', 'add', 'origin', `${UPSTREAM}.git`]);
  // Fetching by name or by SHA both work against GitHub, so one path covers branches, tags and commits.
  git(dir, ['fetch', '-q', '--depth', '1', 'origin', ref ?? 'main']);
  const sha = git(dir, ['rev-parse', 'FETCH_HEAD^{commit}']).trim();
  return { dir, sha, cleanup: () => rmSync(dir, { recursive: true, force: true }) };
}

function readBlob(dir, sha, path) {
  return git(dir, ['cat-file', 'blob', `${sha}:${path}`], 'buffer');
}

function categoriesFromReadme(readme) {
  const bySlug = new Map();
  const order = [];
  let category = null;
  let inCollection = false;
  for (const line of readme.split('\n')) {
    if (line.startsWith('## ')) inCollection = line.trim() === '## Collection';
    if (!inCollection) continue;
    if (line.startsWith('### ')) {
      category = line.slice(4).split(/\s+[\u00b7\u2022|]\s+/)[0].trim();
      order.push(category);
      continue;
    }
    const match = line.match(/getdesign\.md\/([a-z0-9.-]+)\/design-md/);
    if (category && match && !bySlug.has(match[1])) bySlug.set(match[1], category);
  }
  return { bySlug, order };
}

function frontMatterDescription(text) {
  const lines = text.split('\n');
  const end = lines.indexOf('---', 1);
  for (let i = 1; i < end; i++) {
    const match = lines[i].match(/^description:\s*(.*)$/);
    if (!match) continue;
    let value = /^[|>][-+]?$/.test(match[1]) ? '' : match[1];
    for (let j = i + 1; j < end && (/^\s/.test(lines[j]) || lines[j] === ''); j++) value += ` ${lines[j].trim()}`;
    value = value.trim();
    if (/^["'].*["']$/.test(value)) value = value.slice(1, -1).replace(/\\"/g, '"');
    return value;
  }
  return '';
}

function legacyOpening(text) {
  const lines = text.split('\n');
  const start = lines.findIndex((line) => /^## 1\./.test(line));
  return lines.slice(start + 1).find((line) => line.trim()) ?? '';
}

function deriveLine(text, format) {
  const raw = format === 'stitch' ? frontMatterDescription(text) : legacyOpening(text);
  const cleaned = raw
    .replace(/^An? (analysis|inspired interpretation) of .*?design language\s*[\u2014\u2013-]+\s*/i, '')
    .replace(/\(?`?#[0-9a-f]{3,8}`?\)?|\{colors\.[\w-]+\}|[*`]/gi, '')
    .replace(/\s*[\u2014\u2013\u00b7]\s*|\s+--\s+/g, ', ')
    .replace(/\s+/g, ' ')
    .trim();
  const sentence = cleaned.split(/(?<=[.;:])\s/)[0].replace(/[.;:,]$/, '');
  const words = sentence.split(' ').slice(0, MAX_WORDS).join(' ').replace(/[,;:]$/, '');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function renderIndex(entries, categoryOrder, sha) {
  const aliases = Object.entries(ALIASES).map(([alias, slug]) => `${alias}=${slug}`).join(', ');
  const sections = categoryOrder
    .filter((category) => entries.some((entry) => entry.category === category))
    .map((category) => {
      const rows = entries
        .filter((entry) => entry.category === category)
        .map((entry) => `${entry.slug} | ${entry.format} | ${entry.line}`);
      return [`## ${category}`, '', 'slug | format | character', '---|---|---', ...rows, ''].join('\n');
    });
  return [
    '# Bundled design systems',
    '',
    `${entries.length} DESIGN.md files from VoltAgent/awesome-design-md at \`${sha.slice(0, 12)}\`. Generated by \`scripts/sync-design-systems.mjs\`, do not edit.`,
    '',
    'Pick one slug, read only `design-systems/<slug>.design.md`, follow `references/design-systems.md`. `stitch` files open with YAML tokens; `legacy` files have nine numbered sections.',
    '',
    `Aliases (say=slug): ${aliases}.`,
    '',
    ...sections,
  ].join('\n');
}

function checkLine(slug, line) {
  const words = line.split(/\s+/).length;
  if (words > MAX_WORDS) fail(`character line for ${slug} has ${words} words (max ${MAX_WORDS})`);
  if (BANNED.test(line) || line.includes('--')) fail(`character line for ${slug} contains a dash or dot separator`);
  if (line.includes('|')) fail(`character line for ${slug} contains a pipe`);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const tree = obtainTree(args);
  try {
    const { dir, sha } = tree;
    const date = git(dir, ['show', '-s', '--format=%cI', sha]).trim();
    const slugs = git(dir, ['ls-tree', '-r', '--name-only', sha, 'design-md'])
      .split('\n')
      .map((path) => path.match(/^design-md\/([^/]+)\/DESIGN\.md$/)?.[1])
      .filter((slug) => slug && !EXCLUDED.has(slug))
      .sort();
    if (slugs.length === 0) fail(`no design-md/<slug>/DESIGN.md files at ${sha}`);

    const { bySlug, order } = categoriesFromReadme(readBlob(dir, sha, 'README.md').toString('utf8'));
    mkdirSync(OUT_DIR, { recursive: true });

    const files = {};
    const entries = slugs.map((slug) => {
      const bytes = readBlob(dir, sha, `design-md/${slug}/DESIGN.md`);
      writeFileSync(join(OUT_DIR, fileFor(slug)), bytes);
      files[fileFor(slug)] = createHash('sha256').update(bytes).digest('hex');
      const text = bytes.toString('utf8');
      const format = text.startsWith('---\n') ? 'stitch' : 'legacy';
      const line = OVERRIDES[slug] ?? deriveLine(text, format);
      checkLine(slug, line);
      return { slug, format, line, category: bySlug.get(slug) ?? 'Other' };
    });

    const license = readBlob(dir, sha, 'LICENSE');
    writeFileSync(join(OUT_DIR, 'LICENSE'), license);
    files.LICENSE = createHash('sha256').update(license).digest('hex');

    const keep = new Set([...slugs.map(fileFor), ...PROTECTED]);
    const removed = readdirSync(OUT_DIR).filter((name) => !keep.has(name));
    for (const name of removed) rmSync(join(OUT_DIR, name));

    for (const [alias, slug] of Object.entries(ALIASES)) {
      if (!slugs.includes(slug)) fail(`alias ${alias} points at missing slug ${slug}`);
    }
    for (const slug of Object.keys(OVERRIDES)) {
      if (!slugs.includes(slug)) console.warn(`sync-design-systems: override for ${slug} has no upstream file, delete it`);
    }

    const source = { upstream: UPSTREAM, commit: sha, date, count: slugs.length, sha256: files };
    writeFileSync(join(OUT_DIR, 'SOURCE.json'), `${JSON.stringify(source, null, 2)}\n`);
    writeFileSync(join(OUT_DIR, 'index.md'), renderIndex(entries, [...order, 'Other'], sha));

    const legacy = entries.filter((entry) => entry.format === 'legacy').length;
    console.log(`synced ${slugs.length} systems (${legacy} legacy) at ${sha}; removed ${removed.length}`);
  } finally {
    tree.cleanup();
  }
}

main();
