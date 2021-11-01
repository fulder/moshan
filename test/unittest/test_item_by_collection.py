import copy
from unittest.mock import patch

import pytest

from api.item_by_collection import handle
from utils import HttpError
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
    @patch("api.item_by_collection.anime_api.get_anime")
    def test_success_anime(self, mocked_anime_get, mocked_get):
        mocked_anime_get.return_value = {"mal_id": 564}
        mocked_get.return_value = {"collection_name": "anime", "item_id": 123}

        ret = handle(self.event, None)
        assert ret == {
            "body": '{"collection_name": "anime", '
                    '"item_id": 123, "mal_id": 564}',
            "statusCode": 200
        }

    @patch("api.item_by_collection.watch_history_db.get_item")
    @patch("api.item_by_collection.movie_api.get_movie")
    def test_success_movie(self, mocked_movie_get, mocked_get):
        mocked_movie_get.return_value = {"tmdb_id": 564}
        mocked_get.return_value = {"collection_name": "movie", "item_id": 123}
        event = copy.deepcopy(self.event)
        event["pathParameters"]["collection_name"] = "movie"

        ret = handle(event, None)
        assert ret == {
            "body": '{"collection_name": "movie", '
                    '"item_id": 123, "tmdb_id": 564}',
            "statusCode": 200
        }

    @patch("api.item_by_collection.watch_history_db.get_item")
    @patch("api.item_by_collection.anime_api.get_anime")
    def test_anime_http_error(self, mocked_anime_get, mocked_get):
        mocked_anime_get.side_effect = HttpError("test-error", 409)
        mocked_get.return_value = {"collection_name": "anime", "item_id": 123}

        ret = handle(self.event, None)
        assert ret == {
            "body": '{"message": "Could not get anime item with id: 123"}',
            "error": "test-error",
            "statusCode": 409
        }

    @patch("api.item_by_collection.watch_history_db.get_item")
    @patch("api.item_by_collection.anime_api.get_anime")
    def test_not_found(self, mocked_anime_get, mocked_get):
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


class TestPut:
    event = {
        "headers": {
            "authorization": TEST_JWT
        },
        "requestContext": {
            "http": {
                "method": "PUT"
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
        ["anime", "movie"]
    )
    @patch("api.item_by_collection.anime_api.get_anime")
    @patch("api.item_by_collection.movie_api.get_movie")
    @patch("api.item_by_collection.watch_history_db.update_item")
    def test_success(self, a, m, mocked_post, collection_name):
        mocked_post.return_value = True
        event = copy.deepcopy(self.event)
        event["pathParameters"]["collection_name"] = collection_name

        ret = handle(event, None)

        assert ret == {'statusCode': 204}

    @patch("api.item_by_collection.anime_api.get_anime")
    def test_api_error(self, mocked_get_anime):
        mocked_get_anime.side_effect = HttpError("test-error", 503)

        ret = handle(self.event, None)

        assert ret == {
            "body": '{"message": "Could not get anime"}',
            "error": "test-error",
            "statusCode": 503
        }

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
