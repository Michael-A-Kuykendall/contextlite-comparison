
#!/usr/bin/env bash
set -euo pipefail
python3 - << 'PY'
import json
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import urlparse, parse_qs

class H(BaseHTTPRequestHandler):
    def do_GET(self):
        u = urlparse(self.path)
        if u.path == "/search":
            q = parse_qs(u.query).get("q", [""])[0]
            data = {
                "engine": "contextlite-demo-stub",
                "hits": [{"id": i, "score": 1.0/(i+1), "snippet": f"Hit {i} for '{q}'"} for i in range(1,6)]
            }
            b = json.dumps(data).encode()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(b)))
            self.end_headers()
            self.wfile.write(b)
        else:
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b"OK")
    def log_message(self, *a, **k): pass

HTTPServer(("0.0.0.0", 8080), H).serve_forever()
PY
