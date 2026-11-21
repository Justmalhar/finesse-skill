import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// Enough YAML for SKILL.md frontmatter: top-level scalars, quoted strings, and > / | block scalars.
function parseFrontmatter(text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(text);
  if (!m) return null;
  const data = {};
  const lines = m[1].split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const kv = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(lines[i]);
    if (!kv) continue;
    let value = kv[2].trim();
    if (/^[>|][+-]?$/.test(value)) {
      const block = [];
      while (i + 1 < lines.length && (/^\s+\S/.test(lines[i + 1]) || lines[i + 1].trim() === '')) block.push(lines[++i].trim());
      value = value.startsWith('>') ? block.filter(Boolean).join(' ') : block.join('\n').trim();
    } else if (/^(["']).*\1$/.test(value)) value = value.slice(1, -1);
    data[kv[1]] = value;
  }
  return { data, body: text.slice(m[0].length) };
}

export function validateSkill(skillDir) {
  const problems = [];
  const file = join(skillDir, 'SKILL.md');
  const text = readFileSync(file, 'utf8');
  const fm = parseFrontmatter(text);
  if (!fm) return ['frontmatter missing'];
  const { name = '', description = '' } = fm.data;
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name)) problems.push(`name "${name}" must be lowercase letters, digits and single hyphens`);
  if (name.length > 64) problems.push('name longer than 64 characters');
  if (name !== basename(skillDir)) problems.push(`name "${name}" must equal the directory name "${basename(skillDir)}"`);
  if (description.length < 1 || description.length > 1024) problems.push(`description must be 1 to 1024 characters (has ${description.length})`);
  const bodyLines = fm.body.split('\n').length;
  if (bodyLines >= 500) problems.push(`body has ${bodyLines} lines, must be under 500`);
  const prose = text.replace(/^```[\s\S]*?^```/gm, '');
  const refs = new Set();
  for (const l of prose.matchAll(/\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) {
    const target = l[1].split('#')[0];
    if (target && !/^[a-z][a-z0-9+.-]*:/i.test(target) && !target.startsWith('/')) refs.add(target);
  }
  for (const c of text.matchAll(/`((?:references|scripts|assets|design-systems)\/[^`\s]*)[^`]*`/g)) {
    if (!/[<>*{}]/.test(c[1])) refs.add(c[1]);
  }
  for (const ref of refs) if (!existsSync(join(skillDir, ref))) problems.push(`referenced path does not exist: ${ref}`);
  return problems;
}

function withSkill(name, content, files, fn) {
  const dir = mkdtempSync(join(tmpdir(), 'finesse-skill-'));
  try {
    const skill = join(dir, name);
    mkdirSync(skill, { recursive: true });
    writeFileSync(join(skill, 'SKILL.md'), content);
    for (const f of files) { mkdirSync(dirname(join(skill, f)), { recursive: true }); writeFileSync(join(skill, f), 'x\n'); }
    return fn(skill);
  } finally { rmSync(dir, { recursive: true, force: true }); }
}

const GOOD = `---
name: demo-skill
description: >
  Builds demo things. Use when the user asks
  for a demo.
---
# Demo

Read [the guide](references/guide.md#start) and run \`scripts/run.mjs --fast\`.
Systems live in \`design-systems/<slug>/DESIGN.md\`.

\`\`\`
[ignored](references/missing.md)
\`\`\`
`;

test('a well-formed fixture skill passes', () => {
  withSkill('demo-skill', GOOD, ['references/guide.md', 'scripts/run.mjs'], (dir) => assert.deepEqual(validateSkill(dir), []));
});

test('missing frontmatter is reported', () => {
  withSkill('demo-skill', '# Demo\n', [], (dir) => assert.deepEqual(validateSkill(dir), ['frontmatter missing']));
});

test('bad names, long descriptions, long bodies and dead paths are reported', () => {
  const bad = `---\nname: Demo_Skill\ndescription: "${'x'.repeat(1025)}"\n---\n${'line\n'.repeat(500)}See [x](references/nope.md) and \`assets/none.css\`.\n`;
  withSkill('demo-skill', bad, [], (dir) => {
    const p = validateSkill(dir).join('\n');
    assert.match(p, /name "Demo_Skill" must be lowercase/);
    assert.match(p, /must equal the directory name/);
    assert.match(p, /description must be 1 to 1024 characters \(has 1025\)/);
    assert.match(p, /body has \d+ lines/);
    assert.match(p, /does not exist: references\/nope\.md/);
    assert.match(p, /does not exist: assets\/none\.css/);
  });
  withSkill('demo-skill', '---\nname: demo-skill\ndescription:\n---\nBody\n', [], (dir) => assert.match(validateSkill(dir).join(), /has 0/));
});

const skillsDir = join(root, 'skills');
const skills = existsSync(skillsDir) ? readdirSync(skillsDir).filter((d) => existsSync(join(skillsDir, d, 'SKILL.md'))) : [];
for (const s of skills) {
  test(`skills/${s}/SKILL.md follows the Agent Skills spec`, () => assert.deepEqual(validateSkill(join(skillsDir, s)), []));
}
