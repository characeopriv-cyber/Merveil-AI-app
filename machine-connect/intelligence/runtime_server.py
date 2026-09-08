from __future__ import annotations

import base64
import json
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any

from document_pipeline import extract_document, extract_entities

RUNTIME_TOKEN = os.environ.get("MC_INTELLIGENCE_RUNTIME_TOKEN", "").strip()
MAX_BODY = 26 * 1024 * 1024


class Handler(BaseHTTPRequestHandler):
    server_version = "MerveilMachineConnectIntelligence/1.0"

    def _send(self, status: int, payload: dict[str, Any]) -> None:
        body = json.dumps(payload, separators=(",", ":")).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:
        if self.path == "/health":
            self._send(200, {"ok": True, "service": "intelligence-runtime"})
            return
        self._send(404, {"error": "not found"})

    def do_POST(self) -> None:
        if self.path != "/extract":
            self._send(404, {"error": "not found"})
            return
        if RUNTIME_TOKEN and self.headers.get("x-runtime-token", "") != RUNTIME_TOKEN:
            self._send(401, {"error": "unauthorized"})
            return
        try:
            length = int(self.headers.get("content-length", "0"))
            if length <= 0 or length > MAX_BODY:
                raise ValueError("invalid request size")
            raw = self.rfile.read(length)
            payload = json.loads(raw.decode("utf-8"))
            mime_type = str(payload.get("mimeType", ""))
            encoded = str(payload.get("contentBase64", ""))
            data = base64.b64decode(encoded, validate=True)
            extracted = extract_document(data, mime_type)
            entities = extract_entities(extracted.text)
            self._send(200, {"text": extracted.text, "sha256": extracted.sha256, "byteSize": extracted.byte_size, "entities": [{"name": e.name, "entityType": e.entity_type} for e in entities]})
        except (ValueError, json.JSONDecodeError, base64.binascii.Error) as exc:
            self._send(400, {"error": str(exc)})
        except Exception as exc:
            self._send(500, {"error": "extraction_failed", "detail": str(exc)})

    def log_message(self, format: str, *args: Any) -> None:
        return


def main() -> None:
    host = os.environ.get("MC_INTELLIGENCE_RUNTIME_HOST", "127.0.0.1")
    port = int(os.environ.get("MC_INTELLIGENCE_RUNTIME_PORT", "8787"))
    ThreadingHTTPServer((host, port), Handler).serve_forever()


if __name__ == "__main__":
    main()
