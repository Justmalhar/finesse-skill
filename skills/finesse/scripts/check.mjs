#!/usr/bin/env node
// finesse checker. Zero dependencies, Node 18+. Reads source text: CSS, markup, JSX, Tailwind class strings, Markdown.
import { readFileSync, readdirSync, lstatSync, statSync } from 'node:fs';
import { join, extname, relative, resolve, basename } from 'node:path';
import { pathToFileURL } from 'node:url';

const KIND = {
  '.css': 'css', '.scss': 'css',
  '.html': 'markup', '.jsx': 'markup', '.tsx': 'markup', '.vue': 'markup', '.svelte': 'markup', '.astro': 'markup',
  '.js': 'script', '.ts': 'script',
  '.md': 'md', '.mdx': 'md',
};
const SKIP_DIRS = new Set([
  'node_modules', 'design-systems', 'vendor', 'dist', 'build', 'out', 'coverage',
  'fixtures', '__fixtures__',
]);
const ALL = ['css', 'markup', 'script'];

// ---------- text views ----------

function blank(s) { return s.replace(/[^\n]/g, ' '); }

function lineIndex(src) {
  const starts = [0];
  for (let i = 0; i < src.length; i++) if (src[i] === '\n') starts.push(i + 1);
  return (offset) => {
    let lo = 0, hi = starts.length - 1;
    while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (starts[mid] <= offset) lo = mid; else hi = mid - 1; }
    return lo + 1;
  };
}

// Blanks comments (keeping offsets) and returns them. Strings end at a newline unless they are template literals,
// so an apostrophe in JSX text cannot swallow more than one line.
function stripComments(src, { slashLine, html }) {
  const out = src.split('');
  const comments = [];
  const templates = [];
  let i = 0, q = null;
  while (i < src.length) {
    const c = src[i];
    if (q) {
      if (c === '\\') { i += 2; continue; }
      if (c === q || (c === '\n' && q !== '`')) { if (q === '`') templates[templates.length - 1][1] = i; q = null; }
      i++; continue;
    }
    if (c === '"' || c === "'" || c === '`') { q = c; if (c === '`') templates.push([i, src.length]); i++; continue; }
    let end = -1;
    if (c === '/' && src[i + 1] === '*') { end = src.indexOf('*/', i + 2); end = end < 0 ? src.length : end + 2; }
    else if (slashLine && c === '/' && src[i + 1] === '/' && src[i - 1] !== ':') { end = src.indexOf('\n', i); if (end < 0) end = src.length; }
    else if (html && src.startsWith('<!--', i)) { end = src.indexOf('-->', i + 4); end = end < 0 ? src.length : end + 3; }
    if (end < 0) { i++; continue; }
    comments.push({ text: src.slice(i, end), offset: i });
    for (let k = i; k < end; k++) if (out[k] !== '\n') out[k] = ' ';
    i = end;
  }
  return { code: out.join(''), comments, templates };
}

function stripMarkdown(src) {
  const comments = [];
  let s = src.replace(/<!--[\s\S]*?-->/g, (m, off) => { comments.push({ text: m, offset: off }); return blank(m); });
  const lines = s.split('\n');
  let fence = null;
  for (let i = 0; i < lines.length; i++) {
    const m = /^\s{0,3}(`{3,}|~{3,})/.exec(lines[i]);
    if (fence) {
      if (m && m[1][0] === fence[0] && m[1].length >= fence.length) fence = null;
      lines[i] = blank(lines[i]);
    } else if (m) { fence = m[1]; lines[i] = blank(lines[i]); }
  }
  s = lines.join('\n')
    .replace(/(`+)[\s\S]*?\1/g, blank)
    .replace(/\]\([^)\n]*\)/g, (m) => ']' + blank(m.slice(1)))
    .replace(/^\s*\[[^\]\n]+\]:\s*\S+.*$/gm, blank)
    .replace(/<https?:[^>\s]*>/g, blank);
  return { code: s, comments, templates: [] };
}

