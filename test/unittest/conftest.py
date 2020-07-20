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
def mocked_watch_history_handler():
    import api.watch_history

    api.watch_history.watch_history_db = MagicMock()

    return api.watch_history
