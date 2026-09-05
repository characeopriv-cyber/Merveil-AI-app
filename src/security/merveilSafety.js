/* Pre-send safety gate. This is deliberately conservative and local-first.
 * Server-side reputation/malware providers must be called by the backend before
 * public publication. Private E2EE text is never sent to a server for scanning.
 */

const URL_RE = /https?:\/\/[^\s<>'"`]+/gi;
const HIGH_RISK_SCHEMES = /^(javascript|data|vbscript):/i;
const SUSPICIOUS_HOSTS = /(^|\.)((bit\.ly|tinyurl\.com|t\.co|goo\.gl|rb\.gy|is\.gd))$/i;
const MONEY_TERMS = /\b(crypto|bitcoin|usdt|wire|bank transfer|send money|investment|fee|otp|verification code|gift card|mobile money)\b/i;

export function extractUrls(text = "") { return [...new Set(text.match(URL_RE) || [])]; }

export function inspectUrl(raw) {
  try {
    const value = raw.trim();
    if (HIGH_RISK_SCHEMES.test(value)) return { verdict: "blocked", risk: 100, reason: "unsafe_scheme" };
    const u = new URL(value);
    if (!["http:", "https:"].includes(u.protocol)) return { verdict: "blocked", risk: 100, reason: "unsupported_scheme" };
    const host = u.hostname.toLowerCase();
    if (SUSPICIOUS_HOSTS.test(host)) return { verdict: "suspicious", risk: 65, reason: "shortened_url" };
    if (u.username || u.password) return { verdict: "suspicious", risk: 80, reason: "embedded_credentials" };
    return { verdict: "unknown", risk: 10, reason: "requires_reputation_check", host };
  } catch { return { verdict: "blocked", risk: 100, reason: "invalid_url" }; }
}

export function inspectTextBeforeSend(text = "") {
  const urls = extractUrls(text).map(inspectUrl);
  const suspiciousUrl = urls.find(x => x.verdict === "blocked" || x.verdict === "suspicious");
  const moneyRisk = MONEY_TERMS.test(text);
  return {
    allow: !suspiciousUrl,
    urls,
    warning: suspiciousUrl ? "This link may be unsafe. Verify the destination before sending." : moneyRisk ? "Money or payment language detected. Never share OTPs, passwords, or recovery codes." : null,
    moneyRisk,
  };
}

const SAFE_UPLOAD_TYPES = new Set([
  "image/jpeg", "image/png", "image/webp", "image/gif",
  "video/mp4", "video/webm", "audio/mpeg", "audio/mp4", "audio/webm",
  "application/pdf"
]);
const MAX_UPLOAD_BYTES = 100 * 1024 * 1024;

export function inspectUpload(file) {
  if (!file) return { allow: false, reason: "missing_file" };
  if (!SAFE_UPLOAD_TYPES.has(file.type)) return { allow: false, reason: "unsupported_file_type" };
  if (file.size > MAX_UPLOAD_BYTES) return { allow: false, reason: "file_too_large" };
  return { allow: true, requiresServerScan: true };
}

export function unknownConnectionWarning(profile = {}) {
  if (profile.isKnownConnection || profile.mutualConnections > 0) return null;
  return "You don't know this person yet. Check their Merveil Passport, verification status, and context before accepting.";
}
