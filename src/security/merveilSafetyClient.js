const MAX_FILE = 100 * 1024 * 1024;
const EXECUTABLE = /\.(exe|dll|scr|msi|bat|cmd|com|cpl|jar|js|vbs|vbe|ps1|psm1|hta|apk)$/i;
const URL_RE = /\bhttps?:\/\/[^\s<>'"`]+/gi;

export function localLinkGate(text) {
  const urls = String(text || "").match(URL_RE) || [];
  const checks = urls.map(raw => { try { const u = new URL(raw); return { url: raw, action: ["http:","https:"].includes(u.protocol) ? "allow" : "block" }; } catch { return { url: raw, action: "block" }; } });
  return { blocked: checks.some(x => x.action === "block"), urls: checks };
}

export function localUploadGate(file) {
  if (!file) return { allowed: false, reason: "No file selected" };
  if (file.size > MAX_FILE) return { allowed: false, reason: "File exceeds the 100 MB safety limit" };
  if (EXECUTABLE.test(file.name || "")) return { allowed: false, reason: "Executable or active script files are not permitted" };
  return { allowed: true, requiresScan: true };
}

export async function serverSafetyCheck(payload) {
  const response = await fetch("/api/security-gate", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Safety check unavailable");
  return data;
}
