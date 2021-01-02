from unittest.mock import patch, MagicMock

import pytest

import api_errors


@patch("anime_api.requests.get")
def test_get_anime(mocked_get, mocked_anime_api):
    m = MagicMock()
    m.status_code = 200
    m.json.return_value = {"anime_id": "123"}
    mocked_get.return_value = m

    ret = mocked_anime_api.get_anime("123", "TEST_TOKEN")

    assert ret == {"anime_id": "123"}


@patch("anime_api.requests.get")
def test_post_anime_invalid_code(mocked_get, mocked_anime_api):
    m = MagicMock()
    m.status_code = 404
    mocked_get.return_value = m

    with pytest.raises(api_errors.HttpError):
        mocked_anime_api.get_anime("123", "TEST_TOKEN")
