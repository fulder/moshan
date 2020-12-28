from unittest.mock import patch, MagicMock

import pytest

import api_errors


@patch("shows_api.requests.get")
def test_get_show(mocked_get, mocked_show_api):
    m = MagicMock()
    m.status_code = 200
    m.json.return_value = {"show_id": "123"}
    mocked_get.return_value = m

    ret = mocked_show_api.get_show("123", "TEST_TOKEN")

    assert ret == {"show_id": "123"}


@patch("shows_api.requests.get")
def test_post_anime_invalid_code(mocked_get, mocked_show_api):
    m = MagicMock()
    m.status_code = 404
    mocked_get.return_value = m

    with pytest.raises(api_errors.HttpError):
        mocked_show_api.get_show("123", "TEST_TOKEN")

