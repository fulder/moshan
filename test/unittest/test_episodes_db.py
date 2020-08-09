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


def test_get_episodes(mocked_episodes_db):
    global MOCK_RETURN
    MOCK_RETURN = [
        {"Items": [{"collection_name": "ANIME", "item_id": 123, "episode_id": 345}]},
        {"Items": [{"collection_name": "MOVIE", "item_id": 123, "episode_id": 345}]}
    ]
    m = MagicMock()
    mocked_episodes_db.client.get_paginator.return_value = m
    m.paginate = mock_func

    mocked_episodes_db.get_episodes(TEST_USERNAME, 123, "anime")

    assert UPDATE_VALUES == {
        'ExpressionAttributeValues': {
            ':collection_name': {'S': "anime"},
            ':item_id': {'S': 123},
            ':username': {'S': 'TEST_USERNAME'}
        },
        'FilterExpression': 'attribute_not_exists(deleted_at) '
                            'and collection_name = :collection_name',
        'KeyConditionExpression': 'username = :username and item_id = :item_id',
        'Limit': 100,
        'ScanIndexForward': False,
        'TableName': None
    }


def test_get_episodes_changed_limit(mocked_episodes_db):
    global MOCK_RETURN
    MOCK_RETURN = [
        {"Items": [{"collection_name": "ANIME", "item_id": 123, "episode_id": 345}]},
        {"Items": [{"collection_name": "MOVIE", "item_id": 123, "episode_id": 345}]}
    ]
    m = MagicMock()
    mocked_episodes_db.client.get_paginator.return_value = m
    m.paginate = mock_func

    mocked_episodes_db.get_episodes(TEST_USERNAME, 123, "anime", limit=10)

    assert UPDATE_VALUES == {
        'ExpressionAttributeValues': {
            ':collection_name': {'S': 'anime'},
            ':item_id': {'S': 123},
            ':username': {'S': 'TEST_USERNAME'}
        },
        'FilterExpression': 'attribute_not_exists(deleted_at) '
                            'and collection_name = :collection_name',
        'KeyConditionExpression': 'username = :username and item_id = :item_id',
        'Limit': 10,
        'ScanIndexForward': False,
        'TableName': None
    }


def test_get_episodes_by_with_start(mocked_episodes_db):
    global MOCK_RETURN
    MOCK_RETURN = [
        {"Items": [{"collection_name": "ANIME", "item_id": 123, "episode_id": 345}]},
        {"Items": [{"collection_name": "ANIME", "item_id": 123, "episode_id": 567}]}
    ]
    m = MagicMock()
    mocked_episodes_db.client.get_paginator.return_value = m
    m.paginate = mock_func

    ret = mocked_episodes_db.get_episodes(TEST_USERNAME, 123, "ANIME", limit=1, start=2)

    assert UPDATE_VALUES == {
        'ExpressionAttributeValues': {
            ':collection_name': {'S': 'ANIME'},
            ':item_id': {'S': 123},
            ':username': {'S': 'TEST_USERNAME'}
        },
        'FilterExpression': 'attribute_not_exists(deleted_at) '
                            'and collection_name = :collection_name',
        'KeyConditionExpression': 'username = :username and item_id = :item_id',
        'Limit': 1,
        'ScanIndexForward': False,
        'TableName': None
    }
    assert ret == {
        'episodes': {567: {"item_id": 123, 'collection_name': 'ANIME'}},
        "total_pages": 2
    }


def test_get_episodes_too_small_start_index(mocked_episodes_db):
    with pytest.raises(mocked_episodes_db.InvalidStartOffset):
        mocked_episodes_db.get_episodes(TEST_USERNAME, 123, "anime", start=0)


def test_get_episodes_too_large_start_index(mocked_episodes_db):
    global MOCK_RETURN
    MOCK_RETURN = [
        {"Items": [{"collection_name": "ANIME", "item_id": 123, "episode_id": 345}]},
        {"Items": [{"collection_name": "MOVIE", "item_id": 123, "episode_id": 567}]}
    ]
    m = MagicMock()
    mocked_episodes_db.client.get_paginator.return_value = m
    m.paginate = mock_func
    with pytest.raises(mocked_episodes_db.InvalidStartOffset):
        mocked_episodes_db.get_episodes(TEST_USERNAME, 123, "ANIME", start=10)


def test_get_episodes_not_found(mocked_episodes_db):
    m = MagicMock()
    mocked_episodes_db.client.get_paginator.return_value = m
    m.paginate.return_value = [{"Items": []}]

    with pytest.raises(mocked_episodes_db.NotFoundError):
        mocked_episodes_db.get_episodes(TEST_USERNAME, 123, "ANIME")


