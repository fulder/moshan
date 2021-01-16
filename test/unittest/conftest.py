import os
from unittest.mock import MagicMock

import pytest

os.environ["LOG_LEVEL"] = "DEBUG"


@pytest.fixture(scope='function')
def mocked_watch_history_db():
    import watch_history_db

    watch_history_db.table = MagicMock()
    watch_history_db.client = MagicMock()

    return watch_history_db


@pytest.fixture(scope='function')
def mocked_anime_api():
    import anime_api

    anime_api.ANIME_API_URL = "https://mocked"

    return anime_api


@pytest.fixture(scope='function')
def mocked_episodes_db():
    import episodes_db

    episodes_db.table = MagicMock()
    episodes_db.client = MagicMock()

    return episodes_db


@pytest.fixture(scope='function')
def mocked_show_api():
    import shows_api

    shows_api.SHOW_API_URL = "https://mocked"

    return shows_api


@pytest.fixture(scope='function')
def mocked_movie_api():
    import movie_api

    movie_api.MOVIE_API_URL = "https://mocked"

    return movie_api
