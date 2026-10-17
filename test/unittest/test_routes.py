from unittest.mock import patch

import reviews_db
import tenrai
import tvmaze
import utils

TEST_SHOW_ID = "123123"
TEST_EPISODE_ID = "456465"


@patch("reviews_db.get_item")
def test_get_item(m_get_item, token, client, username):
    m_get_item.return_value = {"created_at": "CREATED_AT_DATE"}

    response = client.get(
        f"/items/tvmaze/{TEST_SHOW_ID}", headers={"Authorization": token}
    )

    assert response.status_code == 200


@patch("reviews_db.get_item")
def test_get_item_next_episode(m_get_item, token, client):
    m_get_item.return_value = {
        "created_at": "CREATED_AT_DATE",
        "api_cache": {
            "next_episode": {
                "season": 4,
                "number": 1,
                "airstamp": "2026-11-15T08:00:00+00:00",
            }
        },
    }

    response = client.get(
        f"/items/tvmaze/{TEST_SHOW_ID}", headers={"Authorization": token}
    )

    assert response.json()["apiCache"]["nextEpisode"] == {
        "season": 4,
        "number": 1,
        "airstamp": "2026-11-15T08:00:00+00:00",
    }


@patch("reviews_db.get_item")
def test_not_found(m_get_item, client, token):
    m_get_item.side_effect = reviews_db.NotFoundError

    response = client.get(
        f"/items/tvmaze/{TEST_SHOW_ID}", headers={"Authorization": token}
    )

    assert response.status_code == 404


@patch.object(tvmaze.TvMazeApi, "get_item")
@patch.object(tvmaze.TvMazeApi, "get_show_episodes_count")
@patch("reviews_db.get_item")
@patch("reviews_db.add_item")
def test_post_item(
    m_add_item, m_get_ep, m_get_item, mocked_ep_count, token, client
):
    mocked_ep_count.return_value = {
        "ep_count": 1,
        "special_count": 2,
    }

    m_get_item.return_value = {}

    response = client.post(
        "/items",
        headers={"Authorization": token},
        json={"item_api_id": TEST_SHOW_ID, "api_name": "tvmaze"},
    )

    assert response.status_code == 204


@patch.object(tvmaze.TvMazeApi, "get_item")
def test_post_item_tvmaze_error(m_ep_count, token, client):
    m_ep_count.side_effect = utils.HttpError(503)

    response = client.post(
        "/items",
        headers={"Authorization": token},
        json={"item_api_id": TEST_SHOW_ID, "api_name": "tvmaze"},
    )

    assert response.status_code == 503


@patch.object(tvmaze.TvMazeApi, "get_show_episodes_count")
@patch("reviews_db.get_item")
@patch("reviews_db.add_item")
def test_post_item_not_found(
    m_add_item, m_get_item, mocked_ep_count, token, client
):
    mocked_ep_count.return_value = {
        "ep_count": 1,
        "special_count": 2,
    }
    m_get_item.side_effect = [reviews_db.NotFoundError, {"Items": []}]

    response = client.post(
        "/items",
        headers={"Authorization": token},
        json={"item_api_id": TEST_SHOW_ID, "api_name": "tvmaze"},
    )

    assert response.status_code == 404


@patch("reviews_db.get_episode")
def test_get_episode(m_get_ep, token, client, username):
    m_get_ep.return_value = {"created_at": "CREATED_AT_DATE"}

    response = client.get(
        f"/items/tvmaze/{TEST_SHOW_ID}/episodes/{TEST_EPISODE_ID}",
        headers={"Authorization": token},
    )

    assert response.status_code == 200
    assert response.json() == {
        "apiId": "123123",
        "apiName": "tvmaze",
        "createdAt": "CREATED_AT_DATE",
        "episodeApiId": "456465",
    }


@patch("reviews_db.get_episode")
def test_get_episode_not_found(m_get_ep, token, client, username):
    m_get_ep.side_effect = reviews_db.NotFoundError

    response = client.get(
        f"/items/tvmaze/{TEST_SHOW_ID}/episodes/{TEST_EPISODE_ID}",
        headers={"Authorization": token},
    )

    assert response.status_code == 404


