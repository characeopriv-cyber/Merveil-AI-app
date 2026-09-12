import { getSession, sendJson } from "../lib/supabaseServer.js";

const MAX_FILES = 180;
const MAX_FILE_BYTES = 300_000;
const SKIP = /(^|\/)(node_modules|dist|build|\.git|\.next|coverage)(\/|$)/;
const TEXT = /\.(js|jsx|ts|tsx|json|css|html|md|sql|mjs|cjs|vue|py|java|yml|yaml|env)$/i;

function access(req, res) {
  return getSession(req, res).then(s => {
    const id = s?.user?.id || s?.jwtSub;
    if (!id) { sendJson(res, 401, { error: "Sign in required", code: "AUTH_REQUIRED" }); return null; }
    return id;
  }).catch(() => { sendJson(res, 401, { error: "Sign in required", code: "AUTH_REQUIRED" }); return null; });
}

function push(list, severity, code, message, file = null, line = null, fix = null) {
  list.push({ severity, code, message, file, line, fix });
}

function scan(files) {
  const issues = [];
  const names = new Set();
  const textFiles = [];
  for (const f of Array.isArray(files) ? files.slice(0, MAX_FILES) : []) {
    const path = String(f?.path || "").replace(/^\/+/, "");
    if (!path || SKIP.test(path)) continue;
    names.add(path);
    const raw = String(f?.content || "");
    if (raw.length > MAX_FILE_BYTES) { push(issues, "warn", "FILE_TOO_LARGE", "File was skipped because it exceeds the safe scan limit.", path, null, "Inspect this file separately in Debug."); continue; }
    if (TEXT.test(path)) textFiles.push({ path, content: raw });
  }

  if (!names.has("package.json")) push(issues, "error", "NO_PACKAGE_JSON", "No package.json was found in the supplied project.", null, null, "Add or identify the project package manifest.");
  if (!names.has("src/App.jsx") && !names.has("src/App.tsx") && !names.has("src/main.jsx") && !names.has("src/main.tsx") && !names.has("index.html")) push(issues, "warn", "ENTRY_NOT_FOUND", "No common Vite/React entry file was detected.", null, null, "Confirm the application entry point.");

  const envRefs = new Set();
  for (const f of textFiles) {
    const lines = f.content.split(/\r?\n/);
    lines.forEach((line, idx) => {
      if (/import\s+.*from\s+['"][^'".]+['"]/.test(line) && /from\s+['"](?:react|vite|supabase|next|node:)/.test(line)) return;
      const m = line.match(/(?:import|require)\s*(?:\([^)]*\)|[^;]*?from)?\s*['"]([^'"./][^'"]*)['"]/);
      if (m) {
        const pkg = m[1].startsWith("@") ? m[1].split("/").slice(0,2).join("/") : m[1].split("/")[0];
        if (pkg && pkg !== "react" && pkg !== "react-dom") {
          // Dependency verification is performed below against package.json.
        }
      }
      for (const x of line.matchAll(/import\.meta\.env\.([A-Z0-9_]+)/g)) envRefs.add(x[1]);
      if (/process\.env\.([A-Z0-9_]+)/.test(line)) envRefs.add(line.match(/process\.env\.([A-Z0-9_]+)/)[1]);
      if (/TODO|FIXME|XXX/.test(line)) push(issues, "info", "TODO_MARKER", "Unfinished marker found.", f.path, idx + 1, "Review before shipping.");
      if (/catch\s*\([^)]*\)\s*\{\s*\}/.test(line)) push(issues, "warn", "EMPTY_CATCH", "An empty catch block can hide a real runtime failure.", f.path, idx + 1, "Handle or report the error explicitly.");
      if (/console\.error\(/.test(line)) push(issues, "info", "CONSOLE_ERROR", "Runtime error logging is present; verify the failure is handled intentionally.", f.path, idx + 1, "Keep structured logging in production and verify the underlying error.");
    });
  }

  const pkg = textFiles.find(f => f.path === "package.json");
  if (pkg) {
    try {
      const manifest = JSON.parse(pkg.content);
      const deps = { ...(manifest.dependencies || {}), ...(manifest.devDependencies || {}) };
      for (const f of textFiles) {
        for (const line of f.content.split(/\r?\n/)) {
          const m = line.match(/(?:import|require)\s*(?:\([^)]*\)|[^;]*?from)?\s*['"]([^'"./][^'"]*)['"]/);
          if (!m) continue;
          const mod = m[1];
          const root = mod.startsWith("@") ? mod.split("/").slice(0,2).join("/") : mod.split("/")[0];
          if (!["react","react-dom","node:","vite"].includes(root) && !deps[root]) push(issues, "error", "MISSING_DEPENDENCY", `Imported package "${root}" is not declared in package.json.`, f.path, null, `Add ${root} to dependencies or remove the import.`);
        }
      }
    } catch { push(issues, "error", "INVALID_PACKAGE_JSON", "package.json could not be parsed as JSON.", "package.json", null, "Fix JSON syntax before installing or building."); }
  }
  if (envRefs.size) push(issues, "info", "ENV_REFERENCES", `${envRefs.size} environment variable reference(s) detected. Values are never collected by this scan.`, null, null, "Verify required variables exist in the deployment environment.");

  const counts = { error: 0, warn: 0, info: 0 };
  issues.forEach(i => counts[i.severity] = (counts[i.severity] || 0) + 1);
  const score = Math.max(0, Math.min(100, 100 - counts.error * 22 - counts.warn * 7));
  return { score, filesScanned: textFiles.length, issues: issues.slice(0, 200), counts, status: counts.error ? "blocked" : counts.warn ? "attention" : "healthy" };
}

export default async function handler(req, res) {
  if (!["GET", "POST"].includes(req.method)) return sendJson(res, 405, { error: "Method not allowed" });
  const userId = await access(req, res);
  if (!userId) return;
  if (req.method === "GET") return sendJson(res, 200, { ok: true, service: "Merveil Debug V1", capabilities: ["project-scan", "static-diagnosis", "safe-no-mutation"] });
  try {
    const result = scan(req.body?.files || []);
    return sendJson(res, 200, { ok: true, userId, ...result, generatedAt: new Date().toISOString() });
  } catch (e) {
    return sendJson(res, 400, { error: e?.message || "Debug scan failed" });
  }
}
