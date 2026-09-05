import crypto from "crypto";

const URL_LIMIT = 20;
const MAX_TEXT = 12000;
const BLOCKED_EXT = new Set([".exe", ".dll", ".scr", ".msi", ".bat", ".cmd", ".com", ".cpl", ".jar", ".js", ".vbs", ".vbe", ".ps1", ".psm1", ".hta", ".apk"]);
const RISKY_SCHEMES = new Set(["javascript:", "data:", "vbscript:", "file:"]);
const MONEY_TERMS = /\b(bank|wire|transfer|send money|crypto|bitcoin|usdt|wallet|otp|one[- ]time password|gift card|fee|investment|deposit|withdraw|account number|routing number|iban|swift)\b/i;
const SCAM_TERMS = /\b(urgent|guaranteed profit|double your money|pay first|advance fee|verification fee|give me your otp|give me your password|recovery phrase|seed phrase|click here now)\b/i;

export function extractUrls(text) {
  if (typeof text !== "string") return [];
  return [...text.matchAll(/\bhttps?:\/\/[^\s<>'"`]+/gi)].map(m => m[0].replace(/[),.!?]+$/g, "")).slice(0, URL_LIMIT);
}

export function inspectUrl(raw) {
  try {
    const u = new URL(raw);
    const protocol = `${u.protocol}`.toLowerCase();
    if (RISKY_SCHEMES.has(protocol)) return { url: raw, action: "block", reason: "unsafe URL scheme" };
    if (!["http:", "https:"].includes(protocol)) return { url: raw, action: "warn", reason: "unrecognized URL scheme" };
    const host = u.hostname.toLowerCase();
    if (!host || host.length > 253) return { url: raw, action: "block", reason: "invalid host" };
    if (host.includes("xn--")) return { url: raw, action: "warn", reason: "internationalized hostname requires caution" };
    return { url: raw, action: "allow", host };
  } catch {
    return { url: raw, action: "block", reason: "malformed URL" };
  }
}

export function inspectText(text) {
  const value = String(text || "").slice(0, MAX_TEXT);
  const urls = extractUrls(value).map(inspectUrl);
  const blocked = urls.some(x => x.action === "block");
  const scam = SCAM_TERMS.test(value);
  const money = MONEY_TERMS.test(value);
  return {
    action: blocked ? "block" : (scam || money || urls.some(x => x.action === "warn") ? "warn" : "allow"),
    urls,
    signals: { scam_language: scam, money_context: money },
  };
}

export function inspectUploadMeta({ filename = "", mimeType = "", size = 0 } = {}) {
  const lower = String(filename).toLowerCase();
  const ext = lower.includes(".") ? lower.slice(lower.lastIndexOf(".")) : "";
  if (BLOCKED_EXT.has(ext)) return { action: "block", reason: "executable or script file type is not permitted" };
  if (Number(size) > 100 * 1024 * 1024) return { action: "block", reason: "file exceeds 100 MB safety limit" };
  const mime = String(mimeType).toLowerCase();
  if (mime.includes("javascript") || mime.includes("x-msdownload") || mime.includes("x-dosexec")) return { action: "block", reason: "active executable content is not permitted" };
  return { action: "scan", reason: "metadata accepted; malware/content scan required before publication" };
}

export function hashForSafety(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

export function progressiveAction(strikes = 0, severe = false) {
  if (severe) return "block_review";
  if (strikes >= 3) return "restrict";
  if (strikes === 2) return "warning_final";
  if (strikes === 1) return "warning";
  return "allow";
}

export function connectionSafety({ known = false, verified = false } = {}) {
  if (known && verified) return { action: "allow", message: "This connection is verified in your trusted network." };
  return { action: "warn", message: "This person is not fully verified in your trusted network. Never share passwords, OTPs, recovery phrases, or send money solely because they ask." };
}

export function encryptionState({ verified = false } = {}) {
  return verified ? { state: "verified", label: "E2EE protected" } : { state: "unverified", label: "E2EE not verified" };
}
