import json
from decimal import Decimal
from unittest.mock import patch

from api.item_by_collection import handle
from watch_history_db import NotFoundError

TEST_CLIENT_ID = "TEST_CLIENT_ID"
TEST_JWT = "eyJraWQiOiIxMjMxMjMxMjM9IiwiYWxnIjoiSFMyNTYifQ.eyJjbGllbnRfaWQiOiJURVNUX0NMSUVOVF9JRCJ9.tmBhM3qCJrWJ-bebHXsO9lfmNbF7kYGvMH_qbzNojZQ"


@patch("api.item_by_collection.watch_history_db.get_item")
def test_handler_get(mocked_get):
    mocked_get.return_value = {"collection_name": "ANIME", "item_id": 123}

    event = {
        "headers": {
            "authorization": TEST_JWT
        },
        "requestContext": {
            "http": {
                "method": "GET"
            }
        },
        "pathParameters": {
            "collection_name": "ANIME",
            "item_id": "123"
        }
    }

    ret = handle(event, None)
    assert ret == {'body': '{"collection_name": "ANIME", "item_id": 123}', 'statusCode': 200}


@patch("api.item_by_collection.watch_history_db.get_item")
def test_handler_get_not_found(mocked_get):
    mocked_get.side_effect = NotFoundError

    event = {
        "headers": {
            "authorization": TEST_JWT
        },
        "requestContext": {
            "http": {
                "method": "GET"
            }
        },
        "pathParameters": {
            "collection_name": "ANIME",
            "item_id": "123"
        }
    }

    ret = handle(event, None)
    assert ret == {'statusCode': 404}


@patch("api.item_by_collection.watch_history_db.delete_item")
def test_handler_delete(mocked_delete):
    mocked_delete.return_value = True

    event = {
        "headers": {
            "authorization": TEST_JWT
        },
        "requestContext": {
            "http": {
                "method": "DELETE"
            }
        },
        "pathParameters": {
            "collection_name": "ANIME",
            "item_id": "123"
        }
    }

    ret = handle(event, None)
    assert ret == {'statusCode': 204}


@patch("api.item_by_collection.watch_history_db.update_item")
def test_handler_post(mocked_post):
    mocked_post.return_value = True

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
            "collection_name": "ANIME",
            "item_id": "123"
        }
    }

    ret = handle(event, None)
    assert ret == {'statusCode': 204}
