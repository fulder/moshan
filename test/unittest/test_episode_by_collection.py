import json
from decimal import Decimal
from unittest.mock import patch

from api.episode_by_collection_item import handle
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

        event = self.event.copy()
        event["queryStringParameters"] = {
            "limit": "200",
            "start": "23"
        }

        ret = handle(event, None)

        assert ret == {
            'body': '[{"collection_name": "test_collection", "item_id": 123, "episode_id": 345}]',
            'statusCode': 200}

    def test_invalid_limit_type(self):
        event = self.event.copy()
        event["queryStringParameters"] = {
            "limit": "ABC",
        }

        ret = handle(event, None)

        assert ret == {'body': '{"message": "Invalid limit type"}',
                       'statusCode': 400}

    def test_invalid_start_type(self):
        event = self.event.copy()
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
    def test_success(self, mocked_post_episode, mocked_post):
        mocked_post.return_value = True
        mocked_post_episode.return_value.json.return_value = {
            "id": "123"
        }

        ret = handle(self.event, None)
        assert ret == {'statusCode': 204}

    @patch("api.episode_by_collection_item.episodes_db.update_episode")
    def test_without_body(self, mocked_post):
        mocked_post.return_value = True
        event = self.event.copy()
        del event["body"]

        ret = handle(event, None)
        assert ret == {'body': 'Invalid post body', 'statusCode': 400}

    @patch("api.episode_by_collection_item.episodes_db.update_episode")
    def test_with_empty_body(self, mocked_post):
        mocked_post.return_value = True
        event = self.event.copy()
        event["body"] = ""

        ret = handle(event, None)
        assert ret == {'body': 'Invalid post body', 'statusCode': 400}

    @patch("api.episode_by_collection_item.episodes_db.update_episode")
    def test_invalid_body(self, mocked_post):
        mocked_post.return_value = True
        event = self.event.copy()
        event["body"] = "INVALID"

        ret = handle(event, None)
        assert ret == {'body': 'Invalid post body', 'statusCode': 400}

    @patch("api.episode_by_collection_item.episodes_db.update_episode")
    def test_invalid_body_schema(self, mocked_post):
        mocked_post.return_value = True
        event = self.event.copy()
        event["body"] = '{"invalid": "val"}'

        ret = handle(event, None)
        assert ret == {
            'body': '{"message": "Invalid post schema", "error": "Additional properties are not allowed (\'invalid\' was unexpected)"}',
            'statusCode': 400
        }

    @patch("api.episode_by_collection_item.episodes_db.update_episode")
    def test_invalid_collection(self, mocked_post):
        mocked_post.return_value = True
        event = self.event.copy()
        event["pathParameters"]["collection_name"] = "INVALID"

        ret = handle(event, None)
        assert ret == {
            'body': '{"message": "Invalid collection name, allowed values: [\'anime\', \'show\', \'movie\']"}',
            'statusCode': 400
        }