def test_add_episode(mocked_episodes_db):
    global UPDATE_VALUES
    UPDATE_VALUES = {}
    mocked_episodes_db.table.update_item = mock_func
    mocked_episodes_db.table.query.side_effect = mocked_episodes_db.NotFoundError

    mocked_episodes_db.add_episode(TEST_USERNAME, "MOVIE", "123", 123123)

    assert UPDATE_VALUES == {
        'ExpressionAttributeNames': {
            '#collection_name': 'collection_name',
            '#created_at': 'created_at',
            '#episode_id': 'episode_id',
            '#updated_at': 'updated_at'
        },
        'ExpressionAttributeValues': {
            ':collection_name': 'MOVIE',
            ':episode_id': 123123,
            ":created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            ":updated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        },
        'Key': {'item_id': '123', 'username': 'TEST_USERNAME'},
        'UpdateExpression': 'SET '
                            '#created_at=:created_at,#episode_id=:episode_id,#collection_name=:collection_name,#updated_at=:updated_at '
                            'REMOVE deleted_at'
    }


def test_add_episode_already_exists(mocked_episodes_db):
    global UPDATE_VALUES
    UPDATE_VALUES = {}
    mocked_episodes_db.table.update_item = mock_func
    mocked_episodes_db.table.query.return_value = {
        "Items": [{"exists"}]
    }

    mocked_episodes_db.add_episode(TEST_USERNAME, "MOVIE", "123", 123123)

    assert UPDATE_VALUES == {
        'ExpressionAttributeNames': {
            '#collection_name': 'collection_name',
            '#updated_at': 'updated_at',
            '#episode_id': 'episode_id',
        },
        'ExpressionAttributeValues': {
            ':collection_name': 'MOVIE',
            ':episode_id': 123123,
            ':updated_at': datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        },
        'Key': {
            'username': 'TEST_USERNAME',
            'item_id': '123'
        },
        'UpdateExpression': 'SET #episode_id=:episode_id,#collection_name=:collection_name,#updated_at=:updated_at REMOVE deleted_at'
    }


def test_update_episode(mocked_episodes_db):
    global UPDATE_VALUES
    UPDATE_VALUES = {}
    mocked_episodes_db.table.update_item = mock_func

    mocked_episodes_db.add_episode(TEST_USERNAME, "MOVIE", "123", 123123)

    assert UPDATE_VALUES == {
        'ExpressionAttributeNames': {
            '#collection_name': 'collection_name',
            '#updated_at': 'updated_at',
            '#episode_id': 'episode_id',
        },
        'ExpressionAttributeValues': {
            ':collection_name': 'MOVIE',
            ':episode_id': 123123,
            ":updated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        },
        'Key': {
            'username': TEST_USERNAME,
            'item_id': '123'},
        'UpdateExpression': 'SET #episode_id=:episode_id,#collection_name=:collection_name,#updated_at=:updated_at REMOVE deleted_at'
    }


def test_delete_episode(mocked_episodes_db):
    global UPDATE_VALUES
    UPDATE_VALUES = {}
    mocked_episodes_db.table.update_item = mock_func

    mocked_episodes_db.delete_episode(TEST_USERNAME, "MOVIE", "123123", 456)

    assert UPDATE_VALUES == {
        'ExpressionAttributeNames': {
            '#collection_name': 'collection_name',
            '#deleted_at': 'deleted_at',
            '#updated_at': 'updated_at',
            '#episode_id': 'episode_id',
        },
        'ExpressionAttributeValues': {
            ':collection_name': 'MOVIE',
            ':episode_id': 456,
            ':deleted_at': int(time.time()),
            ':updated_at': datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        },
        'Key': {
            'username': TEST_USERNAME,
            'item_id': '123123'
        },
        'UpdateExpression': 'SET #deleted_at=:deleted_at,#episode_id=:episode_id,#collection_name=:collection_name,#updated_at=:updated_at'
    }


def test_get_episode(mocked_episodes_db):
    global MOCK_RETURN
    MOCK_RETURN = {"Items": [{"collection_name": "ANIME", "item_id": 123, "episode_id": 456}]}

    mocked_episodes_db.table.query = mock_func

    ret = mocked_episodes_db.get_episode(TEST_USERNAME, "MOVIE", "123123", 456)

    assert ret == {'collection_name': 'ANIME', 'item_id': 123, "episode_id": 456}


def test_get_episode_not_found(mocked_episodes_db):
    mocked_episodes_db.table.query.return_value = {"Items": []}

    with pytest.raises(mocked_episodes_db.NotFoundError):
        mocked_episodes_db.get_episode(TEST_USERNAME, "MOVIE", "123123", 456)
