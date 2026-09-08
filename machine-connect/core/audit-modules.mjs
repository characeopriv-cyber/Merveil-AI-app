import { readdir, readFile } from 'node:fs/promises';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), 'src');
const rows = [];

async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) await walk(path);
    else if (entry.name.endsWith('.ts')) {
      const text = await readFile(path, 'utf8');
      const rel = relative(root, path).replaceAll('\\', '/');
      const folder = rel.includes('/') ? rel.split('/')[0] : '(root)';
      const exports = [...text.matchAll(/\bexport\s+(?:default\s+)?(?:abstract\s+)?(?:class|interface|type|enum|function|const)\s+([A-Za-z0-9_]+)/g)].map(m => m[1]);
      const controllers = [...text.matchAll(/@Controller\(([^)]*)\)/g)].map(m => m[1].trim());
      const providers = [...text.matchAll(/@Injectable\(\)/g)].length;
      rows.push({ path: rel, folder, exports, controllers, injectableCount: providers });
    }
  }
}

await walk(root);
rows.sort((a, b) => a.path.localeCompare(b.path));

const byFolder = new Map();
for (const row of rows) {
  if (!byFolder.has(row.folder)) byFolder.set(row.folder, { files: 0, exports: [], controllers: [], injectables: 0 });
  const item = byFolder.get(row.folder);
  item.files += 1;
  item.exports.push(...row.exports);
  item.controllers.push(...row.controllers);
  item.injectables += row.injectableCount;
}

const report = {
  generatedAt: new Date().toISOString(),
  source: 'machine-connect/core/src',
  fileCount: rows.length,
  folders: Object.fromEntries([...byFolder.entries()].map(([folder, value]) => [folder, {
    ...value,
    exports: [...new Set(value.exports)].sort(),
    controllers: [...new Set(value.controllers)].sort(),
  }])),
  files: rows,
};

console.log(JSON.stringify(report, null, 2));
