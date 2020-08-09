import json
from decimal import Decimal
from unittest.mock import patch

from anime_api import HttpError
from api.episode_by_collection_item import handle
from schema import ALLOWED_SORT
from episodes_db import NotFoundError

TEST_JWT = "eyJraWQiOiIxMjMxMjMxMjM9IiwiYWxnIjoiSFMyNTYifQ.eyJ1c2VybmFtZSI6IlRFU1RfQ0xJRU5UX0lEIn0.ud_dRdguJwmKv4XO-c4JD-dKGffSvXsxuAxZq9uWV-g"


@patch("api.episode_by_collection_item.episodes_db.get_episodes")
def test_handler(mocked_get_episodes):
    mocked_get_episodes.return_value = {
        "items": {"123": {"collection_name": "anime", "item_id": Decimal(123), "episode_id": Decimal(345)}}
    }

    event = {
        "headers": {
            "authorization": TEST_JWT
        },
        "pathParameters": {
            "collection_name": "anime",
            "item_id": 123
        },
        "requestContext": {
            "http": {
                "method": "GET"
            }
        }
    }

    ret = handle(event, None)
    assert ret == {
        'body': '{"items": {"123": {"collection_name": "anime", "item_id": 123, "episode_id": 345}}}',
        "statusCode": 200
    }


@patch("api.episode_by_collection_item.episodes_db.get_episodes")
def test_handler_limit_and_start(mocked_get_episodes):
    mocked_get_episodes.return_value = [{"collection_name": "test_collection", "item_id": Decimal(123), "episode_id": Decimal(345)}]

    event = {
        "headers": {
            "authorization": TEST_JWT
        },
        "queryStringParameters": {
            "limit": "200",
            "start": "23"
        },
        "pathParameters": {
            "collection_name": "test_collection",
            "item_id": 123
        },
        "requestContext": {
            "http": {
                "method": "GET"
            }
        }
    }

    ret = handle(event, None)

    assert ret == {'body': '[{"collection_name": "test_collection", "item_id": 123, "episode_id": 345}]', 'statusCode': 200}


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


@patch("api.episode_by_collection_item.episodes_db.get_episodes")
def test_handler_not_found(mocked_get_episodes):
    mocked_get_episodes.side_effect = NotFoundError

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

    assert ret == {"statusCode": 200, "body": json.dumps({"episodes": []})}


@patch("api.episode_by_collection_item.episodes_db.update_episode")
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
    assert ret == {'body': 'Invalid post body', 'statusCode': 400}


@patch("api.episode_by_collection_item.episodes_db.update_episode")
def test_handler_post_with_empty_body(mocked_post):
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
        },
        "body": ''
    }

    ret = handle(event, None)
    assert ret == {'body': 'Invalid post body', 'statusCode': 400}


@patch("api.episode_by_collection_item.episodes_db.add_episode")
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
            "collection_name": "anime",
            "item_id": "123"
        },
        "body": '{ "episode_id": 123 }'
    }

    ret = handle(event, None)
    assert ret == {'statusCode': 204}


@patch("api.episode_by_collection_item.episodes_db.update_episode")
def test_handler_post_invalid_collection(mocked_post):
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
            "collection_name": "INVALID",
            "item_id": "123"
        },
        "body": '{ "episode_id": 123 }'
    }

    ret = handle(event, None)
    assert ret == {
        'body': '{"message": "Invalid collection name, allowed values: [\'anime\', \'show\', \'movie\']"}',
        'statusCode': 400
    }


@patch("api.episode_by_collection_item.episodes_db.update_episode")
def test_handler_post_invalid_body(mocked_post):
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
            "collection_name": "INVALID",
            "item_id": "123"
        },
        "body": "INVALID"
    }

    ret = handle(event, None)
    assert ret == {'body': 'Invalid post body', 'statusCode': 400}


@patch("api.episode_by_collection_item.episodes_db.update_episode")
def test_handler_post_invalid_body_schema(mocked_post):
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
        },
        "body": '{"invalid": "val"}'
    }

    ret = handle(event, None)
    assert ret == {
        'body': '{"message": "Invalid post schema", "error": "Additional properties are not allowed (\'invalid\' was unexpected)"}',
        'statusCode': 400
    }
