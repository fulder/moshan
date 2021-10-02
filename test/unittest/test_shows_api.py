from unittest.mock import patch, MagicMock

import pytest

import api_errors


@patch("shows_api.requests.get")
def test_get_show(mocked_get, mocked_show_api):
    m = MagicMock()
    m.status_code = 200
    m.json.return_value = {"show_id": "123"}
    mocked_get.return_value = m

    ret = mocked_show_api.get_show("123")

    assert ret == {"show_id": "123"}


@patch("shows_api.requests.get")
def test_get_show_invalid_code(mocked_get, mocked_show_api):
    m = MagicMock()
    m.status_code = 404
    mocked_get.return_value = m

    with pytest.raises(api_errors.HttpError):
        mocked_show_api.get_show("123")


@patch("shows_api.requests.get")
def test_get_show_by_api_id(mocked_get, mocked_show_api):
    m = MagicMock()
    m.status_code = 200
    m.json.return_value = {"show_id": "123"}
    mocked_get.return_value = m

    ret = mocked_show_api.get_show_by_api_id("tvdb", "123")

    assert ret == {"show_id": "123"}


@patch("shows_api.requests.get")
def test_get_show_by_api_id_invalid_code(mocked_get, mocked_show_api):
    m = MagicMock()
    m.status_code = 404
    mocked_get.return_value = m

    with pytest.raises(api_errors.HttpError):
        mocked_show_api.get_show_by_api_id("tvdb", "123")


@patch("shows_api.requests.post")
def test_post_show(mocked_post, mocked_show_api):
    m = MagicMock()
    m.status_code = 200
    m.json.return_value = {"show_id": "123"}
    mocked_post.return_value = m

    ret = mocked_show_api.post_show({"api_id": "123", "api_name": "tvmaze"})

    assert ret == {"show_id": "123"}


@patch("shows_api.requests.post")
def test_post_show_invalid_code(mocked_post, mocked_show_api):
    m = MagicMock()
    m.status_code = 404
    mocked_post.return_value = m

    with pytest.raises(api_errors.HttpError):
        mocked_show_api.post_show({"api_id": "123", "api_name": "tvmaze"})


@patch("shows_api.requests.get")
def test_get_episode(mocked_get, mocked_show_api):
    m = MagicMock()
    m.status_code = 200
    m.json.return_value = {"show_id": "123"}
    mocked_get.return_value = m

    ret = mocked_show_api.get_episode("123", "ep_id")

    assert ret == {"show_id": "123"}


@patch("shows_api.requests.get")
def test_get_episode_invalid_code(mocked_get, mocked_show_api):
    m = MagicMock()
    m.status_code = 404
    mocked_get.return_value = m

    with pytest.raises(api_errors.HttpError):
        mocked_show_api.get_episode("item_id", "ep_id")


@patch("shows_api.requests.get")
def test_get_episode_by_api_id(mocked_get, mocked_show_api):
    m = MagicMock()
    m.status_code = 200
    m.json.return_value = {"show_id": "123"}
    mocked_get.return_value = m

    ret = mocked_show_api.get_episode_by_api_id("tvdb", "123")

    assert ret == {"show_id": "123"}


@patch("shows_api.requests.get")
def test_get_episode_by_api_id_invalid_code(mocked_get, mocked_show_api):
    m = MagicMock()
    m.status_code = 404
    mocked_get.return_value = m

    with pytest.raises(api_errors.HttpError):
        mocked_show_api.get_episode_by_api_id("tvdb", "123")


@patch("shows_api.requests.post")
def test_post_episode(mocked_post, mocked_show_api):
    m = MagicMock()
    m.status_code = 200
    m.json.return_value = {"show_id": "123"}
    mocked_post.return_value = m

    ret = mocked_show_api.post_episode(
        "123",
        {"api_id": "123", "api_name": "tvmaze"},
    )

    assert ret == {"show_id": "123"}


@patch("shows_api.requests.post")
def test_post_episode_invalid_code(mocked_post, mocked_show_api):
    m = MagicMock()
    m.status_code = 404
    mocked_post.return_value = m

    with pytest.raises(api_errors.HttpError):
        mocked_show_api.post_episode(
            "123",
            {"api_id": "123", "api_name": "tvmaze"},
        )