@patch.object(tvmaze.TvMazeApi, "get_episode")
@patch("reviews_db.get_item")
@patch("reviews_db.update_episode")
def test_put_episode(
    m_update_ep, m_get_item, m_get_ep, token, client, username
):
    response = client.put(
        f"/items/tvmaze/{TEST_SHOW_ID}/episodes/{TEST_EPISODE_ID}",
        headers={"Authorization": token},
        json={"review": "new_review"},
    )

    assert response.status_code == 204


@patch("reviews_db.get_episodes")
def test_get_episodes(m_get_eps, token, client, username):
    m_get_eps.return_value = [
        {
            "api_id": TEST_SHOW_ID,
            "api_name": "tvmaze",
            "episode_api_id": "1",
            "created_at": "ep_1_created_at",
        },
        {
            "api_id": TEST_SHOW_ID,
            "api_name": "tvmaze",
            "episode_api_id": "2",
            "created_at": "ep_2_created_at",
        },
        {
            "api_id": TEST_SHOW_ID,
            "api_name": "tvmaze",
            "episode_api_id": "3",
            "created_at": "ep_3_created_at",
        },
    ]

    response = client.get(
        f"/items/tvmaze/{TEST_SHOW_ID}/episodes",
        headers={"Authorization": token},
    )

    assert response.status_code == 200
    assert response.json() == {
        "episodes": [
            {
                "apiId": "123123",
                "apiName": "tvmaze",
                "createdAt": "ep_1_created_at",
                "episodeApiId": "1",
            },
            {
                "apiId": "123123",
                "apiName": "tvmaze",
                "createdAt": "ep_2_created_at",
                "episodeApiId": "2",
            },
            {
                "apiId": "123123",
                "apiName": "tvmaze",
                "createdAt": "ep_3_created_at",
                "episodeApiId": "3",
            },
        ]
    }


@patch.object(tvmaze.TvMazeApi, "get_item")
@patch.object(tvmaze.TvMazeApi, "get_show_episodes")
@patch.object(tvmaze.TvMazeApi, "get_episode")
@patch("reviews_db.set_watched_eps")
@patch("reviews_db.get_episodes")
@patch("reviews_db.add_episode")
@patch("reviews_db.get_item")
def test_post_episode_recounts_watched(
    m_get_item,
    m_add_ep,
    m_get_eps,
    m_set_watched,
    m_get_ep,
    m_show_eps,
    m_show,
    token,
    client,
    username,
):
    m_get_item.return_value = {}
    m_show.return_value = {
        "name": "Show",
        "status": "Ended",
        "image": {"original": "new.jpg"},
    }
    # Episode 3 is a special, counted separately
    m_get_eps.return_value = [
        {"episode_api_id": "1"},
        {"episode_api_id": "2"},
        {"episode_api_id": "3"},
    ]
    m_show_eps.return_value = [
        {"id": 1, "type": "regular", "airdate": "2020-01-01"},
        {"id": 2, "type": "regular", "airdate": "2020-01-08"},
        {"id": 3, "type": "insignificant_special", "airdate": "2020-01-09"},
        {"id": 4, "type": "regular", "airdate": "2020-01-15"},
    ]

    response = client.post(
        f"/items/tvmaze/{TEST_SHOW_ID}/episodes",
        headers={"Authorization": token},
        json={"episode_api_id": "1"},
    )

    assert response.status_code == 204
    args = m_set_watched.call_args.args
    assert args[:5] == (username, "tvmaze", TEST_SHOW_ID, 2, 1)
    # Counts and the rest of the cache are refreshed
    assert args[5]["ep_count"] == 3
    assert args[5]["special_count"] == 1
    assert args[5]["image_url"] == "new.jpg"
    assert args[5]["status"] == "Ended"


