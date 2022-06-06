from unittest.mock import patch

import reviews_db
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

    api_info = f"tvmaze_{TEST_SHOW_ID}_{TEST_EPISODE_ID}"

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
            "episode_api_id": 1,
            "created_at": "ep_1_created_at",
        },
        {
            "api_id": TEST_SHOW_ID,
            "api_name": "tvmaze",
            "episode_api_id": 2,
            "created_at": "ep_2_created_at",
        },
        {
            "api_id": TEST_SHOW_ID,
            "api_name": "tvmaze",
            "episode_api_id": 3,
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
