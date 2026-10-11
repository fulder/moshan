import os
import sys

import jwt
import pytest
from starlette.testclient import TestClient

os.environ["LOG_LEVEL"] = "DEBUG"

CURRENT_DIR = os.path.dirname(os.path.realpath(__file__))
SRC_PATH = os.path.join(CURRENT_DIR, "..", "..", "src")

sys.path.append(SRC_PATH)

from app import app  # noqa


@pytest.fixture(scope="session")
def client():
    return TestClient(app)


@pytest.fixture(scope="session")
def username():
    return "TEST_USER"


@pytest.fixture(scope="session")
def token(username):
    return jwt.encode({"username": username}, "secret", algorithm="HS256")
