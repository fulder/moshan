from unittest.mock import patch

import episodes_db
import tvmaze
import utils
import watch_history_db

TEST_SHOW_ID = "123123"
TEST_EPISODE_ID = "456465"


@patch("watch_history_db.get_item_by_api_id")
def test_get_item(m_get_item, token, client, username):
    response = client.get(
        f"/watch-histories/items/tvmaze/{TEST_SHOW_ID}",
        headers={"Authorization": token}
    )

    assert response.status_code == 200


@patch("watch_history_db.get_item_by_api_id")
def test_not_found(m_get_item, client, token):
    m_get_item.side_effect = watch_history_db.NotFoundError

    response = client.get(
        f"/watch-histories/items/tvmaze/{TEST_SHOW_ID}",
        headers={"Authorization": token}
    )

    assert response.status_code == 404


@patch.object(tvmaze.TvMazeApi, "get_show_episodes_count")
@patch("watch_history_db.get_item_by_api_id")
@patch("watch_history_db.add_item_v2")
def test_post_item(m_add_item, m_get_item, mocked_ep_count, token, client):
    mocked_ep_count.return_value = {
        "ep_count": 1,
        "special_count": 2,
    }

    m_get_item.return_value = {}

    response = client.post(
        "/watch-histories/items",
        headers={"Authorization": token},
        json={
            "item_api_id": TEST_SHOW_ID,
            "api_name": "tvmaze"
        }
    )

    assert response.status_code == 204


@patch.object(tvmaze.TvMazeApi, "get_show_episodes_count")
def test_post_item_tvmaze_error(m_ep_count, token, client):
    m_ep_count.side_effect = utils.HttpError(503)

    response = client.post(
        "/watch-histories/items",
        headers={"Authorization": token},
        json={
            "item_api_id": TEST_SHOW_ID,
            "api_name": "tvmaze"
        }
    )

    assert response.status_code == 503


@patch.object(tvmaze.TvMazeApi, "get_show_episodes_count")
@patch("watch_history_db.get_item_by_api_id")
@patch("watch_history_db.add_item_v2")
def test_post_item_not_found(m_add_item, m_get_item, mocked_ep_count, token,
                             client):
    mocked_ep_count.return_value = {
        "ep_count": 1,
        "special_count": 2,
    }
    m_get_item.side_effect = [
        watch_history_db.NotFoundError, {"Items": []}
    ]

    response = client.post(
        "/watch-histories/items",
        headers={"Authorization": token},
        json={
            "item_api_id": TEST_SHOW_ID,
            "api_name": "tvmaze"
        }
    )

    assert response.status_code == 204


@patch("episodes_db.get_episode_by_api_id")
def test_get_episode(m_get_ep, token, client, username):
    api_info = f"tvmaze_{TEST_SHOW_ID}_{TEST_EPISODE_ID}"
    m_get_ep.return_value = {
        "api_info": api_info
    }

    response = client.get(
        f"/watch-histories/items/tvmaze/{TEST_SHOW_ID}/episodes/{TEST_EPISODE_ID}",
        headers={"Authorization": token}
    )

    assert response.status_code == 200
    assert response.json() == {"api_info": api_info}


@patch("episodes_db.get_episode_by_api_id")
def test_get_episode_not_found(m_get_ep, token, client, username):
    m_get_ep.side_effect = episodes_db.NotFoundError

    response = client.get(
        f"/watch-histories/items/tvmaze/{TEST_SHOW_ID}/episodes/{TEST_EPISODE_ID}",
        headers={"Authorization": token}
    )

    assert response.status_code == 404


@patch.object(tvmaze.TvMazeApi, "get_episode")
@patch("watch_history_db.get_item_by_api_id")
@patch("episodes_db.update_episode_v2")
def test_put_episode(m_update_ep, m_get_item, m_get_ep, token, client,
                     username):
    response = client.put(
        f"/watch-histories/items/tvmaze/{TEST_SHOW_ID}/episodes/{TEST_EPISODE_ID}",
        headers={"Authorization": token},
        json={
            "review": "new_review"
        }
    )

    assert response.status_code == 204


@patch("episodes_db.get_episodes")
def test_get_episodes(m_get_eps, token, client, username):
    m_get_eps.return_value = [1, 2, 3]

    response = client.get(
        f"/watch-histories/items/tvmaze/{TEST_SHOW_ID}/episodes",
        headers={"Authorization": token},
    )

    assert response.status_code == 200
    assert response.json() == m_get_eps.return_value
