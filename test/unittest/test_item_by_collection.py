import copy
from unittest.mock import patch

import pytest

from api.item_by_collection import handle
from api_errors import HttpError
from watch_history_db import NotFoundError

TEST_JWT = "eyJraWQiOiIxMjMxMjMxMjM9IiwiYWxnIjoiSFMyNTYifQ.eyJ1c2VybmFtZSI6IlRFU1RfQ0xJRU5UX0lEIn0.ud_dRdguJwmKv4XO-c4JD-dKGffSvXsxuAxZq9uWV-g"


class TestGet:
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

    @patch("api.item_by_collection.watch_history_db.get_item")
    def test_success(self, mocked_get):
        mocked_get.return_value = {"collection_name": "anime", "item_id": 123}

        ret = handle(self.event, None)
        assert ret == {
            "body": '{"collection_name": "anime", "item_id": 123}',
            "statusCode": 200
        }

    @patch("api.item_by_collection.watch_history_db.get_item")
    def test_not_found(self, mocked_get):
        mocked_get.side_effect = NotFoundError

        ret = handle(self.event, None)
        assert ret == {'statusCode': 404}

    def test_invalid_collection_name(self):
        event = copy.deepcopy(self.event)
        event["pathParameters"]["collection_name"] = "INVALID"

        ret = handle(event, None)
        assert ret == {
            'statusCode': 400,
                       'body': '{"message": "Invalid collection name, allowed values: [\'anime\', \'show\', \'movie\']"}'
        }


class TestDelete:
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

    @patch("api.item_by_collection.watch_history_db.delete_item")
    def test_success(self, mocked_delete):
        mocked_delete.return_value = True

        ret = handle(self.event, None)

        assert ret == {'statusCode': 204}


class TestPatch:
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
        "body": '{"rating": 3, "overview": "My overview", "review": "My review"}'
    }

    @pytest.mark.parametrize(
        "collection_name",
        ["anime", "show", "movie"]
    )
    @patch("api.item_by_collection.anime_api.get_anime")
    @patch("api.item_by_collection.watch_history_db.update_item")
    def test_success(self, mocked_get_anime, mocked_post, collection_name):
        mocked_post.return_value = True
        event = copy.deepcopy(self.event)
        event["pathParameters"]["collection_name"] = collection_name

        ret = handle(self.event, None)

        assert ret == {'statusCode': 204}

    @patch("api.item_by_collection.anime_api.get_anime")
    @patch("api.item_by_collection.watch_history_db.update_item")
    def test_not_found_in_api(self, mocked_get_anime, mocked_post):
        mocked_post.return_value = True
        mocked_get_anime.side_effect = HttpError("test not found", 404)

        with pytest.raises(HttpError):
            handle(self.event, None)

    @patch("api.item_by_collection.watch_history_db.update_item")
    def test_invalid_body_type(self, mocked_post):
        mocked_post.return_value = True
        event = copy.deepcopy(self.event)
        event["body"] = '{"rating": "ABC"}'

        ret = handle(event, None)
        assert ret == {
            'statusCode': 400,
            'body': '{"message": "Invalid post schema", "error": "\'ABC\' is not of type \'integer\'"}'
        }

    @patch("api.item_by_collection.watch_history_db.update_item")
    def test_block_additional_properties(self, mocked_post):
        mocked_post.return_value = True
        event = copy.deepcopy(self.event)
        event["body"] = '{"rating": 1, "werid_property": "123"}'

        ret = handle(event, None)
        assert ret == {
            'statusCode': 400,
            'body': '{"message": "Invalid post schema", "error": "Additional properties are not allowed (\'werid_property\' was unexpected)"}'
        }

    @patch("api.item_by_collection.watch_history_db.update_item")
    def test_invalid_body_format(self, mocked_post):
        mocked_post.return_value = True
        event = copy.deepcopy(self.event)
        event["body"] = "INVALID"

        ret = handle(event, None)
        assert ret == {'body': 'Invalid patch body', 'statusCode': 400}
