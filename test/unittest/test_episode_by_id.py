import copy
from unittest.mock import patch

from api.episode_by_id import handle
from api_errors import HttpError
from episodes_db import NotFoundError

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
            "item_id": "123",
            "episode_id": "345"
        }
    }

    @patch("api.episode_by_id.episodes_db.get_episode")
    @patch("api.episode_by_id.anime_api.get_episode")
    def test_success_anime(self, mocked_anime_ep, mocked_get):
        mocked_anime_ep.return_value = {"mal_id": 345}
        mocked_get.return_value = {"collection_name": "anime", "item_id": 123}

        ret = handle(self.event, None)
        assert ret == {'body': '{"collection_name": "anime", '
                               '"item_id": 123, "mal_id": 345}',
                       'statusCode': 200}

    @patch("api.episode_by_id.episodes_db.get_episode")
    @patch("api.episode_by_id.shows_api.get_episode")
    def test_success_show(self, mocked_shows_ep, mocked_get):
        mocked_shows_ep.return_value = {"tvmaze_id": 345}
        mocked_get.return_value = {"collection_name": "show", "item_id": 123}
        event = copy.deepcopy(self.event)
        event["pathParameters"]["collection_name"] = "show"

        ret = handle(event, None)
        assert ret == {'body': '{"collection_name": "show", '
                               '"item_id": 123, "tvmaze_id": 345}',
                       'statusCode': 200}

    @patch("api.episode_by_id.episodes_db.get_episode")
    @patch("api.episode_by_id.anime_api.get_episode")
    def test_anime_http_error(self, mocked_anime_ep, mocked_get):
        mocked_anime_ep.side_effect = HttpError("test-error", 503)
        mocked_get.return_value = {"collection_name": "anime", "item_id": 123}

        ret = handle(self.event, None)
        assert ret == {
            "body": '{"message": "Could not get anime '
                    'episode for item: 123 and '
                    'episode_id: 345"}',
            "error": "test-error",
            "statusCode": 503
        }

    @patch("api.episode_by_id.episodes_db.get_episode")
    @patch("api.episode_by_id.anime_api.get_episode")
    def test_not_found(self, mocked_anime_ep, mocked_get):
        mocked_get.side_effect = NotFoundError

        ret = handle(self.event, None)
        assert ret == {'statusCode': 404}

    def test_invalid_collection_name(self):
        event = copy.deepcopy(self.event)
        event["pathParameters"]["collection_name"] = "INVALID",

        ret = handle(event, None)
        assert ret == {'statusCode': 400,
                       'body': '{"message": "Invalid collection name, allowed values: [\'anime\', \'show\', \'movie\']"}'}


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
            "item_id": "123",
            "episode_id": "345"
        }
    }

    @patch("api.episode_by_id.episodes_db.delete_episode")
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
            "item_id": "123",
            "episode_id": "345"
        },
        "body": '{"rating": 3, "overview": "My overview", "review": "My review"}'
    }

    @patch("api.episode_by_id.episodes_db.update_episode")
    @patch("api.episode_by_collection_item.anime_api.get_episode")
    def test_success_anime(self, mocked_get_episode, mocked_post):
        mocked_post.return_value = True

        ret = handle(self.event, None)
        assert ret == {'statusCode': 204}

    @patch("api.episode_by_id.episodes_db.update_episode")
    @patch("api.episode_by_collection_item.shows_api.get_episode")
    def test_success_show(self, mocked_get_episode, mocked_post):
        mocked_post.return_value = True
        event = copy.deepcopy(self.event)
        event["pathParameters"]["collection_name"] = "show"

        ret = handle(event, None)
        assert ret == {'statusCode': 204}

    @patch("api.episode_by_id.episodes_db.update_episode")
    @patch("api.episode_by_collection_item.anime_api.get_episode")
    def test_api_error(self, mocked_get_episode, mocked_post):
        mocked_post.return_value = True
        mocked_get_episode.side_effect = HttpError("test api error", 503)

        ret = handle(self.event, None)
        assert ret == {
            "body": '{"message": "Could not get anime episode for item: '
                    '123 and episode_id: 345"}',
            "error": "test api error",
            "statusCode": 503
        }

    @patch("api.episode_by_id.episodes_db.update_episode")
    def test_invalid_body_type(self, mocked_post):
        mocked_post.return_value = True
        event = copy.deepcopy(self.event)
        event["body"] = '{"rating": "ABC"}'

        ret = handle(event, None)
        assert ret == {'statusCode': 400,
                       'body': '{"message": "Invalid post schema", "error": "\'ABC\' is not of type \'integer\'"}'}

    @patch("api.episode_by_id.episodes_db.update_episode")
    def test_block_additional_properties(self, mocked_post):
        mocked_post.return_value = True
        event = copy.deepcopy(self.event)
        event["body"] = '{"rating": 1, "werid_property": "123"}'

        ret = handle(event, None)
        assert ret == {'statusCode': 400,
                       'body': '{"message": "Invalid post schema", "error": "Additional properties are not allowed (\'werid_property\' was unexpected)"}'}

    @patch("api.episode_by_id.episodes_db.update_episode")
    def test_invalid_body_format(self, mocked_post):
        mocked_post.return_value = True
        event = copy.deepcopy(self.event)
        event["body"] = "INVALID"

        ret = handle(event, None)
        assert ret == {'body': 'Invalid patch body', 'statusCode': 400}
