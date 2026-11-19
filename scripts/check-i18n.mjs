// Every language file must have exactly the same keys as English, so no screen shows a half-translated menu.
// Run: npm run check:i18n  (also in CI)
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

const dir = path.resolve('src/shared/i18n/translations');
const load = async (f) => (await import(pathToFileURL(path.join(dir, f)).href)).default;
const en = await load('en.js');
const problems = [];

for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.js') && x !== 'en.js')) {
  const other = await load(f);
  for (const k of Object.keys(en)) if (!(k in other)) problems.push(`${f}: missing key "${k}"`);
  for (const k of Object.keys(other)) if (!(k in en)) problems.push(`${f}: key "${k}" does not exist in en.js`);
  for (const [k, v] of Object.entries(other)) {
    const ph = (s) => (String(s).match(/\{\w+\}/g) || []).sort().join(',');
    if (k in en && ph(v) !== ph(en[k])) problems.push(`${f}: "${k}" must keep the same {placeholders} as English`);
  }
}

if (problems.length) {
  console.error(`i18n check failed (${problems.length}):\n - ${problems.join('\n - ')}`);
  process.exit(1);
}
console.log(`i18n OK: ${Object.keys(en).length} keys in every language.`);
