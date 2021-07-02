import copy
import json
from decimal import Decimal
from unittest.mock import patch

import pytest

from api.episode_by_collection_item import handle
from api_errors import HttpError
from episodes_db import NotFoundError

TEST_JWT = "eyJraWQiOiIxMjMxMjMxMjM9IiwiYWxnIjoiSFMyNTYifQ.eyJ1c2VybmFtZSI6IlRFU1RfQ0xJRU5UX0lEIn0.ud_dRdguJwmKv4XO-c4JD-dKGffSvXsxuAxZq9uWV-g"


class TestGetEpisodes:
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

    @patch("api.episode_by_collection_item.episodes_db.get_episodes")
    def test_success(self, mocked_get_episodes):
        mocked_get_episodes.return_value = {
            "items": {
                "123": {"collection_name": "anime", "item_id": Decimal(123),
                        "episode_id": Decimal(345)}}
        }

        ret = handle(self.event, None)
        assert ret == {
            'body': '{"items": {"123": {"collection_name": "anime", "item_id": 123, "episode_id": 345}}}',
            "statusCode": 200
        }

    @patch("api.episode_by_collection_item.episodes_db.get_episodes")
    def test_limit_and_start(self, mocked_get_episodes):
        mocked_get_episodes.return_value = [
            {"collection_name": "test_collection", "item_id": Decimal(123),
             "episode_id": Decimal(345)}]

        event = copy.deepcopy(self.event)
        event["queryStringParameters"] = {
            "limit": "200",
            "start": "23"
        }

        ret = handle(event, None)

        assert ret == {
            'body': '[{"collection_name": "test_collection", "item_id": 123, "episode_id": 345}]',
            'statusCode': 200}

    def test_invalid_limit_type(self):
        event = copy.deepcopy(self.event)
        event["queryStringParameters"] = {
            "limit": "ABC",
        }

        ret = handle(event, None)

        assert ret == {'body': '{"message": "Invalid limit type"}',
                       'statusCode': 400}

    def test_invalid_start_type(self):
        event = copy.deepcopy(self.event)
        event["queryStringParameters"] = {
            "start": "ABC",
        }

        ret = handle(event, None)

        assert ret == {'body': '{"message": "Invalid start type"}',
                       'statusCode': 400}

    @patch("api.episode_by_collection_item.episodes_db.get_episodes")
    def test_not_found(self, mocked_get_episodes):
        mocked_get_episodes.side_effect = NotFoundError

        ret = handle(self.event, None)

        assert ret == {"statusCode": 200, "body": json.dumps({"episodes": []})}

    @patch("api.episode_by_collection_item.episodes_db.get_episode")
    @patch("api.episode_by_collection_item.anime_api.get_episode_by_api_id")
    def test_anime_by_api_id_success(self, mocked_get_anime,
                                     mocked_get_episode):
        s_data = {
            "id": "123",
            "mal_id": "456"
        }
        w_data = {
            "collection_name": "anime",
            "item_id": 123,
            "episode_id": 345,
        }
        mocked_get_anime.return_value = s_data
        mocked_get_episode.return_value = w_data
        event = copy.deepcopy(self.event)
        event["queryStringParameters"] = {
            "api_id": "123",
            "api_name": "mal",
        }

        ret = handle(event, None)
        exp_data = {**w_data, **s_data}
        assert ret == {
            "body": json.dumps(exp_data),
            "statusCode": 200
        }

    @patch("api.episode_by_collection_item.episodes_db.get_episode")
    @patch("api.episode_by_collection_item.shows_api.get_episode_by_api_id")
    def test_show_by_api_id_success(self, mocked_get_shows,
                                    mocked_get_episode):
        w_ret = {
            "collection_name": "show",
            "item_id": 123,
            "episode_id": 345,
        }
        s_ret = {
            "id": 123
        }
        mocked_get_shows.return_value = s_ret
        mocked_get_episode.return_value = w_ret
        event = copy.deepcopy(self.event)
        event["queryStringParameters"] = {
            "api_id": "123",
            "api_name": "tvdb",
        }
        event["pathParameters"]["collection_name"] = "show"

        ret = handle(event, None)
        exp_data = {**w_ret, **s_ret}
        assert ret == {
            "body": json.dumps(exp_data),
            "statusCode": 200
        }

    @patch("api.episode_by_collection_item.shows_api.get_episode_by_api_id")
    def test_show_by_api_id_http_error(self, mocked_get_shows):
        mocked_get_shows.side_effect = HttpError("test-error", 409)
        event = copy.deepcopy(self.event)
        event["queryStringParameters"] = {
            "api_id": "123",
            "api_name": "tvdb",
        }
        event["pathParameters"]["collection_name"] = "show"

        ret = handle(event, None)
        assert ret == {
            "body": '{"message": "Could not get show episode"}',
            "error": "test-error",
            "statusCode": 409
        }

    @patch("api.episode_by_collection_item.episodes_db.get_episode")
    @patch("api.episode_by_collection_item.anime_api.get_episode_by_api_id")
    def test_anime_by_api_id_not_found(self, mocked_get_anime,
                                       mocked_get_episode):
        mocked_get_anime.return_value = {
            "id": "123"
        }
        mocked_get_episode.side_effect = NotFoundError
        event = copy.deepcopy(self.event)
        event["queryStringParameters"] = {
            "api_id": "123",
            "api_name": "mal",
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
            "item_id": "123"
        },
        "body": '{ "api_id": "456", "api_name": "mal" }'
    }

    @patch("api.episode_by_collection_item.episodes_db.add_episode")
    @patch("api.episode_by_collection_item.anime_api.post_episode")
    def test_success_anime(self, mocked_post_episode, mocked_post):
        mocked_post.return_value = True
        mocked_post_episode.return_value = {
            "id": "123"
        }

        ret = handle(self.event, None)
        assert ret == {
            "body": '{"id": "123"}',
            "statusCode": 200
        }

    @patch("api.episode_by_collection_item.episodes_db.add_episode")
    @patch("api.episode_by_collection_item.shows_api.post_episode")
    def test_success_show(self, mocked_post_episode, mocked_post):
        mocked_post.return_value = True
        mocked_post_episode.return_value = {
            "id": "123"
        }
        event = copy.deepcopy(self.event)
        event["pathParameters"]["collection_name"] = "show"

        ret = handle(event, None)
        assert ret == {
            "body": '{"id": "123"}',
            "statusCode": 200
        }

    @patch("api.episode_by_collection_item.episodes_db.add_episode")
    @patch("api.episode_by_collection_item.anime_api.post_episode")
    def test_api_error(self, mocked_post_episode, mocked_post):
        mocked_post.return_value = True
        mocked_post_episode.side_effect = HttpError("test not found", 404)
        event = copy.deepcopy(self.event)

        ret = handle(event, None)
        assert ret == {
            "body": '{"message": "Could not post anime"}',
            "error": "test not found",
            "statusCode": 404
        }

    @patch("api.episode_by_collection_item.episodes_db.update_episode")
    def test_without_body(self, mocked_post):
        mocked_post.return_value = True
        event = copy.deepcopy(self.event)
        del event["body"]

        ret = handle(event, None)
        assert ret == {'body': 'Invalid post body', 'statusCode': 400}

    @patch("api.episode_by_collection_item.episodes_db.update_episode")
    def test_with_empty_body(self, mocked_post):
        mocked_post.return_value = True
        event = copy.deepcopy(self.event)
        event["body"] = ""

        ret = handle(event, None)
        assert ret == {'body': 'Invalid post body', 'statusCode': 400}

    @patch("api.episode_by_collection_item.episodes_db.update_episode")
    def test_invalid_body(self, mocked_post):
        mocked_post.return_value = True
        event = copy.deepcopy(self.event)
        event["body"] = "INVALID"

        ret = handle(event, None)
        assert ret == {'body': 'Invalid post body', 'statusCode': 400}

    @patch("api.episode_by_collection_item.episodes_db.update_episode")
    def test_invalid_body_schema(self, mocked_post):
        mocked_post.return_value = True
        event = copy.deepcopy(self.event)
        event["body"] = '{"invalid": "val"}'

        ret = handle(event, None)
        assert ret == {
            'body': '{"message": "Invalid post schema", "error": "Additional properties are not allowed (\'invalid\' was unexpected)"}',
            'statusCode': 400
        }

    @patch("api.episode_by_collection_item.episodes_db.update_episode")
    def test_invalid_collection(self, mocked_post):
        mocked_post.return_value = True
        event = copy.deepcopy(self.event)
        event["pathParameters"]["collection_name"] = "INVALID"

        ret = handle(event, None)
        assert ret == {
            'body': '{"message": "Invalid collection name, allowed values: [\'anime\', \'show\', \'movie\']"}',
            'statusCode': 400
        }
