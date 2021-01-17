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
        {"Items": [{"collection_name": "ANIME", "item_id": 123, "id": 345}]},
        {"Items": [{"collection_name": "MOVIE", "item_id": 123, "id": 345}]}
    ]
    m = MagicMock()
    mocked_episodes_db.client.get_paginator.return_value = m
    m.paginate = mock_func

    mocked_episodes_db.get_episodes(TEST_USERNAME, "anime", 123)

    assert UPDATE_VALUES == {
        'ExpressionAttributeValues': {
            ':collection_name': {'S': "anime"},
            ':item_id': {'S': 123},
            ':username': {'S': 'TEST_USERNAME'}
        },
        'FilterExpression': 'attribute_not_exists(deleted_at) and item_id = :item_id '
                            'and collection_name = :collection_name',
        'KeyConditionExpression': 'username = :username',
        'Limit': 100,
        'ScanIndexForward': False,
        'TableName': None
    }


def test_get_episodes_changed_limit(mocked_episodes_db):
    global MOCK_RETURN
    MOCK_RETURN = [
        {"Items": [{"collection_name": "ANIME", "item_id": 123, "id": 345}]},
        {"Items": [{"collection_name": "MOVIE", "item_id": 123, "id": 345}]}
    ]
    m = MagicMock()
    mocked_episodes_db.client.get_paginator.return_value = m
    m.paginate = mock_func

    mocked_episodes_db.get_episodes(TEST_USERNAME, "anime", 123, limit=10)

    assert UPDATE_VALUES == {
        'ExpressionAttributeValues': {
            ':collection_name': {'S': 'anime'},
            ':item_id': {'S': 123},
            ':username': {'S': 'TEST_USERNAME'}
        },
        'FilterExpression': 'attribute_not_exists(deleted_at) and item_id = :item_id '
                            'and collection_name = :collection_name',
        'KeyConditionExpression': 'username = :username',
        'Limit': 10,
        'ScanIndexForward': False,
        'TableName': None
    }


def test_get_episodes_by_with_start(mocked_episodes_db):
    global MOCK_RETURN
    MOCK_RETURN = [
        {"Items": [{"collection_name": "ANIME", "item_id": 123, "id": 345}]},
        {"Items": [{"collection_name": "ANIME", "item_id": 123, "id": 567}]}
    ]
    m = MagicMock()
    mocked_episodes_db.client.get_paginator.return_value = m
    m.paginate = mock_func

    ret = mocked_episodes_db.get_episodes(TEST_USERNAME, "ANIME", 123, limit=1, start=2)

    assert UPDATE_VALUES == {
        'ExpressionAttributeValues': {
            ':collection_name': {'S': 'ANIME'},
            ':item_id': {'S': 123},
            ':username': {'S': 'TEST_USERNAME'}
        },
        'FilterExpression': 'attribute_not_exists(deleted_at) and item_id = :item_id '
                            'and collection_name = :collection_name',
        'KeyConditionExpression': 'username = :username',
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
        {"Items": [{"collection_name": "ANIME", "item_id": 123, "id": 345}]},
        {"Items": [{"collection_name": "MOVIE", "item_id": 123, "id": 567}]}
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

    mocked_episodes_db.add_episode(TEST_USERNAME, "MOVIE", "123", "123123")

    assert UPDATE_VALUES == {
        'ExpressionAttributeNames': {
            '#collection_name': 'collection_name',
            '#created_at': 'created_at',
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
                            'REMOVE deleted_at'
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
            '#updated_at': 'updated_at',
            '#item_id': 'item_id',
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
        'UpdateExpression': 'SET #item_id=:item_id,#collection_name=:collection_name,#updated_at=:updated_at REMOVE deleted_at'
    }


def test_update_episode(mocked_episodes_db):
    global UPDATE_VALUES
    UPDATE_VALUES = {}
    mocked_episodes_db.table.update_item = mock_func

    mocked_episodes_db.update_episode(TEST_USERNAME, "MOVIE", "123", {"overview": "overview_text"})

    assert UPDATE_VALUES == {
        'ExpressionAttributeNames': {
            '#collection_name': 'collection_name',
            '#updated_at': 'updated_at',
            '#overview': 'overview',
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
                            '#updated_at=:updated_at REMOVE deleted_at'
    }


def test_update_episode_dates_watched(mocked_episodes_db):
    global UPDATE_VALUES
    UPDATE_VALUES = {}
    mocked_episodes_db.table.update_item = mock_func

    mocked_episodes_db.update_episode(TEST_USERNAME, "MOVIE", "123",
                                      {"dates_watched": ["2020-12-20T15:30:09.909Z", "2021-12-20T15:30:09.909Z"]})

    assert UPDATE_VALUES == {
        'ExpressionAttributeNames': {
            '#collection_name': 'collection_name',
            '#updated_at': 'updated_at',
            '#dates_watched': 'dates_watched',
            '#latest_watch_date': 'latest_watch_date',
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
                            '#updated_at=:updated_at,#latest_watch_date=:latest_watch_date REMOVE deleted_at'
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
    MOCK_RETURN = {"Items": [{"collection_name": "ANIME", "item_id": 123, "id": 456}]}

    mocked_episodes_db.table.query = mock_func

    ret = mocked_episodes_db.get_episode(TEST_USERNAME, "MOVIE", 456)

    assert ret == {'collection_name': 'ANIME', 'item_id': 123, "id": 456}


def test_get_episode_not_found(mocked_episodes_db):
    mocked_episodes_db.table.query.return_value = {"Items": []}

    with pytest.raises(mocked_episodes_db.NotFoundError):
        mocked_episodes_db.get_episode(TEST_USERNAME, "MOVIE", 456)
