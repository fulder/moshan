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
        "api_info": "i_mal_52991",
        "status": status,
        "watched_eps": watched_eps,
        "api_cache": {"title": "Frieren", "ep_count": ep_count},
    }


def test_notify_new_episode(sent):
    updates_subscriber._notify_new_episodes(_item(), 11, 12)

    assert sent == [
        "Frieren: episode 12 is out (2 unseen)\n"
        "https://moshan.fulder.dev/review.html"
        "?api_name=mal&api_id=52991&episode_api_id=12"
    ]


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
        "api_info": "i_tvmaze_50701",
        "status": status,
        "api_cache": {"title": "Lupin", "next_episode": next_episode},
    }


PREMIERE = {"season": 4, "number": 1, "airstamp": "2026-11-15T08:00:00+00:00"}


def test_notify_new_season(sent):
    updates_subscriber._notify_new_season(
        _season_item(next_episode=PREMIERE), None
    )

    assert sent == [
        "📅 Lupin: season 4 starts 2026-11-15\n"
        "https://moshan.fulder.dev/review.html?api_name=tvmaze&api_id=50701"
    ]


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


SEQUEL = {"mal_id": 10, "title": "S2", "start": "2027-01-05T00:00:00+00:00"}


def _sequel_message():
    return {"type": "sequel", "prequel_id": "5", "sequel": SEQUEL}


def test_sequel_stored_and_announced(sent, mocker):
    item = {
        "username": "me",
        "status": "finished",
        "api_cache": {"title": "S1"},
    }
    mocker.patch.object(
        updates_subscriber.reviews_db, "get_items", return_value=[item]
    )
    mocker.patch.object(
        updates_subscriber.reviews_db,
        "get_item",
        side_effect=updates_subscriber.reviews_db.NotFoundError,
    )
    stored = mocker.patch.object(
        updates_subscriber.reviews_db, "set_api_cache_fields"
    )

    updates_subscriber._handle_sequel(_sequel_message())

    stored.assert_called_once_with("me", "mal", "5", {"sequel": SEQUEL})
    assert sent == [
        "📅 S2 announced (after S1), starts 2027-01-05\n"
        "https://moshan.fulder.dev/review.html?api_name=mal&api_id=10"
    ]


def test_known_sequel_not_announced_again(sent, mocker):
    item = {
        "username": "me",
        "status": "finished",
        "api_cache": {"title": "S1", "sequel": {**SEQUEL, "start": None}},
    }
    mocker.patch.object(
        updates_subscriber.reviews_db, "get_items", return_value=[item]
    )
    stored = mocker.patch.object(
        updates_subscriber.reviews_db, "set_api_cache_fields"
    )

    updates_subscriber._handle_sequel(_sequel_message())

    # Start date changed: stored, but no second ping
    stored.assert_called_once()
    assert sent == []


def test_missing_anime_is_skipped(mocker):
    mocker.patch.object(
        updates_subscriber.tenrai_api, "get_item", return_value=None
    )
    get_items = mocker.patch.object(updates_subscriber.reviews_db, "get_items")
    event = {
        "Records": [
            {"Sns": {"Message": '{"api_name": "mal", "api_id": "62828"}'}}
        ]
    }

    updates_subscriber.handler(event, None)

    get_items.assert_not_called()
