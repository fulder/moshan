import os

import jwt
import pytest
from starlette.testclient import TestClient
from api import app

os.environ["LOG_LEVEL"] = "DEBUG"


@pytest.fixture(scope='session')
def client():
    return TestClient(app)


@pytest.fixture(scope='session')
def username():
    return "TEST_USER"


@pytest.fixture(scope='session')
def token(username):
    return jwt.encode(
        {"username": username},
        "secret",
        algorithm="HS256"
    )
