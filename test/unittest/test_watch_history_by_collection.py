import json
from decimal import Decimal
from unittest.mock import patch

from api.watch_history_by_collection import handle
from schema import ALLOWED_SORT
from watch_history_db import NotFoundError

TEST_CLIENT_ID = "TEST_CLIENT_ID"
TEST_JWT = "eyJraWQiOiIxMjMxMjMxMjM9IiwiYWxnIjoiSFMyNTYifQ.eyJjbGllbnRfaWQiOiJURVNUX0NMSUVOVF9JRCJ9.tmBhM3qCJrWJ-bebHXsO9lfmNbF7kYGvMH_qbzNojZQ"


@patch("api.watch_history_by_collection.watch_history_db.get_watch_history")
def test_handler(mocked_get_watch_history):
    mocked_get_watch_history.return_value = [{"collection_name": "anime", "item_id": Decimal(123)}]

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

    ret = handle(event, None)
    assert ret == {"body": '[{"collection_name": "anime", "item_id": 123}]', "statusCode": 200}


def test_handler_invalid_sort():
    event = {
        "headers": {
            "authorization": TEST_JWT
        },
        "queryStringParameters": {
            "sort": "INVALID"
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

    ret = handle(event, None)

    assert ret == {
        "statusCode": 400,
        "body": json.dumps({"error": f"Invalid sort specified. Allowed values: {ALLOWED_SORT}"})
    }


@patch("api.watch_history_by_collection.watch_history_db.get_watch_history")
def test_handler_sort(mocked_get_watch_history):
    mocked_get_watch_history.return_value = [{"collection_name": "anime", "item_id": Decimal(123)}]

    event = {
        "headers": {
            "authorization": TEST_JWT
        },
        "queryStringParameters": {
            "sort": "date_watched"
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

    ret = handle(event, None)

    assert ret == {'body': '[{"collection_name": "anime", "item_id": 123}]', 'statusCode': 200}


@patch("api.watch_history_by_collection.watch_history_db.get_watch_history")
def test_handler_limit_and_start(mocked_get_watch_history):
    mocked_get_watch_history.return_value = [{"collection_name": "anime", "item_id": Decimal(123)}]

    event = {
        "headers": {
            "authorization": TEST_JWT
        },
        "queryStringParameters": {
            "limit": "200",
            "start": "23"
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

    ret = handle(event, None)

    assert ret == {'body': '[{"collection_name": "anime", "item_id": 123}]', 'statusCode': 200}


def test_handler_invalid_limit_type():
    event = {
        "headers": {
            "authorization": TEST_JWT
        },
        "queryStringParameters": {
            "limit": "ABC",
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

    ret = handle(event, None)

    assert ret == {'body': '{"message": "Invalid limit type"}', 'statusCode': 400}


def test_handler_invalid_start_type():
    event = {
        "headers": {
            "authorization": TEST_JWT
        },
        "queryStringParameters": {
            "start": "ABC",
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

    ret = handle(event, None)

    assert ret == {'body': '{"message": "Invalid start type"}', 'statusCode': 400}


@patch("api.watch_history_by_collection.watch_history_db.get_watch_history")
def test_handler_not_found(mocked_get_watch_history):
    mocked_get_watch_history.side_effect = NotFoundError

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

    ret = handle(event, None)

    assert ret == {'statusCode': 404}


@patch("api.watch_history_by_collection.watch_history_db.update_item")
def test_handler_post_without_body(mocked_post):
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
            "collection_name": "anime",
            "item_id": "123"
        }
    }

    ret = handle(event, None)
    assert ret == {'body': '{"message": "Invalid post schema", "error": "Empty validation dict"}',
                   'statusCode': 400}