const URL_RE = /\b(?:https?:\/\/|www\.)[^\s"'`<>)]+/g;

// ---------- CSS ----------

function parseCss(code, base, blocks, wrapper = null) {
  const stack = [];
  let start = 0, paren = 0, q = null;
  const decl = (from, to) => {
    if (!stack.length) return;
    const raw = code.slice(from, to);
    if (/^\s*@apply\s/.test(raw)) { stack[stack.length - 1].applies.push(raw); return; }
    const m = /^(\s*)([-\w]+)\s*:\s*([\s\S]*?)\s*$/.exec(raw);
    if (m && !/^\s*$/.test(m[3])) stack[stack.length - 1].decls.push({ prop: m[2].toLowerCase(), value: m[3].replace(/\s*!important$/i, ''), offset: base + from + m[1].length });
  };
  for (let i = 0; i < code.length; i++) {
    const c = code[i];
    if (q) { if (c === '\\') i++; else if (c === q || c === '\n') q = null; continue; }
    if (c === '"' || c === "'") { q = c; continue; }
    if (c === '(') paren++;
    else if (c === ')') paren = Math.max(0, paren - 1);
    else if (paren) continue;
    else if (c === '{') {
      const prelude = code.slice(start, i).trim();
      const block = { prelude, parents: stack.map((b) => b.prelude), decls: [], applies: [], offset: base + start };
      if (wrapper) block.prelude = wrapper;
      blocks.push(block); stack.push(block); start = i + 1;
    } else if (c === ';') { decl(start, i); start = i + 1; }
    else if (c === '}') { decl(start, i); stack.pop(); start = i + 1; }
  }
}

function cssBlocks(ctx) {
  const blocks = [];
  if (ctx.kind === 'css') parseCss(ctx.code, 0, blocks);
  if (ctx.kind === 'markup') {
    for (const m of ctx.code.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) parseCss(m[1], m.index + m[0].indexOf('>') + 1, blocks);
    for (const m of ctx.code.matchAll(/\sstyle\s*=\s*(["'])([^"']*)\1/g)) {
      const at = m.index + m[0].indexOf(m[1]) + 1;
      parseCss('{' + m[2] + '}', at - 1, blocks, '[style]');
    }
  }
  return blocks;
}

function* decls(ctx, propRe) {
  for (const block of ctx.css) for (const d of block.decls) if (propRe.test(d.prop)) yield [d, block];
}
const inKeyframes = (b) => b.parents.some((p) => /^@(-\w+-)?keyframes/i.test(p));
const toPx = (n, unit) => (unit === 'rem' ? n * 16 : unit === 'px' ? n : null);

// ---------- Tailwind class lists ----------

const CLASS_FNS = /\b(?:cn|clsx|cx|cva|tv|twMerge|twJoin|classNames|classnames)\s*\(/g;
const STRING_LIT = /(["'`])((?:\\.|(?!\1)[^\\])*?)\1/g;

function balanced(code, i, open, close) {
  let depth = 0, q = null;
  for (let k = i; k < code.length; k++) {
    const c = code[k];
    if (q) { if (c === '\\') k++; else if (c === q) q = null; continue; }
    if (c === '"' || c === "'" || c === '`') q = c;
    else if (c === open) depth++;
    else if (c === close && --depth === 0) return k;
  }
  return code.length;
}

function tokenize(text, offset) {
  const tokens = [];
  for (const m of text.matchAll(/[^\s"'`{},]+/g)) tokens.push(parseClass(m[0], offset + m.index));
  return tokens;
}

function literalTokens(code, from, to) {
  const tokens = [];
  for (const m of code.slice(from, to).matchAll(STRING_LIT)) {
    const body = m[2].replace(/\$\{[^}]*\}/g, blank);
    tokens.push(...tokenize(body, from + m.index + 1));
  }
  return tokens;
}

function parseClass(cls, offset) {
  const variants = [];
  let depth = 0, last = 0;
  for (let i = 0; i < cls.length; i++) {
    const c = cls[i];
    if (c === '[' || c === '(') depth++;
    else if (c === ']' || c === ')') depth--;
    else if (c === ':' && depth === 0) { variants.push(cls.slice(last, i)); last = i + 1; }
  }
  return { cls, variants, base: cls.slice(last).replace(/^!|!$/g, ''), offset };
}

function classLists(ctx) {
  const lists = [];
  const covered = [];
  const { code } = ctx;
  if (ctx.kind !== 'css') {
    for (const m of code.matchAll(/(?:^|[\s:])(?:class|className|class:list)\s*=\s*/g)) {
      const at = m.index + m[0].length;
      const c = code[at];
      if (c === '"' || c === "'") {
        const end = code.indexOf(c, at + 1);
        if (end < 0) continue;
        lists.push(Object.assign(tokenize(code.slice(at + 1, end), at + 1), enclosingTag(code, m.index)));
        covered.push([at, end]);
      } else if (c === '{') {
        const end = balanced(code, at, '{', '}');
        lists.push(Object.assign(literalTokens(code, at, end), enclosingTag(code, m.index)));
        covered.push([at, end]);
      }
    }
    for (const m of code.matchAll(CLASS_FNS)) {
      if (covered.some(([a, b]) => m.index > a && m.index < b)) continue;
      const open = m.index + m[0].length - 1;
      const name = /(?:const|let|var)\s+(\w+)\s*=\s*$/.exec(code.slice(Math.max(0, m.index - 80), m.index));
      lists.push(Object.assign(literalTokens(code, open, balanced(code, open, '(', ')')), { label: name?.[1] }));
    }
  }
  for (const m of code.matchAll(/@apply\s+([^;}\n]+)/g)) {
    const open = code.lastIndexOf('{', m.index);
    const label = code.slice(Math.max(code.lastIndexOf('}', open), code.lastIndexOf(';', open)) + 1, open).trim();
    lists.push(Object.assign(tokenize(m[1], m.index + m[0].indexOf(m[1])), { label }));
  }
  return lists.filter((l) => l.length);
}

function* tokens(ctx, test) {
  for (const list of ctx.classes) for (const t of list) if (test(t, list)) yield t;
}
const hasBase = (list, re) => list.some((t) => re.test(t.base));
const labelOf = (list) => list.label || (list.tag && /[A-Z.]/.test(list.tag) ? list.tag : '');
const NATIVE_FOCUSABLE = /^(input|textarea|select|button|a|summary)$/;
const FOCUSABLE_NAME = /button|btn|input|link|trigger|textarea|select|checkbox|switch|radio|toggle|tab(?!le)/i;
const focusable = (list) => NATIVE_FOCUSABLE.test(list.tag || '') || /(^|\s)(tabIndex|tabindex|contentEditable|contenteditable)\s*=/.test(list.attrs || '') || FOCUSABLE_NAME.test(labelOf(list));
const PILL_NAME = /button|btn|badge|chip|pill|tag|input|select|trigger|tab(?!le)|avatar|toggle|switch|kbd|link/i;
function pillish(list) {
  if (/^(button|a|input|select|span|label)$/.test(list.tag || '') || PILL_NAME.test(labelOf(list))) return true;
  return list.some((t) => {
    const m = /^(?:h|size|py)-(?:(\d+(?:\.5)?)|\[(\d+)px\])$/.exec(t.base);
    if (!m) return false;
    const px = m[1] ? +m[1] * 4 : +m[2];
    return t.base.startsWith('py') ? px <= 12 : px <= 64;
  });
}
// A text field that draws no frame of its own sits inside a wrapper that owns the frame and the focus state.
// A stretched inset-0 overlay hands its focus state to the card it covers.
const embeddedField = (list) => (/^(input|textarea)$/.test(list.tag || '') || /input|textarea/i.test(labelOf(list)))
  && !list.some((t) => !t.variants.length && /^(border(-\d+|-\[.+\])?|ring(-\d+)?|shadow(-\w+)?|bg-(?!transparent\b).+)$/.test(t.base));
const stretchedOverlay = (list) => hasBase(list, /^inset-0$/);
const PANEL_SIZE = /--[\w-]*(panel|content)-(height|width)/;
const isInteractive = (v) => /^(hover|group-hover|peer-hover)$/.test(v);

// ---------- markup tags ----------

function tagEnd(code, k) {
  let depth = 0, q = null;
  for (; k < code.length; k++) {
    const c = code[k];
    if (q) { if (c === q) q = null; continue; }
    if (c === '"' || c === "'" || c === '`') q = c;
    else if (c === '{') depth++;
    else if (c === '}') depth--;
    else if (c === '>' && depth === 0) break;
  }
  return k;
}

// Tags inside template literals are code samples (html`...`), not rendered markup.
function* tags(ctx, names) {
  const re = new RegExp(`<(${names})(?=[\\s/>])`, 'g');
  for (const m of ctx.code.matchAll(re)) {
    if (ctx.templates.some(([a, b]) => m.index > a && m.index < b)) continue;
    const start = m.index + m[0].length;
    yield { name: m[1], attrs: ctx.code.slice(start, tagEnd(ctx.code, start)), offset: m.index };
  }
}

function enclosingTag(code, at) {
  const lt = code.lastIndexOf('<', at);
  const m = lt >= 0 && /^<([A-Za-z][\w.:-]*)/.exec(code.slice(lt, at));
  if (!m) return {};
  const start = lt + m[0].length;
  return { tag: m[1], attrs: code.slice(start, tagEnd(code, start)) };
}

// ---------- copy segments ----------

function copySegments(ctx) {
  if (ctx.kind === 'md') return [{ text: ctx.code.replace(URL_RE, blank), offset: 0 }];
  if (ctx.kind !== 'markup') return [];
  let view = ctx.code.replace(/(<(script|style)\b[^>]*>)([\s\S]*?)(<\/\2>)/gi, (m, a, _n, body, z) => a + blank(body) + z);
  if (ctx.ext === '.astro') view = view.replace(/^---\n[\s\S]*?\n---/, blank);
  const segs = [];
  for (const m of view.matchAll(/[>}]([^<>{}]+)(?=[<{])/g)) {
    const text = m[1];
    if (!/\p{L}|[·•–—]/u.test(text) || /=>|&&|\|\||=|\breturn\b|\bconst\b|\bfunction\b/.test(text)) continue;
    segs.push({ text: text.replace(URL_RE, blank), offset: m.index + 1, node: true });
  }
  const scriptish = ctx.ext !== '.html';
  for (const m of ctx.code.matchAll(scriptish ? STRING_LIT : /(["'])([^"'\n]*?)\1/g)) {
    const lineStart = ctx.code.lastIndexOf('\n', m.index) + 1;
    if (/^\s*(import|export\s.*\sfrom)\b/.test(ctx.code.slice(lineStart, m.index)) || /\b(require|import)\s*\($/.test(ctx.code.slice(Math.max(0, m.index - 10), m.index))) continue;
    segs.push({ text: m[2].replace(URL_RE, blank), offset: m.index + 1, string: true });
  }
  return segs;
}

function* copy(ctx, re, filter = () => true) {
  for (const seg of ctx.copy) {
    if (!filter(seg)) continue;
    for (const m of seg.text.matchAll(re)) yield { offset: seg.offset + m.index, match: m[0] };
  }
}

// ---------- colour ----------
// Hue buckets. A gradient is the default-palette tell when it spans two buckets and one is indigo, violet, purple or fuchsia.

const CORE = new Set(['indigo', 'violet', 'purple', 'fuchsia']);
const TW_BUCKETS = new Set(['blue', 'sky', 'indigo', 'violet', 'purple', 'fuchsia', 'pink']);
const NAMED = {
  indigo: 'indigo', slateblue: 'indigo', mediumslateblue: 'indigo', violet: 'violet', blueviolet: 'violet', mediumpurple: 'violet',
  rebeccapurple: 'purple', purple: 'purple', darkviolet: 'purple', darkorchid: 'purple', fuchsia: 'fuchsia', magenta: 'fuchsia',
  orchid: 'fuchsia', pink: 'pink', hotpink: 'pink', deeppink: 'pink', blue: 'blue', royalblue: 'blue', dodgerblue: 'blue', deepskyblue: 'blue',
};
const bucket = (h, table) => (table.find(([lo, hi]) => h >= lo && h < hi) || [])[2] || null;
const HSL_BUCKETS = [[200, 235, 'blue'], [235, 255, 'indigo'], [255, 280, 'violet'], [280, 295, 'purple'], [295, 315, 'fuchsia'], [315, 345, 'pink']];
const OKLCH_BUCKETS = [[240, 268, 'blue'], [268, 285, 'indigo'], [285, 300, 'violet'], [300, 315, 'purple'], [315, 335, 'fuchsia'], [335, 360, 'pink'], [0, 5, 'pink']];

function hslBucket(h, s, l) { return s < 0.35 || l < 0.2 || l > 0.85 ? null : bucket(h, HSL_BUCKETS); }

function rgbBucket(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, d = max - min;
  if (!d) return null;
  const s = d / (1 - Math.abs(2 * l - 1));
  const h = ((max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4) * 60 + 360) % 360;
  return hslBucket(h, s, l);
}

function colorBucket(token) {
  const t = token.toLowerCase();
  if (NAMED[t]) return NAMED[t];
  const hex = /^#([0-9a-f]{3,8})$/.exec(t);
  if (hex) {
    const h = hex[1].length <= 4 ? [...hex[1]].map((c) => c + c).join('') : hex[1];
    return rgbBucket(parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16));
  }
  const a = t.match(/-?[\d.]+%?/g) || [];
  if (a.length < 3) return null;
  const pct = (x, scale) => (x.endsWith('%') ? (parseFloat(x) / 100) * scale : parseFloat(x));
  if (t.startsWith('rgb')) return rgbBucket(pct(a[0], 255), pct(a[1], 255), pct(a[2], 255));
  if (t.startsWith('hsl')) return hslBucket(parseFloat(a[0]), parseFloat(a[1]) / 100, parseFloat(a[2]) / 100);
  if (t.startsWith('oklch')) return pct(a[1], 0.4) < 0.08 ? null : bucket(parseFloat(a[2]), OKLCH_BUCKETS);
  return null;
}

function isDefaultPair(buckets) {
  const set = new Set(buckets.filter(Boolean));
  return set.size >= 2 && [...set].some((b) => CORE.has(b));
}

function cssGradientBuckets(value) {
  const out = [];
  for (const g of value.matchAll(/(?:repeating-)?(?:linear|radial|conic)-gradient\(((?:[^()]|\([^()]*\))*)\)/gi)) {
    for (const c of g[1].matchAll(/#[0-9a-f]{3,8}\b|(?:rgba?|hsla?|oklch)\([^)]*\)|\b[a-z]+\b/gi)) out.push(colorBucket(c[0]));
  }
  return out;
}

function twStopBucket(base) {
  const m = /^(?:from|via|to)-(?:([a-z]+)-\d{2,3}(?:\/\d+)?|\[(#[0-9a-fA-F]{3,8}|(?:rgb|hsl|oklch)\([^\]]*\))\])$/.exec(base);
  if (!m) return undefined;
  if (m[2]) return colorBucket(m[2].replace(/_/g, ' '));
  return TW_BUCKETS.has(m[1]) ? m[1] : null;
}

// ---------- shared value tests ----------

const LAYOUT = /^(width|height|(min|max)-(width|height)|top|left|right|bottom|inset|margin(-[a-z-]+)?|padding(-[a-z-]+)?)$/;
const TIMING = /^(-?[\d.]+m?s|ease|ease-in|ease-out|ease-in-out|linear|step-start|step-end|fn)$/;
const ENTER_NAME = /(?:^|[-_\s])(?:in|enter|appear|show|open|reveal)\b|(?:fade|slide|zoom|scale|pop)-?in\b|[a-z](?:In|Enter|Appear|Show|Open)\b/;
const REDUCED = /prefers-reduced-motion|useReducedMotion|motion-reduce:|motion-safe:|reducedMotion|matchMedia\([^)]*reduce/;
const ANIM_IMPORT = /\bfrom\s+['"](framer-motion|motion\/react|motion|gsap|gsap\/[\w-]+|animejs|react-spring|@react-spring\/\w+|@formkit\/auto-animate[\w/-]*)['"]/;

function transitionParts(value) {
  if (/var\(/.test(value)) return [];
  return value.split(',').map((p) => p.trim().replace(/[a-z-]+\([^)]*\)/gi, 'fn').split(/\s+/));
}

function overshoot(text) {
  for (const m of text.matchAll(/cubic-bezier\(\s*([-\d.]+)[\s,_]+([-\d.]+)[\s,_]+([-\d.]+)[\s,_]+([-\d.]+)\s*\)/g)) {
    const y1 = +m[2], y2 = +m[4];
    if (y1 < 0 || y1 > 1 || y2 < 0 || y2 > 1) return true;
  }
  return false;
}

const magicZ = (n) => /^9{3,}$/.test(String(n)) || n >= 10000;

function shadowMaxBlur(value) {
  let max = 0;
  for (const layer of value.replace(/\([^)]*\)/g, '').split(',')) {
    const lens = [...layer.matchAll(/(-?[\d.]+)(px|rem)?\b/g)].map((m) => toPx(+m[1], m[2] || 'px'));
    if (lens.length >= 3) max = Math.max(max, lens[2]);
  }
  return max;
}

const isFocusVariant = (v) => /(^|-)focus(-visible|-within)?$|^data-\[?(highlighted|selected|focus|active)|^aria-selected|^has-\[.*focus/.test(v);

// ---------- rules ----------

export const rules = [
  {
    id: 'transition-all', severity: 'error', kinds: ALL,
    message: 'transition on all properties', fix: 'list the properties, for example transition: opacity 200ms, transform 200ms; Tailwind transition-colors / transition-opacity / transition-transform',
    why: 'animating everything catches layout properties and makes every future style change animate.',
    *detect(ctx) {
      for (const [d] of decls(ctx, /^transition(-property)?$/)) {
        const all = d.prop === 'transition-property' ? /\ball\b/.test(d.value) : transitionParts(d.value).some((t) => t[0] === 'all' || t.every((x) => TIMING.test(x)));
        if (all) yield d;
      }
      yield* tokens(ctx, (t) => t.base === 'transition-all');
    },
  },
  {
    id: 'scale-from-zero', severity: 'error', kinds: ALL,
    message: 'element enters from scale 0', fix: 'start at scale(0.95) with opacity 0',
    why: 'nothing in the real world grows from a point; scale 0 reads as a pop.',
    misses: 'scaleX/scaleY reveals (underlines) are allowed; motion variants defined outside an initial={{...}} prop are not read.',
    *detect(ctx) {
      for (const [d, b] of decls(ctx, /^(transform|scale)$/)) {
        const zero = d.prop === 'scale' ? /^0(\s+0)*$/.test(d.value) : /(^|\s)scale(3d)?\(\s*0\s*(,\s*0\s*)*\)/.test(d.value);
        if (zero && (!inKeyframes(b) || /^(from|0%)/.test(b.prelude))) yield d;
      }
      yield* tokens(ctx, (t) => t.base === 'scale-0');
      if (ctx.kind !== 'css') for (const m of ctx.code.matchAll(/\binitial=\{\{[^}]*?\bscale\s*:\s*0(?![.\d])/g)) yield { offset: m.index };
    },
  },
  {
    id: 'layout-animation', severity: 'error', kinds: ALL,
    message: 'animates a layout property', fix: 'animate transform, opacity, filter or clip-path instead',
    why: 'width, height, top, left and margin trigger layout on every frame and stutter.',
    misses: 'accordions sized by a library panel or content height variable (Radix, Reka, Bits, React Aria) are allowed; JS animation of layout props is not read.',
    *detect(ctx) {
      for (const [d, b] of decls(ctx, /^transition(-property)?$/)) {
        if (transitionParts(d.value).some((t) => LAYOUT.test(t[0])) && !b.decls.some((x) => PANEL_SIZE.test(x.value))) yield d;
      }
      const frames = new Map();
      for (const b of ctx.css) if (inKeyframes(b)) { const k = b.parents.join('|'); frames.set(k, [...(frames.get(k) || []), ...b.decls]); }
      for (const ds of frames.values()) {
        if (ds.some((x) => PANEL_SIZE.test(x.value))) continue;
        const d = ds.find((x) => LAYOUT.test(x.prop));
        if (d) yield d;
      }
      yield* tokens(ctx, (t, list) => { const m = /^transition-\[([^\]]+)\]$/.exec(t.base); return m && m[1].split(',').some((p) => LAYOUT.test(p.trim())) && !list.some((x) => PANEL_SIZE.test(x.base)); });
    },
  },
  {
    id: 'ease-in-enter', severity: 'error', kinds: ALL,
    message: 'ease-in on an entering element', fix: 'use ease-out, cubic-bezier(0.22, 1, 0.36, 1)',
    why: 'ease-in starts slow, so the element feels late exactly when the user is waiting for it.',
    misses: 'best effort: needs an enter-named animation (fadeIn, slide-in, enter), an enter selector (-enter, [data-state=open]) or Tailwind animate-in; JS easing configs are not read.',
    *detect(ctx) {
      const easeIn = /\bease-in\b(?!-)/;
      for (const b of ctx.css) {
        const anim = b.decls.find((d) => /^animation(-name)?$/.test(d.prop));
        const enterSel = /enter|\bopen\b|\bshow\b|appear|data-state=["']?open/i.test(b.prelude);
        for (const d of b.decls) {
          if (/^animation(-timing-function)?$/.test(d.prop) && easeIn.test(d.value) && anim && ENTER_NAME.test(anim.value.replace(/\bease(-in|-out|-in-out)?\b/g, ''))) yield d;
          else if (/^transition(-timing-function)?$/.test(d.prop) && easeIn.test(d.value) && enterSel) yield d;
        }
      }
      yield* tokens(ctx, (t, list) => t.base === 'ease-in' && (t.variants.some((v) => /open|starting|enter/.test(v)) || (!t.variants.length && list.some((x) => x.base === 'animate-in' && !x.variants.length))));
    },
  },
  {
    id: 'outline-removed', severity: 'error', kinds: ALL,
    message: 'focus outline removed with no visible replacement', fix: 'add focus-visible:ring-2 focus-visible:ring-offset-2 (or a :focus-visible outline) in the same rule or class list',
    why: 'keyboard users lose their place on the page.',
    misses: 'Tailwind: fires on native focusable tags, tabIndex elements and components or variables named like controls (Button, Input, Trigger, buttonVariants), and on explicit focus:outline-none in unattached class strings. Containers (dialogs, menus, listboxes), text fields that draw no frame of their own (embedded in a framed wrapper), stretched inset-0 overlays, and classes whose own CSS rule sets focus styles are skipped. CSS is skipped when the file mentions focus-visible.',
    *detect(ctx) {
      if (!/focus-visible/.test(ctx.code)) {
        for (const [d, b] of decls(ctx, /^outline(-style)?$/)) {
          if (!/^(none|0)(\s|$)/.test(d.value)) continue;
          if (/:not\(:focus-visible\)|tabindex=["']?-1/.test(b.prelude)) continue;
          if (b.decls.some((x) => (x.prop === 'box-shadow' || /^border(-color)?$/.test(x.prop)) && !/^(none|0)$/.test(x.value))) continue;
          yield d;
        }
      }
      const removes = (t) => /^outline-(none|0|hidden)$/.test(t.base);
      yield* tokens(ctx, (t, list) => removes(t)
        && (focusable(list) || (!list.tag && t.variants.some(isFocusVariant)))
        && (!t.variants.length || t.variants.some(isFocusVariant))
        && !list.some((x) => x.variants.some(isFocusVariant) && !removes(x))
        && !list.some((x) => ctx.project.focusClasses.has(x.base))
        && !embeddedField(list) && !stretchedOverlay(list));
    },
  },
  {
    id: 'zindex-magic', severity: 'error', kinds: ALL,
    message: 'magic z-index', fix: 'use the named scale: dropdown 1000, sticky 1100, overlay 1200, modal 1300, toast 1400, tooltip 1500',
    why: '999 and 9999 start an arms race; a named scale makes stacking intentional.',
    *detect(ctx) {
      for (const [d] of decls(ctx, /^z-index$/)) if (/^\d+$/.test(d.value) && magicZ(+d.value)) yield d;
      yield* tokens(ctx, (t) => { const m = /^z-\[(\d+)\]$/.exec(t.base); return m && magicZ(+m[1]); });
      if (ctx.kind !== 'css') for (const m of ctx.code.matchAll(/\bzIndex\s*:\s*['"]?(\d+)/g)) if (magicZ(+m[1])) yield { offset: m.index };
    },
  },
  {
    id: 'tiny-text', severity: 'error', kinds: ALL,
    message: 'text below 12px', fix: 'use 12px or more; 14px for dense secondary text, 16px for reading text',
    why: 'below 12px text fails legibility on every screen.',
    misses: 'em and percentage sizes, SVG font-size attributes and JS style objects are not read.',
    *detect(ctx) {
      for (const [d] of decls(ctx, /^font-size$/)) {
        const m = /^([\d.]+)(px|rem)$/.exec(d.value);
        const px = m && toPx(+m[1], m[2]);
        if (px > 0 && px < 12) yield d;
      }
      yield* tokens(ctx, (t) => { const m = /^text-\[(?:length:)?([\d.]+)(px|rem)\]$/.exec(t.base); const px = m && toPx(+m[1], m[2]); return px > 0 && px < 12; });
    },
  },
  {
    id: 'motion-no-reduced', severity: 'error', kinds: ALL, project: true,
    message: 'animation present but nothing in the scan handles prefers-reduced-motion', fix: 'add @media (prefers-reduced-motion: reduce) rules, Tailwind motion-reduce: / motion-safe: variants, or useReducedMotion()',
    why: 'vestibular disorders are real; parallax, scale and loops must stop when the OS asks.',
    misses: 'fires once per scan; any mention of reduced motion in any scanned file counts as handling, so scan the whole project.',
    detect(ctxs) {
      if (ctxs.some((c) => REDUCED.test(c.src))) return [];
      for (const ctx of ctxs) {
        for (const b of ctx.css) {
          if (/^@(-\w+-)?keyframes/i.test(b.prelude)) return [{ ctx, offset: b.offset }];
          const d = b.decls.find((x) => /^animation(-name)?$/.test(x.prop) && !/^(none|initial|inherit|unset)$/.test(x.value));
          if (d) return [{ ctx, offset: d.offset }];
        }
        const t = tokens(ctx, (x) => /^animate-(?!none$)/.test(x.base)).next().value;
        if (t) return [{ ctx, offset: t.offset }];
        const m = ctx.kind !== 'css' && ANIM_IMPORT.exec(ctx.code);
        if (m) return [{ ctx, offset: m.index }];
      }
      return [];
    },
  },
  {
    id: 'div-onclick', severity: 'error', kinds: ['markup'],
    message: 'click handler on a div or span without role and tabIndex', fix: 'use a <button>; if it must stay a div add role="button", tabIndex={0} and Enter/Space key handling',
    why: 'keyboard and screen-reader users cannot reach or activate it.',
    misses: 'elements with spread props or aria-hidden, handlers that stop propagation or delegate through event.target, and tags inside template-literal code samples are skipped.',
    *detect(ctx) {
      for (const tag of tags(ctx, 'div|span')) {
        const a = tag.attrs;
        if (!/(^|\s)(onClick|onclick|@click|v-on:click|on:click)\s*=/.test(a)) continue;
        if (/\{\s*\.\.\.|aria-hidden|stopPropagation|\.target\b/.test(a)) continue;
        if (!/(^|\s)role\s*=/.test(a) || !/(^|\s)tab[iI]ndex\s*=/.test(a)) yield tag;
      }
    },
  },
  {
    id: 'img-no-alt', severity: 'error', kinds: ['markup'],
    message: '<img> without alt', fix: 'add alt text that says what the image shows, or alt="" when it is decorative',
    why: 'screen readers announce the file name instead.',
    misses: 'elements with spread props are skipped; framework image components are not read.',
    *detect(ctx) {
      for (const tag of tags(ctx, 'img')) if (!/(^|[\s:])alt\b/.test(tag.attrs) && !/\{\s*\.\.\./.test(tag.attrs)) yield tag;
    },
  },
  {
    id: 'em-dash', severity: 'warn', kinds: ['markup', 'md'], copy: true,
    message: 'em dash (or spaced en dash / double hyphen) in copy', fix: 'rewrite with a comma, colon, semicolon, parentheses or a full stop',
    why: 'the em dash is the most recognisable machine-writing tell.',
    misses: 'copy in .js/.ts data files is not read; number ranges with an unspaced en dash are allowed.',
    *detect(ctx) {
      yield* copy(ctx, /—|(?<=\s)–(?=\s)|(?<=[^\s-] )--(?= [^\s-])/g);
    },
  },
  {
    id: 'middot-separator', severity: 'warn', kinds: ['markup', 'md'], copy: true,
    message: 'middle dot or bullet used as an inline separator', fix: 'put the items in separate elements with gap spacing, or join them with words',
    why: '"A · B · C" metadata rows are a template tell and screen readers read the glyph aloud.',
    *detect(ctx) {
      yield* copy(ctx, /(?<=\S)[ \t]+[·•][ \t]+(?=\S)|&(?:middot|bull);/g);
      yield* copy(ctx, /^\s*[·•]\s*$/g, (s) => s.string || s.node);
    },
  },
  {
    id: 'placeholder-residue', severity: 'error', kinds: ['markup', 'md'], copy: true,
    message: 'placeholder copy left in', fix: 'write the real copy for this product',
    why: 'lorem ipsum and [Company Name] ship more often than anyone admits.',
    *detect(ctx) {
      yield* copy(ctx, /\[(?:Your|Company|Product|Brand|Client|Insert) [A-Z][a-z]+(?: [A-Z][a-z]+)?\](?![ (])/g);
      yield* copy(ctx, /\blorem ipsum\b|\byour (?:text|title|headline|content|tagline|description) (?:goes )?here\b|\binsert (?:text|copy|content) here\b/gi);
    },
  },
  {
    id: 'waiver-invalid', severity: 'error', kinds: [...ALL, 'md'], copy: true,
    message: 'finesse-ignore waiver needs a known rule id and a reason of 8+ characters', fix: 'write finesse-ignore <rule-id>: <why this case is intentional>',
    why: 'a waiver without a reason is just a mute button.',
    *detect(ctx) {
      for (const w of ctx.waivers) if (!w.valid) yield w;
    },
  },
  {
    id: 'default-gradient', severity: 'warn', kinds: ALL,
    message: 'violet/indigo/purple gradient (the default AI palette)', fix: 'use the brand accent as a flat fill, or a gradient within one hue family',
    why: 'violet-to-blue and violet-to-pink gradients mark a page as generated unless the brand asked for them.',
    misses: 'gradients built from CSS variables are not resolved.',
    *detect(ctx) {
      for (const [d] of decls(ctx, /^(background|background-image)$/)) if (isDefaultPair(cssGradientBuckets(d.value))) yield d;
      for (const list of ctx.classes) {
        const g = list.find((t) => /^bg-(gradient-to-|linear-|radial|conic)/.test(t.base));
        if (g && isDefaultPair(list.map((t) => twStopBucket(t.base)).filter((f) => f !== undefined))) yield g;
      }
    },
  },
  {
    id: 'gradient-text', severity: 'warn', kinds: ALL,
    message: 'gradient-filled text', fix: 'use a solid text colour; put emphasis in weight, size or the accent colour',
    why: 'clipped gradient headlines are a stock template move and lose contrast.',
    *detect(ctx) {
      for (const b of ctx.css) {
        const clip = b.decls.find((d) => /background-clip$/.test(d.prop) && /^text$/.test(d.value));
        if (clip && b.decls.some((d) => /^(color|-webkit-text-fill-color)$/.test(d.prop) && d.value === 'transparent')) yield clip;
      }
      for (const list of ctx.classes) {
        const clip = list.find((t) => t.base === 'bg-clip-text');
        if (clip && hasBase(list, /^text-transparent$/)) yield clip;
      }
    },
  },
  {
    id: 'side-stripe', severity: 'warn', kinds: ALL,
    message: 'coloured left-border accent on a rounded box', fix: 'mark the state with a tinted background, an icon or a heading instead',
    why: 'the thick coloured left stripe on a rounded card is a dashboard-template tell.',
    misses: 'square-cornered blockquotes are allowed; CSS needs border-left and border-radius in the same rule.',
    *detect(ctx) {
      for (const b of ctx.css) {
        const radius = b.decls.some((d) => d.prop === 'border-radius' && !/^0(px)?$/.test(d.value));
        const stripe = b.decls.find((d) => /^border-(left|inline-start)$/.test(d.prop) && (/(^|\s)([2-9]|\d\d)px\b/.test(d.value)) && !/transparent|none/.test(d.value));
        if (radius && stripe) yield stripe;
      }
      const neutral = /^(gray|slate|zinc|neutral|stone|border|input|transparent|white|black|current|inherit|solid|dashed|dotted|double|none|muted|background|foreground)/;
      for (const list of ctx.classes) {
        const width = list.find((t) => { const m = /^border-[ls]-(\d+|\[(\d+)px\])$/.exec(t.base); return m && +(m[2] || m[1]) >= 2 && !t.variants.length; });
        if (!width) continue;
        const color = list.some((t) => { const m = /^border-(?:[ls]-)?([a-z]+)/.exec(t.base); return m && !/^[xytbrlse]$/.test(m[1]) && !neutral.test(m[1]); });
        const rounded = list.some((t) => /^rounded(?!-none$)(?!-[lse]{1,2}-none$)/.test(t.base));
        if (color && rounded) yield width;
      }
    },
  },
  {
    id: 'ghost-card', severity: 'warn', kinds: ALL,
    message: 'border plus a shadow blur over 12px', fix: 'keep the border and drop the shadow to blur 12px or less, or keep the shadow and drop the border',
    why: 'a hairline plus a big soft shadow draws two edges and looks muddy.',
    *detect(ctx) {
      for (const b of ctx.css) {
        const border = b.decls.some((d) => /^border$/.test(d.prop) && !/^(none|0)/.test(d.value));
        const shadow = b.decls.find((d) => d.prop === 'box-shadow' && shadowMaxBlur(d.value) > 12);
        if (border && shadow) yield shadow;
      }
      for (const list of ctx.classes) {
        const plain = list.filter((t) => !t.variants.length);
        const shadow = plain.find((t) => /^shadow-(lg|xl|2xl)$/.test(t.base));
        if (shadow && plain.some((t) => /^border(-\d|-\[\d)?$/.test(t.base) && !/^border-0$/.test(t.base)) && !plain.some((t) => /^border-(0|none|transparent)$/.test(t.base))) yield shadow;
      }
    },
  },
  {
    id: 'over-rounded', severity: 'warn', kinds: ALL,
    message: 'radius above 24px on a box', fix: 'cards 12 to 16px, modals 16 to 20px, never above 24px; use a full pill only for pills',
    why: 'bubble-rounded cards read as a template default.',
    misses: 'best effort: values of 100px or more, controls (button, link, input, badge, tab by tag, component, variable or selector name) and boxes 64px tall or less are treated as pills; rounded-3xl is exactly 24px and allowed.',
    *detect(ctx) {
      for (const [d, b] of decls(ctx, /^border(-[a-z]+)*-radius$/)) {
        if (PILL_NAME.test(b.prelude) || /circle|round|dot|thumb|fab/i.test(b.prelude)) continue;
        if ([...d.value.matchAll(/([\d.]+)(px|rem)\b/g)].some((m) => { const px = toPx(+m[1], m[2]); return px > 24 && px < 100; })) yield d;
      }
      yield* tokens(ctx, (t, list) => {
        if (pillish(list)) return false;
        if (/^rounded(-[tblrse]{1,2})?-4xl$/.test(t.base)) return true;
        const m = /^rounded(?:-[tblrse]{1,2})?-\[([\d.]+)(px|rem)\]$/.exec(t.base);
        const px = m && toPx(+m[1], m[2]);
        return px > 24 && px < 100;
      });
    },
  },
  {
    id: 'pure-black-white', severity: 'warn', kinds: ALL,
    message: 'pure #000 or #fff as text or background', fix: 'use tinted neutrals: ink around oklch(0.18 0.01 <brand hue>), paper around oklch(0.985 0.005 <brand hue>)',
    why: 'pure black and white are harsher than any designed palette and flatten depth.',
    misses: 'Tailwind text-white is allowed (white on a coloured fill is normal); alpha forms like bg-black/50 are allowed.',
    *detect(ctx) {
      const pure = /^(#000|#000000|#fff|#ffffff|black|white|rgb\(\s*0\s*,\s*0\s*,\s*0\s*\)|rgb\(\s*255\s*,\s*255\s*,\s*255\s*\))$/i;
      for (const [d, b] of decls(ctx, /^(color|background|background-color)$/)) {
        if (pure.test(d.value) && !b.parents.some((p) => /print|forced-colors/.test(p))) yield d;
      }
      yield* tokens(ctx, (t) => /^(bg-black|bg-white|text-black)$/.test(t.base));
    },
  },
  {
    id: 'off-scale-spacing', severity: 'warn', kinds: ALL,
    message: 'spacing off the 4px grid', fix: 'use 4, 8, 12, 16, 24, 32, 48, 64, 96 or 128px',
    why: 'off-grid values break rhythm in ways the eye notices before the mind does.',
    misses: 'px values only; values of 3px or less either way are optical nudges, and a negative margin of half a width or height set in the same rule or class list (centring a marker) is allowed. rem, calc() and Tailwind fractional steps like p-1.5 are not read.',
    *detect(ctx) {
      const off = (n, halves) => Math.abs(n) > 3 && n % 4 !== 0 && !(n < 0 && halves.has(-n * 2));
      for (const [d, b] of decls(ctx, /^(padding|margin|gap|row-gap|column-gap)(-[a-z-]+)?$/)) {
        const halves = new Set(b.decls.filter((x) => /^(width|height|inline-size|block-size)$/.test(x.prop)).map((x) => parseFloat(/^([\d.]+)px$/.exec(x.value)?.[1])));
        if (!/calc\(/.test(d.value) && [...d.value.matchAll(/(-?[\d.]+)px\b/g)].some((m) => off(+m[1], d.prop.startsWith('margin') ? halves : new Set()))) yield d;
      }
      yield* tokens(ctx, (t, list) => {
        const m = /^(-?)(?:p[xytrblse]?|(m)[xytrblse]?|gap(?:-[xy])?|space-[xy])-\[(-?[\d.]+)px\]$/.exec(t.base);
        if (!m) return false;
        const n = (m[1] ? -1 : 1) * +m[3];
        const halves = new Set(m[2] ? list.map((x) => +(/^(?:w|h|size)-\[([\d.]+)px\]$/.exec(x.base)?.[1])) : []);
        return off(n, halves);
      });
    },
  },
  {
    id: 'href-hash', severity: 'warn', kinds: ['markup'],
    message: 'link to "#" or an empty href', fix: 'point it at a real destination, use a <button> for an action, or leave the control inert and say so in the report',
    why: 'a dead link looks finished, jumps the page to the top and tells nobody the destination is missing.',
    misses: 'fragment links to an id (#pricing) are allowed; hrefs built in script are not read.',
    *detect(ctx) {
      for (const tag of tags(ctx, 'a|area')) if (/(^|\s)href\s*=\s*(?:\{\s*)?(["'`])#?\2/.test(tag.attrs)) yield tag;
    },
  },
  {
    id: 'display-leading', severity: 'warn', kinds: ALL,
    message: 'line-height below 1 on text 32px or larger', fix: 'display line-height 1.05 to 1.2; Tailwind leading-tight or leading-[1.1]',
    why: 'below 1 the lines of a wrapped heading collide and descenders clip at the box edge.',
    misses: 'needs the font-size and line-height in the same rule or class list; ::before and ::after glyphs and line-height 0 are skipped; clamp() counts its largest px or rem value.',
    *detect(ctx) {
      const bigPx = (v) => Math.max(0, ...[...v.matchAll(/([\d.]+)(px|rem)\b/g)].map((m) => toPx(+m[1], m[2])));
      const tight = (v) => { const m = /^([\d.]+)(%|em)?$/.exec(v); if (!m || +m[1] === 0) return false; return m[2] === '%' ? +m[1] < 100 : +m[1] < 1; };
      for (const b of ctx.css) {
        if (/::?(before|after)/.test(b.prelude)) continue;
        const size = b.decls.find((d) => d.prop === 'font-size' && bigPx(d.value) >= 32);
        const lh = b.decls.find((d) => d.prop === 'line-height' && tight(d.value));
        if (size && lh) yield lh;
      }
      const TW_BIG = /^text-(?:[4-9]xl|\[([\d.]+)(px|rem)\])(?:\/(?:\[([\d.]+)\]|none))?$/;
      for (const list of ctx.classes) {
        const plain = list.filter((t) => !t.variants.length);
        const size = plain.find((t) => { const m = TW_BIG.exec(t.base); return m && (!m[1] || toPx(+m[1], m[2]) >= 32); });
        if (!size) continue;
        const slash = /\/\[([\d.]+)\]$/.exec(size.base);
        if (slash && +slash[1] > 0 && +slash[1] < 1) { yield size; continue; }
        const lead = plain.find((t) => { const m = /^leading-\[([\d.]+)\]$/.exec(t.base); return m && +m[1] > 0 && +m[1] < 1; });
        if (lead) yield lead;
      }
    },
  },
  {
    id: 'bounce-easing', severity: 'warn', kinds: ALL,
    message: 'bounce or overshoot easing', fix: 'use cubic-bezier(0.22, 1, 0.36, 1); keep overshoot for playful marketing moments only',
    why: 'overshoot on product UI feels toy-like and slows perceived response.',
    *detect(ctx) {
      for (const block of ctx.css) for (const d of block.decls) {
        if (overshoot(d.value) || (/^animation(-name)?$/.test(d.prop) && /\bbounce\b/i.test(d.value))) yield d;
      }
      yield* tokens(ctx, (t) => t.base === 'animate-bounce' || overshoot(t.base));
    },
  },
  {
    id: 'tight-tracking', severity: 'warn', kinds: ALL,
    message: 'letter-spacing tighter than -0.04em', fix: 'display tracking -0.02em to -0.04em; Tailwind tracking-tight',
    why: 'past -0.04em letters collide at real rendering sizes.',
    misses: 'px letter-spacing is not read because its em value depends on font size.',
    *detect(ctx) {
      for (const [d] of decls(ctx, /^letter-spacing$/)) { const m = /^(-[\d.]+)em$/.exec(d.value); if (m && +m[1] < -0.0401) yield d; }
      yield* tokens(ctx, (t) => { if (t.base === 'tracking-tighter') return true; const m = /^tracking-\[(-[\d.]+)em\]$/.exec(t.base); return m && +m[1] < -0.0401; });
    },
  },
  {
    id: 'heavy-display', severity: 'warn', kinds: ALL,
    message: 'font-weight 800 or 900', fix: 'display weight 500 to 600; size and tracking carry the hierarchy',
    why: 'black weights are the unconsidered default for "bold" hero text.',
    *detect(ctx) {
      for (const [d] of decls(ctx, /^font-weight$/)) if (/^(800|900)$/.test(d.value)) yield d;
      yield* tokens(ctx, (t) => t.base === 'font-extrabold' || t.base === 'font-black');
    },
  },
  {
    id: 'slop-copy', severity: 'warn', kinds: ['markup', 'md'], copy: true,
    message: 'stock marketing vocabulary', fix: 'say what the product does in concrete words and numbers',
    why: 'seamless, elevate, unleash and friends signal that nobody wrote this on purpose.',
    *detect(ctx) {
      yield* copy(ctx, /\b(?:seamless(?:ly)?|elevate[s]?|elevating|unleash(?:es|ed|ing)?|effortless(?:ly)?|cutting[- ]edge|revolutionary|revolutioni[sz]e[sd]?|robust|leverag(?:e|es|ed|ing)|delv(?:e|es|ed|ing)|game[- ]chang(?:er|ing)|next[- ]generation|supercharg(?:e|es|ed|ing)|unlock (?:the|your) (?:full )?(?:power|potential)|in today's (?:fast-paced|digital)|to the next level|world-class|best-in-class)\b/gi);
    },
  },
  {
    id: 'emoji-icon', severity: 'warn', kinds: ['markup'],
    message: 'emoji used as a UI icon', fix: 'use the project icon set (lucide, heroicons, phosphor) at a consistent size and stroke',
    why: 'emoji render differently per platform and read as placeholder art.',
    misses: 'only emoji that lead a text node or sit in an icon prop are read; flags are allowed.',
    *detect(ctx) {
      const emoji = '(?:(?![\\u{1F1E6}-\\u{1F1FF}])\\p{Emoji_Presentation})';
      yield* copy(ctx, new RegExp(`^\\s*${emoji}`, 'gu'), (s) => s.node);
      for (const m of ctx.code.matchAll(new RegExp(`\\bicon\\w*\\s*[:=]\\s*\\{?\\s*["'\`]${emoji}+\\uFE0F?["'\`]`, 'giu'))) yield { offset: m.index };
    },
  },
  {
    id: 'hover-ungated-scale', severity: 'warn', kinds: ALL,
    message: 'hover scale not gated for touch, or above 1.03', fix: 'wrap hover effects in @media (hover: hover) and (pointer: fine); keep zoom at 1.03 or less and lift at 2px or less',
    why: 'touch devices fire sticky hover states, and big hover zooms look cheap.',
    misses: 'best effort: CSS :hover rules with a scale outside a hover media query, and Tailwind hover:scale above 103.',
    *detect(ctx) {
      for (const b of ctx.css) {
        if (!/:hover/.test(b.prelude) || b.parents.some((p) => /hover\s*:\s*hover/.test(p))) continue;
        const d = b.decls.find((x) => /^(transform|scale)$/.test(x.prop) && (/scale(3d)?\(\s*1\.\d*[1-9]/.test(x.value) || /^1\.\d*[1-9]/.test(x.value)));
        if (d) yield d;
      }
      yield* tokens(ctx, (t) => {
        if (!t.variants.some(isInteractive)) return false;
        const m = /^scale-(?:(\d+)|\[([\d.]+)\])$/.exec(t.base);
        return m && (m[1] ? +m[1] > 103 : +m[2] > 1.03);
      });
    },
  },
];

const RULE = new Map(rules.map((r) => [r.id, r]));

// ---------- engine ----------

function parseWaivers(comments, lineOf) {
  const out = [];
  for (const c of comments) {
    for (const m of c.text.matchAll(/finesse-ignore\b[ \t]*([a-z0-9-]*)(?:[ \t]*:[ \t]*([^\n]*))?/g)) {
      const reason = (m[2] || '').replace(/\s*(\*\/|-->|\}).*$/, '').trim();
      const offset = c.offset + m.index;
      out.push({ rule: m[1], line: lineOf(offset), offset, valid: RULE.has(m[1]) && reason.length >= 8 });
    }
  }
  return out;
}

function context(file) {
  const ext = extname(file).toLowerCase();
  const kind = KIND[ext];
  const src = readFileSync(file, 'utf8');
  const lineOf = lineIndex(src);
  const { code, comments, templates } = kind === 'md' ? stripMarkdown(src) : stripComments(src, { slashLine: ext !== '.css' && ext !== '.html', html: kind === 'markup' });
  const ctx = { file, ext, kind, src, code, templates, lineOf };
  ctx.waivers = parseWaivers(comments, lineOf);
  let css, classes, copySegs;
  Object.defineProperties(ctx, {
    css: { get: () => (css ??= kind === 'md' ? [] : cssBlocks(ctx)) },
    classes: { get: () => (classes ??= kind === 'md' ? [] : classLists(ctx)) },
    copy: { get: () => (copySegs ??= copySegments(ctx)) },
  });
  return ctx;
}

function collect(paths) {
  const out = [];
  const walk = (p, explicit) => {
    const st = explicit ? statSync(p) : lstatSync(p);
    if (st.isSymbolicLink()) return;
    if (st.isDirectory()) {
      const name = basename(p);
      if (!explicit && (SKIP_DIRS.has(name) || name.startsWith('.'))) return;
      for (const e of readdirSync(p).sort()) walk(join(p, e), false);
    } else if (KIND[extname(p).toLowerCase()] && (explicit || (!/\.min\.\w+$/.test(p) && st.size < 1_000_000))) out.push(p);
  };
  for (const p of paths) walk(resolve(p), true);
  return out;
}

export function selectRules({ only, skip, copyOnly } = {}) {
  for (const id of [...(only || []), ...(skip || [])]) if (!RULE.has(id)) throw new Error(`unknown rule id: ${id}`);
  return rules.filter((r) => (!only?.length || only.includes(r.id)) && !skip?.includes(r.id) && (!copyOnly || r.copy));
}

export function scan(paths = ['.'], opts = {}) {
  const active = selectRules(opts);
  const ctxs = collect(paths).map(context);
  const project = { focusClasses: new Set() };
  for (const ctx of ctxs) {
    ctx.project = project;
    for (const b of ctx.css) {
      if (!/:focus/.test(b.prelude) && !b.applies.some((a) => tokenize(a, 0).some((t) => t.variants.some(isFocusVariant)))) continue;
      for (const m of b.prelude.matchAll(/\.([\w-]+)/g)) project.focusClasses.add(m[1]);
    }
  }
  const raw = [];
  const add = (rule, ctx, hit) => raw.push({ ctx, rule, line: ctx.lineOf(hit.offset) });
  for (const rule of active) {
    if (rule.project) { for (const hit of rule.detect(ctxs.filter((c) => rule.kinds.includes(c.kind)))) add(rule, hit.ctx, hit); continue; }
    for (const ctx of ctxs) if (rule.kinds.includes(ctx.kind)) for (const hit of rule.detect(ctx)) add(rule, ctx, hit);
  }
  const seen = new Set();
  const findings = [];
  for (const f of raw) {
    const waived = f.rule.id !== 'waiver-invalid' && f.ctx.waivers.some((w) => w.valid && w.rule === f.rule.id && (w.line === f.line || w.line === f.line - 1));
    const key = `${f.ctx.file}:${f.line}:${f.rule.id}`;
    if (waived || seen.has(key)) continue;
    seen.add(key);
    findings.push({ file: f.ctx.file, line: f.line, severity: f.rule.severity, rule: f.rule.id, message: f.rule.message, fix: f.rule.fix });
  }
  findings.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line || a.rule.localeCompare(b.rule));
  const errors = findings.filter((f) => f.severity === 'error').length;
  return { files: ctxs.length, findings, errors, warnings: findings.length - errors };
}

// ---------- CLI ----------

const USAGE = `usage: node check.mjs [path ...] [--json] [--rules] [--only a,b] [--skip a,b] [--copy-only]`;

function main(argv) {
  const opts = { only: [], skip: [] };
  const paths = [];
  let json = false, list = false;
  for (let i = 0; i < argv.length; i++) {
    const [flag, inline] = argv[i].split(/=(.*)/s);
    const value = () => (inline ?? argv[++i] ?? '').split(',').map((s) => s.trim()).filter(Boolean);
    if (flag === '--json') json = true;
    else if (flag === '--rules') list = true;
    else if (flag === '--copy-only') opts.copyOnly = true;
    else if (flag === '--only') opts.only.push(...value());
    else if (flag === '--skip') opts.skip.push(...value());
    else if (flag === '--help' || flag === '-h') { console.log(USAGE); return 0; }
    else if (flag.startsWith('--')) { console.error(`unknown flag ${flag}\n${USAGE}`); return 2; }
    else paths.push(argv[i]);
  }
  if (list) {
    if (json) { console.log(JSON.stringify(rules.map(({ id, severity, why, misses = null, copy = false }) => ({ id, severity, why, misses, copy })), null, 2)); return 0; }
    for (const r of rules) console.log(`${r.id.padEnd(20)} ${r.severity.padEnd(5)}  ${r.why}${r.misses ? `\n${' '.repeat(28)}limits: ${r.misses}` : ''}`);
    return 0;
  }
  let result;
  try { result = scan(paths.length ? paths : ['.'], opts); }
  catch (e) { console.error(`finesse: ${e.message}`); return 2; }
  const rel = (f) => relative(process.cwd(), f) || basename(f);
  if (json) {
    console.log(JSON.stringify({ ...result, findings: result.findings.map((f) => ({ ...f, file: rel(f.file) })) }, null, 2));
  } else {
    for (const f of result.findings) console.log(`${rel(f.file)}:${f.line}  ${f.severity}  ${f.rule}  ${f.message}  (fix: ${f.fix})`);
    console.log(result.errors ? `FINESSE: FAIL ${result.errors} errors, ${result.warnings} warnings` : 'FINESSE: PASS');
  }
  return result.errors ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) process.exitCode = main(process.argv.slice(2));
