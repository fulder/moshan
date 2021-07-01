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
def test_get_anime_invalid_code(mocked_get, mocked_anime_api):
    m = MagicMock()
    m.status_code = 404
    mocked_get.return_value = m

    with pytest.raises(api_errors.HttpError):
        mocked_anime_api.get_anime("123", "TEST_TOKEN")


@patch("anime_api.requests.get")
def test_get_anime_by_api_id(mocked_get, mocked_anime_api):
    m = MagicMock()
    m.status_code = 200
    m.json.return_value = {"anime_id": "123"}
    mocked_get.return_value = m

    ret = mocked_anime_api.get_anime_by_api_id("mal", "123", "TEST_TOKEN")

    assert ret == {"anime_id": "123"}


@patch("anime_api.requests.get")
def test_get_anime_by_api_id_invalid_code(mocked_get, mocked_anime_api):
    m = MagicMock()
    m.status_code = 404
    mocked_get.return_value = m

    with pytest.raises(api_errors.HttpError):
        mocked_anime_api.get_anime_by_api_id("mal", "123", "TEST_TOKEN")


@patch("anime_api.requests.post")
def test_post_anime(mocked_post, mocked_anime_api):
    m = MagicMock()
    m.status_code = 200
    m.json.return_value = {"anime_id": "123"}
    mocked_post.return_value = m

    ret = mocked_anime_api.post_anime({}, "TEST_TOKEN")

    assert ret == {"anime_id": "123"}


@patch("anime_api.requests.post")
def test_post_anime_invalid_code(mocked_post, mocked_anime_api):
    m = MagicMock()
    m.status_code = 404
    mocked_post.return_value = m

    with pytest.raises(api_errors.HttpError):
        mocked_anime_api.post_anime({}, "TEST_TOKEN")

@patch("anime_api.requests.get")
def test_get_episode(mocked_get, mocked_anime_api):
    m = MagicMock()
    m.status_code = 200
    m.json.return_value = {"anime_id": "123"}
    mocked_get.return_value = m

    ret = mocked_anime_api.get_episode("123", "ep_id", "TEST_TOKEN")

    assert ret == {"anime_id": "123"}


@patch("anime_api.requests.get")
def test_get_episode_invalid_code(mocked_get, mocked_anime_api):
    m = MagicMock()
    m.status_code = 404
    mocked_get.return_value = m

    with pytest.raises(api_errors.HttpError):
        mocked_anime_api.get_episode("123", "ep_id", "TEST_TOKEN")


@patch("anime_api.requests.get")
def test_get_episode_by_api_id(mocked_get, mocked_anime_api):
    m = MagicMock()
    m.status_code = 200
    m.json.return_value = {"anime_id": "123"}
    mocked_get.return_value = m

    ret = mocked_anime_api.get_episode_by_api_id("123", "mal", "ep_id", "TEST_TOKEN")

    assert ret == {"anime_id": "123"}


@patch("anime_api.requests.get")
def test_get_episode_by_api_id_invalid_code(mocked_get, mocked_anime_api):
    m = MagicMock()
    m.status_code = 404
    mocked_get.return_value = m

    with pytest.raises(api_errors.HttpError):
        mocked_anime_api.get_episode_by_api_id("123", "mal", "ep_id", "TEST_TOKEN")


@patch("anime_api.requests.post")
def test_post_episode(mocked_post, mocked_anime_api):
    m = MagicMock()
    m.status_code = 200
    m.json.return_value = {"anime_id": "123"}
    mocked_post.return_value = m

    ret = mocked_anime_api.post_episode("123", {}, "TEST_TOKEN")

    assert ret == {"anime_id": "123"}


@patch("anime_api.requests.post")
def test_post_episode_invalid_code(mocked_post, mocked_anime_api):
    m = MagicMock()
    m.status_code = 404
    mocked_post.return_value = m

    with pytest.raises(api_errors.HttpError):
        mocked_anime_api.post_episode("123", {}, "TEST_TOKEN")
