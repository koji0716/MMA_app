import json
import os
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler


class handler(BaseHTTPRequestHandler):
    def _write_common_headers(self) -> None:
        self.send_header("Content-Type", "application/json")
        self.send_header("Cache-Control", "no-store")
        self.send_header(
            "Access-Control-Allow-Origin", os.environ.get("ALLOWED_ORIGIN", "*")
        )
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def do_OPTIONS(self) -> None:  # noqa: N802 (Vercel expects lowercase handler)
        self.send_response(HTTPStatus.NO_CONTENT)
        self._write_common_headers()
        self.end_headers()

    def do_GET(self) -> None:  # noqa: N802 (Vercel expects lowercase handler)
        api_key = os.environ.get("NEWS_API_KEY")
        body = json.dumps(
            {"hasKey": bool(api_key), "len": (len(api_key) if api_key else 0)}
        ).encode("utf-8")

        self.send_response(HTTPStatus.OK)
        self._write_common_headers()
        self.end_headers()
        self.wfile.write(body)