@patch.object(tenrai.TenraiApi, "get_episode_count")
@patch.object(tenrai.TenraiApi, "get_item")
@patch.object(tenrai.TenraiApi, "get_episode")
@patch("reviews_db.set_watched_eps")
@patch("reviews_db.get_episodes")
@patch("reviews_db.delete_episode")
def test_delete_mal_episode_recounts_watched(
    m_delete_ep,
    m_get_eps,
    m_set_watched,
    m_get_ep,
    m_get_item,
    m_ep_count,
    token,
    client,
    username,
):
    # Stale cache said 24, the source now has 23
    m_get_item.return_value = {
        "data": {
            "episodes": 23,
            "title": "Anime",
            "images": {"jpg": {"image_url": "new.jpg"}},
        }
    }
    m_ep_count.return_value = {"ep_count": 23}
    m_get_eps.return_value = [
        {"episode_api_id": "1"},
        {"episode_api_id": "2"},
    ]

    response = client.delete(
        f"/items/mal/{TEST_SHOW_ID}/episodes/3",
        headers={"Authorization": token},
    )

    assert response.status_code == 204
    m_get_ep.assert_not_called()
    args = m_set_watched.call_args.args
    assert args[:5] == (username, "mal", TEST_SHOW_ID, 2, 0)
    assert args[5]["ep_count"] == 23
    assert args[5]["special_count"] == 0
    assert args[5]["image_url"] == "new.jpg"


@patch("reviews_db.get_watch_dates")
def test_get_watches(m_get_watch_dates, token, client):
    m_get_watch_dates.return_value = [
        {"api_name": "mal", "api_id": "1", "date": "2026-10-01T20:00:00Z"}
    ]

    response = client.get("/watches", headers={"Authorization": token})

    assert response.status_code == 200
    assert response.json() == {
        "watches": [
            {"apiName": "mal", "apiId": "1", "date": "2026-10-01T20:00:00Z"}
        ]
    }


def test_missing_token(client):
    response = client.get("/items")

    assert response.status_code == 401


def test_invalid_sort(client, token):
    response = client.get("/items?sort=nope", headers={"Authorization": token})

    assert response.status_code == 422


def test_invalid_body(client, token):
    response = client.post(
        "/items", headers={"Authorization": token}, json={"api_name": "x"}
    )

    assert response.status_code == 422


@patch("reviews_db.get_all_items")
def test_get_items(m_get_all_items, token, client, username):
    m_get_all_items.return_value = {
        "items": [
            {
                "api_name": "mal",
                "api_id": "1",
                "created_at": "2024-01-01 10:00:00",
                "ep_progress": 50,
                "api_info": "i_mal_1",
            }
        ],
        "end_cursor": "abc",
    }

    response = client.get(
        "/items?sort=latestWatchDate&filter=inProgress&cursor=abc",
        headers={"Authorization": token, "Accept-Encoding": "gzip"},
    )

    assert response.status_code == 200
    assert response.headers["Content-Encoding"] == "gzip"
    assert response.json() == {
        "items": [
            {
                "apiName": "mal",
                "apiId": "1",
                "createdAt": "2024-01-01 10:00:00",
                "epProgress": 50.0,
            }
        ],
        "endCursor": "abc",
    }
    m_get_all_items.assert_called_once_with(
        username, "latest_watch_date", "abc", "in_progress"
    )


@patch("reviews_db.update_item")
@patch("reviews_db.get_episodes")
def test_put_item_without_dates_uses_latest_episode(
    m_get_eps, m_update_item, token, client, username
):
    m_get_eps.return_value = [
        {"dates_watched": ["2024-01-01T20:00:00.000Z"]},
        {"dates_watched": ["2025-03-04T21:00:00.000Z"]},
        {},
    ]

    response = client.put(
        f"/items/tvmaze/{TEST_SHOW_ID}",
        headers={"Authorization": token},
        json={"status": "following"},
    )

    assert response.status_code == 204
    data = m_update_item.call_args.args[3]
    assert data["latest_watch_date"] == "2025-03-04T21:00:00.000Z"


