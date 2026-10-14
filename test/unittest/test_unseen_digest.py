import pytest

import unseen_digest


@pytest.fixture
def sent(monkeypatch):
    msgs = []
    monkeypatch.setattr(unseen_digest, "NOTIFY_USERNAME", "me")
    monkeypatch.setattr(
        unseen_digest.telegram, "send", lambda text, html: msgs.append(text)
    )
    return msgs


def _item(title, status="watching", ep_count=12, watched_eps=10, mal_id=1):
    return {
        "username": "me",
        "api_info": f"i_mal_{mal_id}",
        "status": status,
        "watched_eps": watched_eps,
        "api_cache": {"title": title, "ep_count": ep_count},
    }


def test_digest_lists_unseen(mocker, sent):
    mocker.patch.object(
        unseen_digest.reviews_db,
        "get_user_items",
        return_value=[
            _item("Severance", status="finished", ep_count=20, mal_id=2),
            _item("frieren & co"),
            _item("One left", status="following", ep_count=5, watched_eps=4),
            _item("Seen", ep_count=12, watched_eps=12),
            _item("Dropped", status="dropped"),
            _item("Backlog", status="backlog", watched_eps=0),
            _item("Movie", ep_count=None, watched_eps=0),
        ],
    )

    unseen_digest.handler({}, None)

    url = "https://moshan.fulder.dev/review.html?api_name=mal&amp;api_id="
    assert sent == [
        "📺 You still haven't seen:\n"
        f'• <a href="{url}1">frieren &amp; co</a>: 2 episodes left\n'
        f'• <a href="{url}1">One left</a>: 1 episode left\n'
        f'• <a href="{url}2">Severance</a>: 10 episodes left'
    ]


def test_digest_nothing_unseen(mocker, sent):
    mocker.patch.object(
        unseen_digest.reviews_db,
        "get_user_items",
        return_value=[_item("Seen", watched_eps=12)],
    )

    unseen_digest.handler({}, None)

    assert sent == []


def test_digest_splits_long_message(monkeypatch):
    monkeypatch.setattr(unseen_digest, "MAX_MESSAGE_LEN", 10)

    assert unseen_digest._split(["head", "12345", "678", "abcdefghij"]) == [
        "head\n12345",
        "678",
        "abcdefghij",
    ]
