import copy
import json
from decimal import Decimal
from unittest.mock import patch

from utils import HttpError
from api.watch_history_by_collection import handle
from schema import ALLOWED_SORT
from watch_history_db import NotFoundError

TEST_JWT = "eyJraWQiOiIxMjMxMjMxMjM9IiwiYWxnIjoiSFMyNTYifQ.eyJ1c2VybmFtZSI6IlRFU1RfQ0xJRU5UX0lEIn0.ud_dRdguJwmKv4XO-c4JD-dKGffSvXsxuAxZq9uWV-g"


class TestGet:
    event = {
        "headers": {
            "authorization": TEST_JWT
        },
        "pathParameters": {
            "collection_name": "anime"
        },
        "requestContext": {
            "http": {
                "method": "GET"
            }
        }
    }

    @patch("utils.merge_media_api_info_from_items")
    @patch("api.watch_history_by_collection.watch_history_db.get_watch_history")
    def test_success(self, mocked_get_watch_history, mocked_get_media_api_info):
        mocked_get_media_api_info.return_value = [
            {
                "collection_name": "anime",
                "item_id": 123,
                "username": "user",
                "test_key": "test_value",
            }
        ]

        ret = handle(self.event, None)

        assert ret == {
            "body": json.dumps(
                {"items": mocked_get_media_api_info.return_value}),
            "statusCode": 200
        }

    def test_invalid_sort(self):
        event = copy.deepcopy(self.event)
        event["queryStringParameters"] = {
            "sort": "INVALID"
        }

        ret = handle(event, None)

        err = f"Invalid sort specified. Allowed values: {ALLOWED_SORT}"
        assert ret == {
            "statusCode": 400,
            "body": json.dumps({"error": err})
        }

    @patch("utils.merge_media_api_info_from_items")
    @patch("api.watch_history_by_collection.watch_history_db.get_watch_history")
    def test_sort_success(self, mocked_get_watch_history, mocked_get_media_api_info):
        mocked_get_media_api_info.return_value = [
            {
                "collection_name": "anime",
                "item_id": 123,
                "username": "user",
            }
        ]
        event = copy.deepcopy(self.event)
        event["queryStringParameters"] = {
            "sort": "latest_watch_date"
        }

        ret = handle(event, None)

        assert ret == {
            "body": json.dumps({"items":  mocked_get_media_api_info.return_value}),
            "statusCode": 200
        }

    @patch("api.watch_history_by_collection.watch_history_db.get_watch_history")
    def test_not_found(self, mocked_get_watch_history):
        mocked_get_watch_history.side_effect = NotFoundError

        ret = handle(self.event, None)

        assert ret == {
            "statusCode": 200,
            "body": json.dumps({"items": []})
        }


class TestPost:
    event = {
        "headers": {
            "authorization": TEST_JWT
        },
        "requestContext": {
            "http": {
                "method": "POST"
            }
        },
        "pathParameters": {
            "collection_name": "anime",
        },
        "body": '{ "api_id": "123", "api_name": "mal" }'
    }

    @patch("api.watch_history_by_collection.watch_history_db.update_item")
    def test_invalid_collection(self, mocked_post):
        mocked_post.return_value = True
        event = copy.deepcopy(self.event)
        event["pathParameters"]["collection_name"] = "INVALID"

        ret = handle(event, None)
        msg = "Invalid collection name, allowed values: " \
              "['anime', 'show', 'movie']"
        assert ret == {
            "body": json.dumps({"message": msg}),
            "statusCode": 400
        }