@patch("reviews_db.update_item")
@patch("reviews_db.get_episodes")
def test_put_item_without_dates_or_episodes_drops_from_history(
    m_get_eps, m_update_item, token, client
):
    m_get_eps.return_value = []

    client.put(
        f"/items/tvmaze/{TEST_SHOW_ID}",
        headers={"Authorization": token},
        json={"status": "following"},
    )

    data = m_update_item.call_args.args[3]
    assert data["latest_watch_date"] is None
    assert (
        "latest_watch_date" in m_update_item.call_args.kwargs["clean_whitelist"]
    )


@patch("reviews_db.update_item")
@patch("reviews_db.get_episodes")
def test_put_item_with_dates_skips_episodes(
    m_get_eps, m_update_item, token, client
):
    client.put(
        f"/items/tmdb/{TEST_SHOW_ID}",
        headers={"Authorization": token},
        json={"datesWatched": ["2024-01-01T20:00:00.000Z"]},
    )

    m_get_eps.assert_not_called()
    assert "latest_watch_date" not in m_update_item.call_args.args[3]


@patch("reviews_db.get_watch_dates")
def test_get_other_users_data(m_get_watch_dates, token, client):
    m_get_watch_dates.return_value = []

    client.get("/watches?user=OTHER", headers={"Authorization": token})

    m_get_watch_dates.assert_called_once_with("OTHER")


@patch("reviews_db.update_item")
@patch("reviews_db.get_episodes")
def test_write_ignores_user_param(m_get_eps, m_update_item, token, client):
    m_get_eps.return_value = []

    client.put(
        f"/items/tvmaze/{TEST_SHOW_ID}?user=OTHER",
        headers={"Authorization": token},
        json={"status": "following"},
    )

    assert m_update_item.call_args.args[0] == "TEST_USER"


@patch("users.usernames")
def test_get_users(m_usernames, token, client, monkeypatch):
    monkeypatch.setenv("ADMIN_USERNAME", "TEST_USER")
    m_usernames.return_value = ["OTHER", "TEST_USER"]

    response = client.get("/users", headers={"Authorization": token})

    assert response.json() == {"users": ["OTHER", "TEST_USER"], "admin": True}


@patch("reviews_db.update_item")
def test_also_for_needs_admin(m_update_item, token, client, monkeypatch):
    monkeypatch.setenv("ADMIN_USERNAME", "SOMEONE_ELSE")

    response = client.put(
        f"/items/tmdb/{TEST_SHOW_ID}?alsoFor=OTHER",
        headers={"Authorization": token},
        json={"datesWatched": ["2024-01-01T20:00:00.000Z"]},
    )

    assert response.status_code == 403
    m_update_item.assert_not_called()


def _items_by_user(mine, hers):
    return lambda username, *args, **kwargs: dict(
        mine if username == "TEST_USER" else hers
    )


@patch("reviews_db.update_item")
@patch("reviews_db.get_item")
def test_also_for_merges_dates_keeps_review(
    m_get_item, m_update_item, token, client, monkeypatch
):
    monkeypatch.setenv("ADMIN_USERNAME", "TEST_USER")
    m_get_item.side_effect = _items_by_user(
        {},
        {
            "rating": 9,
            "review": "hers",
            "status": "finished",
            "dates_watched": ["2020-01-01T20:00:00.000Z"],
        },
    )

    response = client.put(
        f"/items/tmdb/{TEST_SHOW_ID}?alsoFor=OTHER",
        headers={"Authorization": token},
        json={"review": "mine", "datesWatched": ["2024-01-01T20:00:00Z"]},
    )

    assert response.status_code == 204
    username, _, _, data = m_update_item.call_args_list[1].args
    assert username == "OTHER"
    assert data["review"] == "hers"
    assert data["rating"] == 9
    assert data["dates_watched"] == [
        "2020-01-01T20:00:00.000Z",
        "2024-01-01T20:00:00.000Z",
    ]


