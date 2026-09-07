from dataclasses import dataclass
from urllib.parse import urlparse

@dataclass(frozen=True)
class ZapTarget:
    url: str


def validate_target(target: ZapTarget) -> str:
    parsed = urlparse(target.url)
    if parsed.scheme not in {"https", "http"} or not parsed.hostname:
        raise ValueError("ZAP target must be an authorized HTTP(S) URL")
    if parsed.username or parsed.password:
        raise ValueError("Credentials in scan targets are not permitted")
    return target.url


def build_scan_request(target: ZapTarget) -> dict[str, str]:
    """Return a constrained request envelope for an isolated ZAP worker.

    The worker does not execute arbitrary commands and does not contain API keys.
    The deployment layer supplies credentials and network policy.
    """
    return {"target": validate_target(target), "scanner": "owasp-zap"}
