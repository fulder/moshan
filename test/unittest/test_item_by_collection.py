from unittest.mock import patch

from api.item_by_collection import handle
from watch_history_db import NotFoundError

TEST_CLIENT_ID = "TEST_CLIENT_ID"
TEST_JWT = "eyJraWQiOiIxMjMxMjMxMjM9IiwiYWxnIjoiSFMyNTYifQ.eyJjbGllbnRfaWQiOiJURVNUX0NMSUVOVF9JRCJ9.tmBhM3qCJrWJ-bebHXsO9lfmNbF7kYGvMH_qbzNojZQ"


@patch("api.item_by_collection.watch_history_db.get_item")
def test_handler_get(mocked_get):
    mocked_get.return_value = {"collection_name": "anime", "item_id": 123}

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
            "collection_name": "anime",
            "item_id": "123"
        }
    }

    ret = handle(event, None)
    assert ret == {'body': '{"collection_name": "anime", "item_id": 123}', 'statusCode': 200}


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
            "collection_name": "anime",
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
            "collection_name": "anime",
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
                "method": "PATCH"
            }
        },
        "pathParameters": {
            "collection_name": "anime",
            "item_id": "123"
        },
        "body": {
            "rating": 3,
            "overview": "My overview",
            "review": "My review"
        }
    }

    ret = handle(event, None)
    assert ret == {'statusCode': 204}


@patch("api.item_by_collection.watch_history_db.update_item")
def test_handler_patch_validation_failure(mocked_post):
    mocked_post.return_value = True

    event = {
        "headers": {
            "authorization": TEST_JWT
        },
        "requestContext": {
            "http": {
                "method": "PATCH"
            }
        },
        "pathParameters": {
            "collection_name": "anime",
            "item_id": "123"
        },
        "body": {
            "rating": "ABC",
        }
    }

    ret = handle(event, None)
    assert ret == {'statusCode': 400, 'body': '{"message": "Invalid post schema", "error": "\'ABC\' is not of type \'integer\'"}'}


@patch("api.item_by_collection.watch_history_db.update_item")
def test_handler_patch_block_additional_properties(mocked_post):
    mocked_post.return_value = True

    event = {
        "headers": {
            "authorization": TEST_JWT
        },
        "requestContext": {
            "http": {
                "method": "PATCH"
            }
        },
        "pathParameters": {
            "collection_name": "anime",
            "item_id": "123"
        },
        "body": {
            "rating": 1,
            "werid_property": "123"
        }
    }

    ret = handle(event, None)
    assert ret == {'statusCode': 400, 'body': '{"message": "Invalid post schema", "error": "Additional properties are not allowed (\'werid_property\' was unexpected)"}'}


def test_handler_invalid_collection_name():
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
            "collection_name": "INVALID",
            "item_id": "123"
        }
    }

    ret = handle(event, None)
    assert ret == {'statusCode': 400, 'body': '{"message": "Invalid collection name, allowed values: [\'anime\', \'show\', \'movie\']"}'}
