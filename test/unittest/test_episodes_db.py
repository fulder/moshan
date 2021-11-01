import time
from datetime import datetime
from unittest.mock import MagicMock

import pytest

UPDATE_VALUES = {}
MOCK_RETURN = []
TEST_USERNAME = "TEST_USERNAME"


def mock_func(**kwargs):
    global UPDATE_VALUES
    UPDATE_VALUES = kwargs

    return MOCK_RETURN


def test_add_episode(mocked_episodes_db):
    global UPDATE_VALUES
    UPDATE_VALUES = {}
    mocked_episodes_db.table.update_item = mock_func
    mocked_episodes_db.table.query.side_effect = mocked_episodes_db.NotFoundError

    mocked_episodes_db.add_episode(TEST_USERNAME, "MOVIE", "123", "123123")

    assert UPDATE_VALUES == {
        'ExpressionAttributeNames': {
            '#collection_name': 'collection_name',
            '#created_at': 'created_at',
            '#deleted_at': 'deleted_at',
            '#item_id': 'item_id',
            '#updated_at': 'updated_at'
        },
        'ExpressionAttributeValues': {
            ':collection_name': 'MOVIE',
            ':item_id': "123",
            ":created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            ":updated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        },
        'Key': {'id': '123123', 'username': 'TEST_USERNAME'},
        'UpdateExpression': 'SET '
                            '#item_id=:item_id,#created_at=:created_at,#collection_name=:collection_name,#updated_at=:updated_at '
                            'REMOVE #deleted_at'
    }


def test_add_episode_already_exists(mocked_episodes_db):
    global UPDATE_VALUES
    UPDATE_VALUES = {}
    mocked_episodes_db.table.update_item = mock_func
    mocked_episodes_db.table.query.return_value = {
        "Items": [{"exists"}]
    }

    mocked_episodes_db.add_episode(TEST_USERNAME, "MOVIE", "123", "123123")

    assert UPDATE_VALUES == {
        'ExpressionAttributeNames': {
            '#collection_name': 'collection_name',
            '#deleted_at': 'deleted_at',
            '#item_id': 'item_id',
            '#updated_at': 'updated_at',
        },
        'ExpressionAttributeValues': {
            ':collection_name': 'MOVIE',
            ':item_id': "123",
            ':updated_at': datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        },
        'Key': {
            'username': 'TEST_USERNAME',
            'id': '123123'
        },
        'UpdateExpression': 'SET #item_id=:item_id,#collection_name=:collection_name,#updated_at=:updated_at '
                            'REMOVE #deleted_at'
    }


def test_update_episode(mocked_episodes_db):
    global UPDATE_VALUES
    UPDATE_VALUES = {}
    mocked_episodes_db.table.update_item = mock_func

    mocked_episodes_db.update_episode(TEST_USERNAME, "MOVIE", "123",
                                      {"overview": "overview_text"})

    assert UPDATE_VALUES == {
        'ExpressionAttributeNames': {
            '#collection_name': 'collection_name',
            '#dates_watched': 'dates_watched',
            '#deleted_at': 'deleted_at',
            '#overview': 'overview',
            '#rating': 'rating',
            '#review': 'review',
            '#updated_at': 'updated_at',
        },
        'ExpressionAttributeValues': {
            ':collection_name': 'MOVIE',
            ':overview': "overview_text",
            ":updated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        },
        'Key': {
            'username': TEST_USERNAME,
            'id': '123'},
        'UpdateExpression': 'SET #overview=:overview,#collection_name=:collection_name,'
                            '#updated_at=:updated_at '
                            'REMOVE #deleted_at,#review,#rating,#dates_watched'
    }


def test_update_episode_dates_watched(mocked_episodes_db):
    global UPDATE_VALUES
    UPDATE_VALUES = {}
    mocked_episodes_db.table.update_item = mock_func

    mocked_episodes_db.update_episode(TEST_USERNAME, "MOVIE", "123",
                                      {"dates_watched": [
                                          "2020-12-20T15:30:09.909Z",
                                          "2021-12-20T15:30:09.909Z"]})

    assert UPDATE_VALUES == {
        'ExpressionAttributeNames': {
            '#collection_name': 'collection_name',
            '#dates_watched': 'dates_watched',
            '#deleted_at': 'deleted_at',
            '#latest_watch_date': 'latest_watch_date',
            '#overview': 'overview',
            '#rating': 'rating',
            '#review': 'review',
            '#updated_at': 'updated_at'
        },
        'ExpressionAttributeValues': {
            ':collection_name': 'MOVIE',
            ":updated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            ':dates_watched': ['2020-12-20T15:30:09.909Z',
                               '2021-12-20T15:30:09.909Z'],
            ':latest_watch_date': '2021-12-20T15:30:09.909Z',
        },
        'Key': {
            'username': TEST_USERNAME,
            'id': '123'},
        'UpdateExpression': 'SET #dates_watched=:dates_watched,#collection_name=:collection_name,'
                            '#updated_at=:updated_at,#latest_watch_date=:latest_watch_date '
                            'REMOVE #deleted_at,#overview,#review,#rating'
    }


