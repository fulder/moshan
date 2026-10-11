import base64
import gzip
import os
import sys
from json import dumps, loads
from urllib.parse import urlencode, urlsplit

import jwt
import pytest

os.environ["LOG_LEVEL"] = "DEBUG"

CURRENT_DIR = os.path.dirname(os.path.realpath(__file__))
SRC_PATH = os.path.join(CURRENT_DIR, "..", "..", "src")

sys.path.append(SRC_PATH)

import app  # noqa: E402


class LambdaResponse:
    def __init__(self, res):
        self.status_code = res["statusCode"]
        self.headers = res.get("headers", {})
        body = res.get("body") or ""
        if res.get("isBase64Encoded"):
            body = base64.b64decode(body)
            if self.headers.get("Content-Encoding") == "gzip":
                body = gzip.decompress(body)
            body = body.decode()
        self.text = body

    def json(self):
        return loads(self.text)


class LambdaClient:
    """Calls the handler with API Gateway HTTP API (v2) events"""

    def request(self, method, url, headers=None, json=None, params=None):
        parts = urlsplit(url)
        query = urlencode(params) if params else parts.query
        event = {
            "version": "2.0",
            "routeKey": f"{method} /{{proxy+}}",
            "rawPath": parts.path,
            "rawQueryString": query,
            "queryStringParameters": (
                dict(p.split("=", 1) for p in query.split("&"))
                if query
                else None
            ),
            "headers": {k.lower(): v for k, v in (headers or {}).items()},
            "requestContext": {
                "http": {"method": method, "path": parts.path},
                "stage": "$default",
            },
            "body": None if json is None else dumps(json),
            "isBase64Encoded": False,
        }
        return LambdaResponse(app.handler(event, None))

    def get(self, url, **kwargs):
        return self.request("GET", url, **kwargs)

    def post(self, url, **kwargs):
        return self.request("POST", url, **kwargs)

    def put(self, url, **kwargs):
        return self.request("PUT", url, **kwargs)

    def delete(self, url, **kwargs):
        return self.request("DELETE", url, **kwargs)


@pytest.fixture(scope="session")
def client():
    return LambdaClient()


@pytest.fixture(scope="session")
def username():
    return "TEST_USER"


@pytest.fixture(scope="session")
def token(username):
    return jwt.encode({"username": username}, "secret", algorithm="HS256")
