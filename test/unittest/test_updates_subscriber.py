import os
import sys

import pytest

SUB_PATH = os.path.join(
    os.path.dirname(os.path.realpath(__file__)),
    "..",
    "..",
    "src",
    "lambdas",
    "updates_subscriber",
)
sys.path.append(SUB_PATH)
sys.path.append(os.path.dirname(SUB_PATH))

import updates_subscriber  # noqa: E402


@pytest.fixture
def sent(monkeypatch):
    msgs = []
    monkeypatch.setattr(updates_subscriber, "NOTIFY_USERNAME", "me")
    monkeypatch.setattr(updates_subscriber.telegram, "send", msgs.append)
    return msgs


def _item(username="me", status="watching", ep_count=12, watched_eps=10):
    return {
        "username": username,
        "status": status,
        "watched_eps": watched_eps,
        "api_cache": {"title": "Frieren", "ep_count": ep_count},
    }


def test_notify_new_episode(sent):
    updates_subscriber._notify_new_episodes(_item(), 11)

    assert sent == ["Frieren: episode 12 is out (2 unseen)"]


@pytest.mark.parametrize(
    "item,old_ep_count",
    [
        (_item(), 12),
        (_item(), None),
        (_item(username="other"), 11),
        (_item(status="backlog"), 11),
        (_item(status="finished"), 11),
        (_item(watched_eps=12), 11),
    ],
)
def test_no_notify(sent, item, old_ep_count):
    updates_subscriber._notify_new_episodes(item, old_ep_count)

    assert sent == []
