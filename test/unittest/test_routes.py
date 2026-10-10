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
