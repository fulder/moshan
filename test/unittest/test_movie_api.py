from unittest.mock import patch, MagicMock

import pytest

import api_errors


@patch("movie_api.requests.get")
def test_get_movie(mocked_get, mocked_movie_api):
    m = MagicMock()
    m.status_code = 200
    m.json.return_value = {"movie_id": "123"}
    mocked_get.return_value = m

    ret = mocked_movie_api.get_movie("123", "TEST_TOKEN")

    assert ret == {"movie_id": "123"}


@patch("movie_api.requests.get")
def test_post_anime_invalid_code(mocked_get, mocked_movie_api):
    m = MagicMock()
    m.status_code = 404
    mocked_get.return_value = m

    with pytest.raises(api_errors.HttpError):
        mocked_movie_api.get_movie("123", "TEST_TOKEN")

