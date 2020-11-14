from unittest.mock import patch

from api.episode_by_id import handle
from episodes_db import NotFoundError

TEST_JWT = "eyJraWQiOiIxMjMxMjMxMjM9IiwiYWxnIjoiSFMyNTYifQ.eyJ1c2VybmFtZSI6IlRFU1RfQ0xJRU5UX0lEIn0.ud_dRdguJwmKv4XO-c4JD-dKGffSvXsxuAxZq9uWV-g"


@patch("api.episode_by_id.episodes_db.get_episode")
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
            "item_id": "123",
            "episode_id": "345"
        }
    }

    ret = handle(event, None)
    assert ret == {'body': '{"collection_name": "anime", "item_id": 123}', 'statusCode': 200}


@patch("api.episode_by_id.episodes_db.get_episode")
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
            "item_id": "123",
            "episode_id": "345"
        }
    }

    ret = handle(event, None)
    assert ret == {'statusCode': 404}


@patch("api.episode_by_id.episodes_db.delete_episode")
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
            "item_id": "123",
            "episode_id": "345"
        }
    }

    ret = handle(event, None)
    assert ret == {'statusCode': 204}


@patch("api.episode_by_id.episodes_db.update_episode")
def test_handler_patch(mocked_post):
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
            "item_id": "123",
            "episode_id": "345"
        },
        "body": '{"rating": 3, "overview": "My overview", "review": "My review"}'
    }

    ret = handle(event, None)
    assert ret == {'statusCode': 204}


@patch("api.episode_by_id.episodes_db.update_episode")
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
            "item_id": "123",
            "episode_id": "345"
        },
        "body": '{"rating": "ABC"}'
    }

    ret = handle(event, None)
    assert ret == {'statusCode': 400, 'body': '{"message": "Invalid post schema", "error": "\'ABC\' is not of type \'integer\'"}'}


@patch("api.episode_by_id.episodes_db.update_episode")
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
            "item_id": "123",
            "episode_id": "345"
        },
        "body": '{"rating": 1, "werid_property": "123"}'
    }

    ret = handle(event, None)
    assert ret == {'statusCode': 400, 'body': '{"message": "Invalid post schema", "error": "Additional properties are not allowed (\'werid_property\' was unexpected)"}'}


@patch("api.episode_by_id.episodes_db.update_episode")
def test_handler_patch_invalid_body_format(mocked_post):
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
            "item_id": "123",
            "episode_id": "345"
        },
        "body": 'INVALID'
    }

    ret = handle(event, None)
    assert ret == {'body': 'Invalid patch body', 'statusCode': 400}


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
            "item_id": "123",
            "episode_id": "345"
        }
    }

    ret = handle(event, None)
    assert ret == {'statusCode': 400, 'body': '{"message": "Invalid collection name, allowed values: [\'anime\', \'show\', \'movie\']"}'}
