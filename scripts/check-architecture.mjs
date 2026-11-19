// Architecture fence for the admin app (same idea as the API's tests/architecture.test.ts). Run: npm run check:architecture
//
//   src/shared/    reusable UI, API client, helpers          may import: shared
//   src/modules/   one folder per feature                    may import: itself, shared, other modules ONLY via their index.js
//   src/app/       composition (router, layout, menu)        may import: everything
//
// Also: module dependencies have no cycles and match the pinned list below, so every new cross-module dependency is a deliberate edit.
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const SRC = path.resolve('src');

// Each module declares what it may use in its OWN src/modules/<name>/module.json ("dependsOn"). Every module with guarded screens depends on auth (its module.jsx uses <Guard>).
const readDeps = (name) => {
  const f = path.join(SRC, "modules", name, "module.json");
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")).dependsOn ?? [] : null;
};

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : /\.jsx?$/.test(p) ? [p] : [];
  });

const EXTS = ['', '.js', '.jsx', '/index.js', '/index.jsx'];
const resolve = (from, spec) => {
  const base = path.resolve(path.dirname(from), spec);
  for (const e of EXTS) {
    const p = base + e;
    if (fs.existsSync(p) && fs.statSync(p).isFile()) return p;
  }
  return null;
};

const re = /(?:from\s+|import\s+|import\s*\(\s*)['"](\.{1,2}\/[^'"]+)['"]/g;
const parts = (p) => path.relative(SRC, p).split(path.sep);
const rel = (p) => parts(p).join('/');
const zone = (p) => parts(p)[0];
const moduleOf = (p) => (zone(p) === 'modules' ? parts(p)[1] : null);
const isIndex = (p) => parts(p).length === 3 && parts(p)[2] === 'index.js';

const problems = [];
const edges = new Map();

for (const file of walk(SRC)) {
  const text = fs.readFileSync(file, 'utf8');
  for (const m of text.matchAll(re)) {
    const target = resolve(file, m[1]);
    if (!target || !target.startsWith(SRC)) continue;
    const here = zone(file);
    const there = zone(target);

    if (here === 'shared' && there !== 'shared') problems.push(`shared must not import ${there}: ${rel(file)} -> ${rel(target)}`);
    if (here === 'modules' && there === 'app') problems.push(`a module must not import app: ${rel(file)} -> ${rel(target)}`);
    if (here === 'modules' && there === 'modules') {
      const a = moduleOf(file);
      const b = moduleOf(target);
      if (a !== b) {
        if (!isIndex(target)) problems.push(`import another module only through its index.js: ${rel(file)} -> ${rel(target)}`);
        (edges.get(a) ?? edges.set(a, new Set()).get(a)).add(b);
      }
    }
    if (here !== 'app' && path.basename(target) === 'module.jsx') problems.push(`only app/ may import module.jsx: ${rel(file)}`);
  }
}

// cycles
const state = new Map();
const visit = (n, trail) => {
  if (state.get(n) === 2) return;
  if (state.get(n) === 1) return void problems.push(`module cycle: ${[...trail, n].join(' -> ')}`);
  state.set(n, 1);
  for (const next of edges.get(n) ?? []) visit(next, [...trail, n]);
  state.set(n, 2);
};
for (const n of edges.keys()) visit(n, []);

// pinned dependency list
const modulesOnDisk = fs.readdirSync(path.join(SRC, 'modules'), { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name);
for (const name of modulesOnDisk) {
  const actual = [...(edges.get(name) ?? [])].sort();
  const pinned = readDeps(name);
  if (!pinned) problems.push(`module "${name}" has no module.json (declare its dependsOn)`);
  else if (JSON.stringify(actual) !== JSON.stringify([...pinned].sort())) problems.push(`module "${name}" depends on [${actual}] but its module.json says [${pinned}]. Update its module.json on purpose.`);
}

if (problems.length) {
  console.error(`Architecture check failed (${problems.length}):\n - ${problems.join('\n - ')}`);
  process.exit(1);
}
console.log(`Architecture OK: ${modulesOnDisk.length} modules, no cycles, public APIs respected.`);
