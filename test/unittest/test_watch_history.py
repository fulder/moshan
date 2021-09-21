import json
from decimal import Decimal
from unittest.mock import patch

from api.watch_history import ALLOWED_SORT, handle
from watch_history_db import NotFoundError

TEST_JWT = "eyJraWQiOiIxMjMxMjMxMjM9IiwiYWxnIjoiSFMyNTYifQ.eyJ1c2VybmFtZSI6IlRFU1RfQ0xJRU5UX0lEIn0.ud_dRdguJwmKv4XO-c4JD-dKGffSvXsxuAxZq9uWV-g"


@patch("api.watch_history.anime_api.get_anime")
@patch("api.watch_history.watch_history_db.get_watch_history")
def test_handler(mocked_get_watch_history, mocked_get_anime):
    mocked_get_watch_history.return_value = [
        {
            "collection_name": "anime",
            "item_id": Decimal(123),
            "username": "user",
        }
    ]
    mocked_get_anime.return_value = {
        "mal_id": 1,
    }

    event = {
        "headers": {
            "authorization": TEST_JWT
        }
    }

    ret = handle(event, None)
    assert ret == {"body": '{"items": [{"mal_id": 1, "collection_name": "anime"}]}', "statusCode": 200}


def test_handler_invalid_sort():
    event = {
        "headers": {
            "authorization": TEST_JWT
        },
        "queryStringParameters": {
            "sort": "INVALID"
        }
    }

    ret = handle(event, None)

    assert ret == {
        "statusCode": 400,
        "body": json.dumps({"error": f"Invalid sort specified. Allowed values: {ALLOWED_SORT}"})
    }


@patch("api.watch_history.anime_api.get_anime")
@patch("api.watch_history.watch_history_db.get_watch_history")
def test_handler_sort(mocked_get_watch_history, mocked_get_anime):
    mocked_get_watch_history.return_value = [
        {
            "collection_name": "anime",
            "item_id": Decimal(123),
            "username": "user",
        }
    ]

    event = {
        "headers": {
            "authorization": TEST_JWT
        },
        "queryStringParameters": {
            "sort": "latest_watch_date"
        }
    }

    ret = handle(event, None)

    assert ret == {'body': '{"items": [{"collection_name": "anime"}]}', 'statusCode': 200}


@patch("api.watch_history.watch_history_db.get_watch_history")
def test_handler_not_found(mocked_get_watch_history):
    mocked_get_watch_history.side_effect = NotFoundError

    event = {
        "headers": {
            "authorization": TEST_JWT
        }
    }

    ret = handle(event, None)

    assert ret == {"statusCode": 200, "body": json.dumps({"items": []})}
