from __future__ import annotations

import base64
import json
import os
import sys
import threading
import unittest
from http.client import HTTPConnection
from http.server import ThreadingHTTPServer
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
os.environ["MC_INTELLIGENCE_RUNTIME_TOKEN"] = "test-runtime-token"

from runtime_server import Handler


class RuntimeServerTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()

    def request(self, method, path, body=b"", token=None):
        conn = HTTPConnection("127.0.0.1", self.server.server_port)
        headers = {"Content-Type": "application/json"}
        if token is not None:
            headers["x-runtime-token"] = token
        conn.request(method, path, body=body, headers=headers)
        response = conn.getresponse()
        data = response.read()
        conn.close()
        return response.status, json.loads(data.decode())

    def test_health(self):
        status, payload = self.request("GET", "/health")
        self.assertEqual(status, 200)
        self.assertTrue(payload["ok"])

    def test_extract_requires_token(self):
        body = json.dumps({"mimeType": "text/plain", "contentBase64": base64.b64encode(b"hello machine connect").decode()}).encode()
        status, _ = self.request("POST", "/extract", body)
        self.assertEqual(status, 401)

    def test_extract_returns_hash_and_text(self):
        content = b"hello machine connect"
        body = json.dumps({"mimeType": "text/plain", "contentBase64": base64.b64encode(content).decode()}).encode()
        status, payload = self.request("POST", "/extract", body, "test-runtime-token")
        self.assertEqual(status, 200)
        self.assertEqual(payload["text"], content.decode())
        self.assertEqual(payload["byteSize"], len(content))
        self.assertEqual(len(payload["sha256"]), 64)


if __name__ == "__main__":
    unittest.main()