def test_update_episode_dates_watched_one_date(mocked_episodes_db):
    global UPDATE_VALUES
    UPDATE_VALUES = {}
    mocked_episodes_db.table.update_item = mock_func

    mocked_episodes_db.update_episode(TEST_USERNAME, "MOVIE", "123",
                                      {"dates_watched": [
                                          "2020-12-20T15:30:09.909Z"]})

    assert UPDATE_VALUES == {
        'ExpressionAttributeNames': {
            '#collection_name': 'collection_name',
            '#dates_watched': 'dates_watched',
            '#deleted_at': 'deleted_at',
            '#latest_watch_date': 'latest_watch_date',
            '#overview': 'overview',
            '#rating': 'rating',
            '#review': 'review',
            '#updated_at': 'updated_at'
        },
        'ExpressionAttributeValues': {
            ':collection_name': 'MOVIE',
            ":updated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            ':dates_watched': ['2020-12-20T15:30:09.909Z'],
            ':latest_watch_date': '2020-12-20T15:30:09.909Z',
        },
        'Key': {
            'username': TEST_USERNAME,
            'id': '123'},
        'UpdateExpression': 'SET #dates_watched=:dates_watched,#collection_name=:collection_name,'
                            '#updated_at=:updated_at,#latest_watch_date=:latest_watch_date '
                            'REMOVE #deleted_at,#overview,#review,#rating'
    }


def test_delete_episode(mocked_episodes_db):
    global UPDATE_VALUES
    UPDATE_VALUES = {}
    mocked_episodes_db.table.update_item = mock_func

    mocked_episodes_db.delete_episode(TEST_USERNAME, "MOVIE", "456")

    assert UPDATE_VALUES == {
        'ExpressionAttributeNames': {
            '#collection_name': 'collection_name',
            '#deleted_at': 'deleted_at',
            '#updated_at': 'updated_at',
        },
        'ExpressionAttributeValues': {
            ':collection_name': 'MOVIE',
            ':deleted_at': int(time.time()),
            ':updated_at': datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        },
        'Key': {
            'username': TEST_USERNAME,
            'id': '456'
        },
        'UpdateExpression': 'SET #deleted_at=:deleted_at,#collection_name=:collection_name,#updated_at=:updated_at'
    }


def test_get_episode(mocked_episodes_db):
    global MOCK_RETURN
    MOCK_RETURN = {
        "Items": [{"collection_name": "ANIME", "item_id": 123, "id": 456}]}

    mocked_episodes_db.table.query = mock_func

    ret = mocked_episodes_db.get_episode(TEST_USERNAME, "MOVIE", 456)

    assert ret == {'collection_name': 'ANIME', 'item_id': 123, "id": 456}


def test_get_episode_not_found(mocked_episodes_db):
    mocked_episodes_db.table.query.return_value = {"Items": []}

    with pytest.raises(mocked_episodes_db.NotFoundError):
        mocked_episodes_db.get_episode(TEST_USERNAME, "MOVIE", 456)
