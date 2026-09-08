#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(process.argv[2] ?? 'machine-connect/core/src');
const OUT = process.argv[3] ? path.resolve(process.argv[3]) : null;
const EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.mjs']);
const SECURITY_TERMS = /security|threat|malware|virus|vulnerability|ids|ips|intrusion|quarantine|isolation|firewall|remediation|incident|intel|scanner|scan|exploit|offensive|credential|signature|ack/i;

function walk(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (EXTENSIONS.has(path.extname(entry.name))) out.push(full);
  }
  return out;
}

function exportsOf(source) {
  const names = new Set();
  const patterns = [
    /export\s+(?:default\s+)?(?:class|interface|type|enum|function|const|let|var)\s+([A-Za-z_$][\w$]*)/g,
    /export\s*\{([^}]+)\}/g,
  ];
  for (const re of patterns) {
    for (const match of source.matchAll(re)) {
      if (match[1].includes(',')) {
        for (const item of match[1].split(',')) {
          const name = item.trim().split(/\s+as\s+/)[0].trim();
          if (name) names.add(name);
        }
      } else names.add(match[1]);
    }
  }
  return [...names].sort();
}

function classify(rel, source) {
  const r = rel.replaceAll('\\', '/');
  if (r.includes('/security/')) return 'security';
  if (r.includes('/machine/')) return 'machine lifecycle';
  if (r.includes('/command/')) return 'command/control';
  if (r.includes('/telemetry')) return 'telemetry';
  if (r.includes('/auth/')) return 'authentication';
  if (r.includes('/audit/')) return 'audit/event trail';
  if (r.includes('/persistence/')) return 'persistence';
  if (r.includes('/adapter')) return 'adapter/integration';
  if (r.includes('/advanced/')) return 'advanced';
  if (r.includes('/workflow')) return 'workflow';
  if (SECURITY_TERMS.test(source) || SECURITY_TERMS.test(r)) return 'security-adjacent';
  return 'core';
}

const files = walk(ROOT);
const modules = new Map();
const inventory = [];
for (const file of files) {
  const source = fs.readFileSync(file, 'utf8');
  const rel = path.relative(path.dirname(ROOT), file).replaceAll('\\', '/');
  const dir = path.dirname(rel);
  const item = {
    path: rel,
    category: classify(rel, source),
    exports: exportsOf(source),
    lines: source.split('\n').length,
    hasTest: /\.(test|spec)\.(ts|tsx|js|mjs)$/.test(file),
  };
  inventory.push(item);
  if (!modules.has(dir)) modules.set(dir, { folder: dir, files: 0, exports: [], categories: new Set() });
  const m = modules.get(dir);
  m.files++;
  m.exports.push(...item.exports.map(x => `${path.basename(file)}:${x}`));
  m.categories.add(item.category);
}

const allText = inventory.map(x => `${x.path} ${x.exports.join(' ')}`).join('\n');
const capabilities = {
  machineIdentityAndAckSigning: /machine-ack-signature|signature/i.test(allText),
  remediation: /remediation/i.test(allText),
  offensiveSecurityControlPlane: /offensive-security/i.test(allText),
  malwareDetection: /malware|virus/i.test(allText),
  vulnerabilityScanning: /vulnerability|scanner|nmap|openvas/i.test(allText),
  networkIsolationOrQuarantine: /quarantine|isolation/i.test(allText),
  firewallControl: /firewall/i.test(allText),
  idsIps: /\bids\b|\bips\b|intrusion/i.test(allText),
  threatIntelligence: /threat[- ]?intel|misp|otx/i.test(allText),
  soarPlaybooks: /soar|playbook/i.test(allText),
  adversaryEmulation: /caldera|adversary[- ]?emulation/i.test(allText),
};

const report = {
  generatedAt: new Date().toISOString(),
  root: ROOT,
  summary: {
    sourceFiles: inventory.length,
    folders: modules.size,
    testFiles: inventory.filter(x => x.hasTest).length,
  },
  modules: [...modules.values()].map(m => ({ ...m, categories: [...m.categories].sort(), exports: [...new Set(m.exports)].sort() })).sort((a, b) => a.folder.localeCompare(b.folder)),
  files: inventory.sort((a, b) => a.path.localeCompare(b.path)),
  capabilityInventory: capabilities,
  interpretation: 'This is an inventory scanner, not proof that a capability is production-ready. A true/false capability means matching implementation names were found and must be reviewed for runtime, authorization, persistence, and integration depth.',
};

const json = JSON.stringify(report, null, 2);
if (OUT) fs.writeFileSync(OUT, json + '\n');
else console.log(json);
