import json
from decimal import Decimal
from unittest.mock import MagicMock

from api.watch_history import ALLOWED_SORT

TEST_CLIENT_ID = "TEST_CLIENT_ID"
TEST_JWT = "eyJraWQiOiIxMjMxMjMxMjM9IiwiYWxnIjoiSFMyNTYifQ.eyJjbGllbnRfaWQiOiJURVNUX0NMSUVOVF9JRCJ9.tmBhM3qCJrWJ-bebHXsO9lfmNbF7kYGvMH_qbzNojZQ"

MOCK_KWARGS = {}
MOCK_ARGS = {}
MOCK_RETURN = None


def mock_func(*args, **kwargs):
    global MOCK_KWARGS, MOCK_ARGS
    MOCK_KWARGS = kwargs
    MOCK_ARGS = args
    return MOCK_RETURN


def test_handler(mocked_watch_history_by_collection_handler):
    global MOCK_RETURN
    MOCK_RETURN = [{"collection_name": "ANIME", "item_id": Decimal(123)}]
    mocked_watch_history_by_collection_handler.watch_history_db.get_watch_history = mock_func

    event = {
        "headers": {
            "authorization": TEST_JWT
        },
        "pathParameters": {
            "collection_name": "ANIME"
        }
    }

    ret = mocked_watch_history_by_collection_handler.handle(event, None)

    assert MOCK_ARGS == (TEST_CLIENT_ID,)
    assert MOCK_KWARGS == {"collection_name": "ANIME", "index_name": None, "limit": 100, "start": 1}
    assert ret == {"body": '[{"collection_name": "ANIME", "item_id": 123}]', "statusCode": 200}


def test_handler_invalid_sort(mocked_watch_history_by_collection_handler):
    mocked_watch_history_by_collection_handler.watch_history_db.get_watch_history = mock_func

    event = {
        "headers": {
            "authorization": TEST_JWT
        },
        "queryStringParameters": {
            "sort": "INVALID"
        },
        "pathParameters": {
            "collection_name": "ANIME"
        }
    }

    ret = mocked_watch_history_by_collection_handler.handle(event, None)

    assert MOCK_ARGS == (TEST_CLIENT_ID,)
    assert MOCK_KWARGS == {"collection_name": "ANIME", "index_name": None, "limit": 100, "start": 1}
    assert ret == {
        "statusCode": 400,
        "body": json.dumps({"error": f"Invalid sort specified. Allowed values: {ALLOWED_SORT}"})
    }


def test_handler_sort(mocked_watch_history_by_collection_handler):
    mocked_watch_history_by_collection_handler.watch_history_db.get_watch_history = mock_func

    event = {
        "headers": {
            "authorization": TEST_JWT
        },
        "queryStringParameters": {
            "sort": "date_watched"
        },
        "pathParameters": {
            "collection_name": "ANIME"
        }
    }

    ret = mocked_watch_history_by_collection_handler.handle(event, None)

    assert MOCK_ARGS == (TEST_CLIENT_ID,)
    assert MOCK_KWARGS == {"collection_name": "ANIME", 'index_name': 'date_watched', 'limit': 100, 'start': 1}
    assert ret == {'body': '[{"collection_name": "ANIME", "item_id": 123}]', 'statusCode': 200}


def test_handler_limit_and_start(mocked_watch_history_by_collection_handler):
    mocked_watch_history_by_collection_handler.watch_history_db.get_watch_history = mock_func

    event = {
        "headers": {
            "authorization": TEST_JWT
        },
        "queryStringParameters": {
            "limit": "200",
            "start": "23"
        },
        "pathParameters": {
            "collection_name": "ANIME"
        }
    }

    ret = mocked_watch_history_by_collection_handler.handle(event, None)

    assert MOCK_ARGS == (TEST_CLIENT_ID,)
    assert MOCK_KWARGS == {"collection_name": "ANIME", 'index_name': None, 'limit': 200, 'start': 23}
    assert ret == {'body': '[{"collection_name": "ANIME", "item_id": 123}]', 'statusCode': 200}


def test_handler_invalid_limit_type(mocked_watch_history_by_collection_handler):
    mocked_watch_history_by_collection_handler.watch_history_db.get_watch_history = mock_func

    event = {
        "headers": {
            "authorization": TEST_JWT
        },
        "queryStringParameters": {
            "limit": "ABC",
        },
        "pathParameters": {
            "collection_name": "ANIME"
        }
    }

    ret = mocked_watch_history_by_collection_handler.handle(event, None)

    assert ret == {'body': '{"message": "Invalid limit type"}', 'statusCode': 400}


def test_handler_invalid_start_type(mocked_watch_history_by_collection_handler):
    mocked_watch_history_by_collection_handler.watch_history_db.get_watch_history = mock_func

    event = {
        "headers": {
            "authorization": TEST_JWT
        },
        "queryStringParameters": {
            "start": "ABC",
        },
        "pathParameters": {
            "collection_name": "ANIME"
        }
    }

    ret = mocked_watch_history_by_collection_handler.handle(event, None)

    assert ret == {'body': '{"message": "Invalid start type"}', 'statusCode': 400}