@patch("reviews_db.update_item")
@patch("reviews_db.get_item")
def test_also_for_copies_only_the_rewatch(
    m_get_item, m_update_item, token, client, monkeypatch
):
    monkeypatch.setenv("ADMIN_USERNAME", "TEST_USER")
    m_get_item.side_effect = _items_by_user(
        {"dates_watched": ["1970-01-01T20:00:00.000Z"]}, {}
    )

    client.put(
        f"/items/tmdb/{TEST_SHOW_ID}?alsoFor=OTHER",
        headers={"Authorization": token},
        json={
            "datesWatched": [
                "1970-01-01T20:00:00.000Z",
                "2026-10-18T20:00:00Z",
            ]
        },
    )

    username, _, _, data = m_update_item.call_args_list[1].args
    assert username == "OTHER"
    assert data["dates_watched"] == ["2026-10-18T20:00:00.000Z"]
    assert data["status"] == "finished"


@patch("reviews_db.update_item")
@patch("reviews_db.get_item")
def test_also_for_without_new_dates_writes_nothing(
    m_get_item, m_update_item, token, client, monkeypatch
):
    monkeypatch.setenv("ADMIN_USERNAME", "TEST_USER")
    m_get_item.side_effect = _items_by_user(
        {"dates_watched": ["2024-01-01T20:00:00.000Z"]}, {}
    )

    client.put(
        f"/items/tmdb/{TEST_SHOW_ID}?alsoFor=OTHER",
        headers={"Authorization": token},
        json={"review": "edit", "datesWatched": ["2024-01-01T20:00:00Z"]},
    )

    assert [c.args[0] for c in m_update_item.call_args_list] == ["TEST_USER"]


@patch("reviews_db.update_item")
@patch("reviews_db.get_item")
@patch("reviews_db.get_episodes")
def test_put_without_also_for_skips_extra_read(
    m_get_eps, m_get_item, m_update_item, token, client
):
    m_get_eps.return_value = []

    client.put(
        f"/items/tmdb/{TEST_SHOW_ID}",
        headers={"Authorization": token},
        json={"datesWatched": ["2024-01-01T20:00:00Z"]},
    )

    m_get_item.assert_not_called()


@patch("app.routes._recount_watched_eps")
@patch.object(tvmaze.TvMazeApi, "get_episode")
@patch("reviews_db.add_episode")
@patch("reviews_db.get_episode")
@patch("reviews_db.get_item")
def test_also_for_adds_episode(
    m_get_item,
    m_get_ep,
    m_add_ep,
    m_tvmaze_ep,
    m_recount,
    token,
    client,
    monkeypatch,
):
    monkeypatch.setenv("ADMIN_USERNAME", "TEST_USER")
    m_get_item.return_value = {}
    m_get_ep.side_effect = reviews_db.NotFoundError

    response = client.post(
        f"/items/tvmaze/{TEST_SHOW_ID}/episodes?alsoFor=OTHER",
        headers={"Authorization": token},
        json={"episode_api_id": "1"},
    )

    assert response.status_code == 204
    assert [c.args[0] for c in m_add_ep.call_args_list] == [
        "TEST_USER",
        "OTHER",
    ]
    # Source checked once, for the admin's own add
    m_tvmaze_ep.assert_called_once()
    assert [c.args[0] for c in m_recount.call_args_list] == [
        "TEST_USER",
        "OTHER",
    ]


@patch("app.routes._recount_watched_eps")
@patch("reviews_db.delete_episode")
@patch("reviews_db.get_episode")
def test_also_for_deletes_episode_only_if_there(
    m_get_ep, m_delete_ep, m_recount, token, client, monkeypatch
):
    monkeypatch.setenv("ADMIN_USERNAME", "TEST_USER")
    m_get_ep.side_effect = reviews_db.NotFoundError

    client.delete(
        f"/items/tvmaze/{TEST_SHOW_ID}/episodes/1?alsoFor=OTHER",
        headers={"Authorization": token},
    )

    assert [c.args[0] for c in m_delete_ep.call_args_list] == ["TEST_USER"]
