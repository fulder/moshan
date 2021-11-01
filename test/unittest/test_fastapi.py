from datetime import datetime
from unittest import mock
from unittest.mock import patch

import jwt
import pytest
from boto3.dynamodb.conditions import Key, Attr

from starlette.testclient import TestClient
from api.watch_histories import app
from tvmaze import TvMazeApi

client = TestClient(app)

TEST_USER = "TEST_USER"
TEST_SHOW_ID = "123123"


@pytest.fixture
def test_token():
    return jwt.encode(
        {"username": TEST_USER},
        "secret",
        algorithm="HS256"
    ).decode("utf-8")


class TestGetItem:
    def test_get_item(self, mocked_watch_history_db, test_token):
        mocked_watch_history_db.table.query.return_value = {
            "Items": [
                {
                    "api_info": f"tvmaze_{TEST_SHOW_ID}"
                }
            ]
        }

        response = client.get(
            f"/watch-histories/items/tvmaze/{TEST_SHOW_ID}",
            headers={"Authorization": test_token}
        )

        exp_kwargs = {
            "IndexName": "api_info",
            "KeyConditionExpression":
                Key("username").eq(TEST_USER) &
                Key("api_info").eq(f"tvmaze_{TEST_SHOW_ID}"),
            "FilterExpression": Attr("deleted_at").not_exists(),
        }
        mocked_watch_history_db.table.query.assert_called_with(**exp_kwargs)
        assert response.status_code == 200
        assert response.json() == {"api_info": f"tvmaze_{TEST_SHOW_ID}"}

    def test_get_item_not_found(self, mocked_watch_history_db, test_token):
        mocked_watch_history_db.table.query.return_value = {
            "Items": []
        }

        response = client.get(
            f"/watch-histories/items/tvmaze/{TEST_SHOW_ID}",
            headers={"Authorization": test_token}
        )

        assert response.status_code == 404


@patch.object(TvMazeApi, "get_show_episodes_count")
class TestPostItem:

    def test_post_item(self, mocked_tvmaze_episodes_count,
                       test_token, mocked_watch_history_db):
        mocked_tvmaze_episodes_count.return_value = {
            "ep_count": 1,
            "special_count": 2,
        }
        mocked_watch_history_db.table.query.return_value = {
            "Items": [
                {}
            ]
        }
        response = client.post(
            "/watch-histories/items",
            headers={"Authorization": test_token},
            json={
                "item_api_id": TEST_SHOW_ID,
                "api_name": "tvmaze"
            }
        )

        mocked_watch_history_db.table.update_item.assert_called_with(
            Key={
                "username": TEST_USER,
                "item_id": "d2a81cbb-9a60-52ec-a020-bc699d17790c"
            },
            UpdateExpression="SET "
                             "#ep_count=:ep_count,"
                             "#special_count=:special_count,"
                             "#ep_progress=:ep_progress,"
                             "#special_progress=:special_progress,"
                             "#watched_eps=:watched_eps,"
                             "#watched_special=:watched_special,"
                             "#api_info=:api_info,"
                             "#collection_name=:collection_name,"
                             "#updated_at=:updated_at "
                             "REMOVE "
                             "#deleted_at",
            ExpressionAttributeNames={
                "#ep_count": "ep_count",
                "#special_count": "special_count",
                "#ep_progress": "ep_progress",
                "#special_progress": "special_progress",
                "#watched_eps": "watched_eps",
                "#watched_special": "watched_special",
                "#api_info": "api_info",
                "#collection_name": "collection_name",
                "#updated_at": "updated_at",
                "#deleted_at": "deleted_at"
            },
            ExpressionAttributeValues={
                ":ep_count": 1,
                ":special_count": 2,
                ":ep_progress": 0,
                ":special_progress": 0,
                ":watched_eps": 0,
                ":watched_special": 0,
                ":api_info": f"tvmaze_{TEST_SHOW_ID}",
                ":collection_name": "show",
                ":updated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            })
        assert response.status_code == 204

    # def test_get_item_not_found(self, mocked_watch_history_db, test_token):
    #     mocked_watch_history_db.table.query.return_value = {
    #         "Items": []
    #     }
    #
    #     response = client.get(
    #         f"/watch-histories/items/tvmaze/{TEST_SHOW_ID}",
    #         headers={"Authorization": test_token}
    #     )
    #
    #     assert response.status_code == 404
