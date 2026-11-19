#!/usr/bin/env node
/**
 * Theme lint: the ONE rule every admin screen follows so light and dark mode look the same everywhere.
 *
 *   RULE: never hard-code a light-only colour. Use the theme tokens (they switch with the theme):
 *     bg-surface / bg-surface-2      instead of bg-white, bg-slate-50..300
 *     text-fg / text-fg-secondary / text-fg-muted   instead of text-slate-400..900
 *     border-line / divide-line      instead of border-slate-100..400
 *   Coloured chips (bg-emerald-50, text-rose-700, border-amber-200, from-orange-50 to-white ...) need a `dark:` partner in the SAME class string:
 *     bg-emerald-50 dark:bg-emerald-500/10 · text-rose-700 dark:text-rose-300 · border-amber-200 dark:border-amber-500/30
 *
 *   Exception (automatic): the round white knob of a toggle switch (rounded-full + bg-white + transition-transform) stays white in both themes.
 *   A file that is light on purpose (printable invoice, login screens) opts out with a comment: // theme-lint: allow-light (reason)
 *
 * Usage:   npm run check:theme            fails when a file has MORE violations than the baseline (new code can never add any)
 *          npm run check:theme -- --all   list every violation
 *          npm run check:theme -- --update  rewrite scripts/theme-baseline.json (only after you have FIXED things: counts should go down)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const srcDir = path.join(root, 'src');
const baselineFile = path.join(here, 'theme-baseline.json');
const args = new Set(process.argv.slice(2));

const NEUTRAL = 'slate|gray|zinc|neutral|stone';
const COLORS = 'emerald|green|rose|red|amber|yellow|orange|sky|blue|indigo|violet|purple|pink|teal|cyan|lime|fuchsia';
const VAR = '(?:hover|focus|focus-within|group-hover|disabled|active|peer-focus|first|last|odd|even|sm|md|lg|xl|placeholder|open|aria-selected|data-\\[[^\\]]+\\])';
const START = String.raw`(?<![\w:-])(?:${VAR}:)*`;
const END = String.raw`(?![\w-])`;

// [regex, utility (for the dark: partner lookup), human description]
const RULES = [
  [new RegExp(`${START}bg-white(?!/(?:[0-4]?\\d)${END})${END}`, 'g'), 'bg', 'bg-white -> bg-surface'],
  [new RegExp(`${START}bg-(?:${NEUTRAL})-(?:50|100|200|300)(?:/\\d+)?${END}`, 'g'), 'bg', 'light neutral background -> bg-surface-2'],
  [new RegExp(`${START}text-(?:${NEUTRAL})-(?:400|500|600|700|800|900|950)(?:/\\d+)?${END}`, 'g'), 'text', 'neutral text -> text-fg / text-fg-secondary / text-fg-muted'],
  [new RegExp(`${START}(?:border|divide|ring|outline)-(?:${NEUTRAL})-(?:50|100|200|300|400)(?:/\\d+)?${END}`, 'g'), 'border|divide|ring|outline', 'neutral border -> border-line / divide-line'],
  [new RegExp(`${START}bg-(?:${COLORS})-(?:50|100)(?:/\\d+)?${END}`, 'g'), 'bg', 'pastel background needs a dark: partner'],
  [new RegExp(`${START}text-(?:${COLORS})-(?:600|700|800|900)(?:/\\d+)?${END}`, 'g'), 'text', 'coloured text needs a dark: partner'],
  [new RegExp(`${START}(?:border|ring)-(?:${COLORS})-(?:100|200|300)(?:/\\d+)?${END}`, 'g'), 'border|ring', 'coloured border needs a dark: partner'],
  [new RegExp(`${START}(?:from|via|to)-(?:white|(?:${NEUTRAL}|${COLORS})-(?:50|100|200))(?:/\\d+)?${END}`, 'g'), 'from|via|to', 'light gradient stop needs a dark: partner'],
];

const strRe = /`(?:\\[\s\S]|[^`\\])*`|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'/g;
const hasDarkPartner = (seg, util) => new RegExp(String.raw`(?<![\w-])dark:(?:${VAR}:)*(?:${util})-`).test(seg);

const walk = (dir, out = []) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(jsx|js)$/.test(e.name) && !/\.(test|spec)\./.test(e.name)) out.push(p);
  }
  return out;
};

const scan = (file) => {
  const text = fs.readFileSync(file, 'utf8');
  if (/theme-lint:\s*allow-light/.test(text)) return [];
  const found = [];
  let m;
  strRe.lastIndex = 0;
  while ((m = strRe.exec(text))) {
    const seg = m[0];
    if (!/[a-z]-[a-z0-9]/.test(seg) || seg.length > 4000) continue;
    for (const [re, util, why] of RULES) {
      re.lastIndex = 0;
      let t;
      while ((t = re.exec(seg))) {
        if (hasDarkPartner(seg, util)) continue;
        // Toggle-switch knob: a round white thumb must stay white in BOTH themes (it sits on a coloured track).
        if (/^(?:[a-z-]+:)*bg-white$/.test(t[0]) && /rounded-full/.test(seg) && /transition-transform/.test(seg)) continue;
        const idx = m.index + t.index;
        found.push({ line: text.slice(0, idx).split('\n').length, cls: t[0], why });
      }
    }
  }
  return found;
};

const rel = (f) => path.relative(root, f).split(path.sep).join('/');
const results = new Map();
for (const f of walk(srcDir)) {
  const v = scan(f);
  if (v.length) results.set(rel(f), v);
}

if (args.has('--update')) {
  const files = Object.fromEntries([...results].map(([k, v]) => [k, v.length]).sort());
  fs.writeFileSync(baselineFile, JSON.stringify({ note: 'Violations that existed when the theme rule was introduced. Counts may only go DOWN. See scripts/check-theme.mjs.', files }, null, 2) + '\n');
  console.log(`baseline written: ${Object.keys(files).length} files, ${Object.values(files).reduce((a, b) => a + b, 0)} violations`);
  process.exit(0);
}

let baseline = { files: {} };
try { baseline = JSON.parse(fs.readFileSync(baselineFile, 'utf8')); } catch { /* no baseline yet: every violation counts */ }

let failed = 0;
const lines = [];
for (const [file, v] of results) {
  const allowed = baseline.files?.[file] ?? 0;
  if (v.length > allowed || args.has('--all')) {
    const isNew = v.length > allowed;
    if (isNew) failed++;
    lines.push(`\n${isNew ? 'FAIL' : 'known'} ${file}  (${v.length} found, ${allowed} allowed)`);
    for (const x of v.slice(0, args.has('--all') ? 500 : 12)) lines.push(`   ${file}:${x.line}  ${x.cls}   ${x.why}`);
    if (!args.has('--all') && v.length > 12) lines.push(`   ... and ${v.length - 12} more`);
  }
}
const total = [...results.values()].reduce((a, v) => a + v.length, 0);
const fixedSince = Object.entries(baseline.files || {}).filter(([f, n]) => (results.get(f)?.length ?? 0) < n).length;
console.log(lines.join('\n'));
console.log(`\ntheme check: ${results.size} files with light-only colours (${total} violations); ${failed} file(s) over their baseline${fixedSince ? `; ${fixedSince} file(s) improved - run with --update to lock it in` : ''}.`);
if (failed) {
  console.log('\nFix: use the theme tokens (bg-surface, bg-surface-2, text-fg, text-fg-secondary, text-fg-muted, border-line, divide-line) and add dark: partners to coloured chips. See docs/THEMING.md.');
  process.exit(1);
}
