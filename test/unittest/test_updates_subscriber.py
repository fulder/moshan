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


def _season_item(status="finished", next_episode=None):
    return {
        "username": "me",
        "status": status,
        "api_cache": {"title": "Lupin", "next_episode": next_episode},
    }


PREMIERE = {"season": 4, "number": 1, "airstamp": "2026-11-15T08:00:00+00:00"}


def test_notify_new_season(sent):
    updates_subscriber._notify_new_season(
        _season_item(next_episode=PREMIERE), None
    )

    assert sent == ["📅 Lupin: season 4 starts 2026-11-15"]


@pytest.mark.parametrize(
    "item,old_next",
    [
        (_season_item(next_episode=PREMIERE), PREMIERE),
        (_season_item(next_episode={**PREMIERE, "number": 2}), None),
        (_season_item(next_episode=None), PREMIERE),
        (_season_item(status="dropped", next_episode=PREMIERE), None),
    ],
)
def test_no_notify_new_season(sent, item, old_next):
    updates_subscriber._notify_new_season(item, old_next)

    assert sent == []
