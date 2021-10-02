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

    @patch("api.watch_history_by_collection.watch_history_db.get_item")
    @patch("api.watch_history_by_collection.anime_api.get_anime_by_api_id")
    def test_success_by_api_id_anime(self, mocked_get_anime,
                                     mocked_get_watch_history):
        w_ret = {
            "collection_name": "anime",
            "item_id": 123,
            "username": "user",
        }
        s_ret = {
            "id": 123
        }
        mocked_get_anime.return_value = s_ret
        mocked_get_watch_history.return_value = w_ret
        event = copy.deepcopy(self.event)
        event["queryStringParameters"] = {
            "api_id": 123,
            "api_name": "mal"
        }

        ret = handle(event, None)
        exp_ret = {**w_ret, **s_ret}
        assert ret == {
            "body": json.dumps(exp_ret),
            "statusCode": 200
        }

    @patch("api.watch_history_by_collection.watch_history_db.get_item")
    @patch("api.watch_history_by_collection.shows_api.get_show_by_api_id")
    def test_success_by_api_id_shows(self, mocked_get_show,
                                     mocked_get_watch_history):
        w_ret = {
            "collection_name": "anime",
            "item_id": 123,
            "username": "user",
        }
        s_ret = {
            "id": 123
        }
        mocked_get_show.return_value = s_ret
        mocked_get_watch_history.return_value = w_ret
        event = copy.deepcopy(self.event)
        event["pathParameters"]["collection_name"] = "show"
        event["queryStringParameters"] = {
            "api_id": 123,
            "api_name": "tvdb"
        }

        ret = handle(event, None)
        exp_data = {**w_ret, **s_ret}
        assert ret == {
            "body": json.dumps(exp_data),
            "statusCode": 200
        }

    @patch("api.watch_history_by_collection.watch_history_db.get_item")
    @patch("api.watch_history_by_collection.movie_api.get_movie_by_api_id")
    def test_success_by_api_id_movie(self, mocked_get_movie,
                                     mocked_get_watch_history):
        w_ret = {
            "collection_name": "anime",
            "item_id": 123,
            "username": "user",
        }
        s_ret = {
            "id": 123
        }
        mocked_get_movie.return_value = s_ret
        mocked_get_watch_history.return_value = w_ret
        event = copy.deepcopy(self.event)
        event["pathParameters"]["collection_name"] = "movie"
        event["queryStringParameters"] = {
            "api_id": 123,
            "api_name": "mal"
        }

        ret = handle(event, None)
        exp_data = {**w_ret, **s_ret}
        assert ret == {
            "body": json.dumps(exp_data),
            "statusCode": 200
        }

    @patch("api.watch_history_by_collection.anime_api.get_anime_by_api_id")
    def test_get_by_api_id_http_error(self, mocked_get_anime):
        mocked_get_anime.side_effect = HttpError("test-error", 503)
        event = copy.deepcopy(self.event)
        event["queryStringParameters"] = {
            "api_id": 123,
            "api_name": "mal"
        }

        ret = handle(event, None)

        assert ret == {
            "body": '{"message": "Could not get anime"}',
            "error": "test-error",
            "statusCode": 503
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

    @patch("api.watch_history_by_collection.watch_history_db.get_item")
    @patch("api.watch_history_by_collection.anime_api.get_anime_by_api_id")
    def test_by_api_id_not_found(self, mocked_get_anime,
                                 mocked_get_watch_history):
        mocked_get_anime.return_value = {
            "id": 123
        }
        mocked_get_watch_history.side_effect = NotFoundError

        event = copy.deepcopy(self.event)
        event["queryStringParameters"] = {
            "api_id": 123,
            "api_name": "mal"
        }

        ret = handle(event, None)

        assert ret == {
            "statusCode": 404
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

    @patch("api.watch_history_by_collection.watch_history_db.add_item")
    @patch("api.watch_history_by_collection.anime_api.post_anime")
    def test_success(self, mocked_post_anime, mocked_post):
        mocked_post_anime.return_value = {
            "id": "123"
        }
        mocked_post.return_value = True

        ret = handle(self.event, None)
        assert ret == {
            "statusCode": 200,
            "body": '{"id": "123"}',
        }

    @patch("api.watch_history_by_collection.watch_history_db.update_item")
    def test_missing_body(self, mocked_post):
        mocked_post.return_value = True
        event = copy.deepcopy(self.event)
        del event["body"]

        ret = handle(event, None)

        assert ret == {"body": "Invalid post body", "statusCode": 400}

    @patch("api.watch_history_by_collection.watch_history_db.update_item")
    def test_empty_body(self, mocked_post):
        mocked_post.return_value = True
        event = copy.deepcopy(self.event)
        event["body"] = {}

        ret = handle(event, None)
        assert ret == {
            "body": "Invalid post body",
            "statusCode": 400
        }

    @patch("api.watch_history_by_collection.watch_history_db.add_item")
    @patch("api.watch_history_by_collection.shows_api.post_show")
    def test_show_success(self, mocked_post_show, mocked_post):
        mocked_post_show.return_value = {
            "id": "123"
        }
        mocked_post.return_value = True
        event = copy.deepcopy(self.event)
        event["pathParameters"]["collection_name"] = "show"
        event["body"] = '{ "api_id": "123", "api_name": "tvmaze" }'

        ret = handle(event, None)
        assert ret == {
            "body": '{"id": "123"}',
            "statusCode": 200
        }

    @patch("api.watch_history_by_collection.watch_history_db.add_item")
    @patch("api.watch_history_by_collection.movie_api.post_movie")
    def test_movie_success(self, mocked_post_movie, mocked_post):
        mocked_post_movie.return_value = {
            "id": "123"
        }
        mocked_post.return_value = True
        event = copy.deepcopy(self.event)
        event["pathParameters"]["collection_name"] = "movie"
        event["body"] = '{ "api_id": "123", "api_name": "tmdb" }'

        ret = handle(event, None)
        assert ret == {
            "statusCode": 200,
            "body": '{"id": "123"}',
        }

    @patch("api.watch_history_by_collection.watch_history_db.update_item")
    @patch("api.watch_history_by_collection.anime_api.post_anime")
    def test_anime_http_error(self, mocked_get_anime, mocked_post):
        mocked_get_anime.side_effect = HttpError("test_error", 403)
        mocked_post.return_value = True

        ret = handle(self.event, None)
        assert ret == {
            "body": '{"message": "Could not post anime"}',
            "error": "test_error",
            "statusCode": 403
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

    @patch("api.watch_history_by_collection.watch_history_db.update_item")
    def test_invalid_body(self, mocked_post):
        mocked_post.return_value = True
        event = copy.deepcopy(self.event)
        event["body"] = "INVALID"

        ret = handle(event, None)
        assert ret == {"body": "Invalid post body", "statusCode": 400}

    @patch("api.watch_history_by_collection.watch_history_db.update_item")
    def test_invalid_body_schema(self, mocked_post):
        mocked_post.return_value = True
        event = copy.deepcopy(self.event)
        event["body"] = '{"invalid": "val"}'

        ret = handle(event, None)
        body = {"message": "Invalid post schema",
                "error": "Additional properties are not allowed "
                         "('invalid' was unexpected)"
                }
        assert ret == {
            "body": json.dumps(body),
            "statusCode": 400
        }

    @patch("api.watch_history_by_collection.watch_history_db.add_item")
    @patch("api.watch_history_by_collection.shows_api.get_show")
    def test_missing_id(self, mocked_get_show, mocked_post):
        mocked_get_show.return_value = True
        mocked_post.return_value = True
        event = copy.deepcopy(self.event)
        event["body"] = '{"api_name": "mal"}'

        ret = handle(event, None)
        body = {
            "message": "Invalid post schema",
            "error": "'api_id' is a required property"
        }
        assert ret == {
            "body": json.dumps(body),
            "statusCode": 400
        }
