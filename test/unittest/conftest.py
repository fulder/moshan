import os
import sys

import jwt
import pytest
from starlette.testclient import TestClient

os.environ["LOG_LEVEL"] = "DEBUG"

CURRENT_DIR = os.path.dirname(os.path.realpath(__file__))
SRC_PATH = os.path.join(CURRENT_DIR, "..", "..", "src")

UTILS_PATH = os.path.join(SRC_PATH, "layers", "utils")
DATABASES_PATH = os.path.join(SRC_PATH, "layers", "databases")
API_PATH = os.path.join(SRC_PATH, "layers", "api")

API_LAMBDA_PATH = os.path.join(SRC_PATH, "lambdas", "api")

sys.path.append(UTILS_PATH)
sys.path.append(DATABASES_PATH)
sys.path.append(API_PATH)
sys.path.append(API_LAMBDA_PATH)

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
