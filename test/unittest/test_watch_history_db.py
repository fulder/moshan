import time
from datetime import datetime
from unittest.mock import MagicMock

import pytest

UPDATE_VALUES = {}
MOCK_RETURN = []
TEST_CLIENT_ID = "TEST_CLIENT_ID"


def mock_func(**kwargs):
    global UPDATE_VALUES
    UPDATE_VALUES = kwargs

    return MOCK_RETURN


def test_get_watch_history(mocked_watch_history_db):
    global MOCK_RETURN
    MOCK_RETURN = [
        {"Items": [{"collection_name": "ANIME", "item_id": 123}]},
        {"Items": [{"collection_name": "MOVIE", "item_id": 123}]}
    ]
    m = MagicMock()
    mocked_watch_history_db.client.get_paginator.return_value = m
    m.paginate = mock_func

    mocked_watch_history_db.get_watch_history(TEST_CLIENT_ID)

    assert UPDATE_VALUES == {
        "TableName": None,
        "KeyConditionExpression": "client_id = :client_id",
        "ExpressionAttributeValues": {":client_id": {"S": "TEST_CLIENT_ID"}},
        "Limit": 100,
        "ScanIndexForward": False,
        'FilterExpression': 'attribute_not_exists(deleted_at)',
    }


def test_get_watch_history_changed_limit(mocked_watch_history_db):
    global MOCK_RETURN
    MOCK_RETURN = [
        {"Items": [{"collection_name": "ANIME", "item_id": 123}]},
        {"Items": [{"collection_name": "MOVIE", "item_id": 123}]}
    ]
    m = MagicMock()
    mocked_watch_history_db.client.get_paginator.return_value = m
    m.paginate = mock_func

    mocked_watch_history_db.get_watch_history(TEST_CLIENT_ID, limit=10)

    assert UPDATE_VALUES == {
        "TableName": None,
        "KeyConditionExpression": "client_id = :client_id",
        "ExpressionAttributeValues": {":client_id": {"S": "TEST_CLIENT_ID"}},
        "Limit": 10,
        "ScanIndexForward": False,
        'FilterExpression': 'attribute_not_exists(deleted_at)',
    }


def test_get_watch_history_by_collection_name(mocked_watch_history_db):
    global MOCK_RETURN
    MOCK_RETURN = [
        {"Items": [{"collection_name": "ANIME", "item_id": 123}]}
    ]
    m = MagicMock()
    mocked_watch_history_db.client.get_paginator.return_value = m
    m.paginate = mock_func

    mocked_watch_history_db.get_watch_history(TEST_CLIENT_ID, collection_name="ANIME", limit=10)

    assert UPDATE_VALUES == {
        "ExpressionAttributeValues": {
            ":client_id": {"S": "TEST_CLIENT_ID"},
            ":collection_name": {"S": "ANIME"}
        },
        "FilterExpression": "attribute_not_exists(deleted_at) and collection_name = :collection_name",
        "KeyConditionExpression": "client_id = :client_id",
        "Limit": 10,
        "ScanIndexForward": False,
        "TableName": None,

    }


def test_get_watch_history_by_collection_and_index(mocked_watch_history_db):
    global MOCK_RETURN
    MOCK_RETURN = [
        {"Items": [{"collection_name": "ANIME", "item_id": 123}]}
    ]
    m = MagicMock()
    mocked_watch_history_db.client.get_paginator.return_value = m
    m.paginate = mock_func

    mocked_watch_history_db.get_watch_history(TEST_CLIENT_ID, collection_name="ANIME", index_name="test_index",
                                              limit=10)

    assert UPDATE_VALUES == {
        "ExpressionAttributeValues": {
            ":client_id": {"S": "TEST_CLIENT_ID"},
            ":collection_name": {"S": "ANIME"}
        },
        "FilterExpression": "attribute_not_exists(deleted_at) and collection_name = :collection_name",
        "KeyConditionExpression": "client_id = :client_id",
        "Limit": 10,
        "IndexName": "test_index",
        "ScanIndexForward": False,
        "TableName": None
    }


def test_get_watch_history_by_with_start(mocked_watch_history_db):
    global MOCK_RETURN
    MOCK_RETURN = [
        {"Items": [{"collection_name": "ANIME", "item_id": 123}]},
        {"Items": [{"collection_name": "MOVIE", "item_id": 123}]}
    ]
    m = MagicMock()
    mocked_watch_history_db.client.get_paginator.return_value = m
    m.paginate = mock_func

    ret = mocked_watch_history_db.get_watch_history(TEST_CLIENT_ID, collection_name="ANIME", index_name="test_index",
                                                    limit=1, start=2)

    assert UPDATE_VALUES == {
        "ExpressionAttributeValues": {
            ":client_id": {"S": "TEST_CLIENT_ID"},
            ":collection_name": {"S": "ANIME"}
        },
        "FilterExpression": "attribute_not_exists(deleted_at) and collection_name = :collection_name",
        "KeyConditionExpression": "client_id = :client_id",
        "Limit": 1,
        "IndexName": "test_index",
        "ScanIndexForward": False,
        "TableName": None
    }
    assert ret == {
        "items": [{"collection_name": "MOVIE", "item_id": 123}],
        "total_pages": 2
    }


def test_get_watch_history_too_small_start_index(mocked_watch_history_db):
    with pytest.raises(mocked_watch_history_db.InvalidStartOffset):
        mocked_watch_history_db.get_watch_history(TEST_CLIENT_ID, start=0)


def test_get_watch_history_too_large_start_index(mocked_watch_history_db):
    global MOCK_RETURN
    MOCK_RETURN = [
        {"Items": [{"collection_name": "ANIME", "item_id": 123}]},
        {"Items": [{"collection_name": "MOVIE", "item_id": 123}]}
    ]
    m = MagicMock()
    mocked_watch_history_db.client.get_paginator.return_value = m
    m.paginate = mock_func
    with pytest.raises(mocked_watch_history_db.InvalidStartOffset):
        mocked_watch_history_db.get_watch_history(TEST_CLIENT_ID, start=10)


def test_get_watch_history_not_found(mocked_watch_history_db):
    m = MagicMock()
    mocked_watch_history_db.client.get_paginator.return_value = m
    m.paginate.return_value = [{"Items": []}]

    with pytest.raises(mocked_watch_history_db.NotFoundError):
        mocked_watch_history_db.get_watch_history(TEST_CLIENT_ID)


def test_get_watch_history_by_collection_not_found(mocked_watch_history_db):
    m = MagicMock()
    mocked_watch_history_db.client.get_paginator.return_value = m
    m.paginate.return_value = [{"Items": []}]

    with pytest.raises(mocked_watch_history_db.NotFoundError):
        mocked_watch_history_db.get_watch_history(TEST_CLIENT_ID, "ANIME")


def test_add_item(mocked_watch_history_db):
    global UPDATE_VALUES
    UPDATE_VALUES = {}
    mocked_watch_history_db.table.update_item = mock_func
    mocked_watch_history_db.table.query.side_effect = mocked_watch_history_db.NotFoundError

    mocked_watch_history_db.add_item(TEST_CLIENT_ID, "MOVIE", "123123")

    assert UPDATE_VALUES == {
        'ExpressionAttributeNames': {
            '#collection_name': 'collection_name',
            '#created_at': 'created_at',
            '#updated_at': 'updated_at'
        },
        'ExpressionAttributeValues': {
            ':collection_name': 'MOVIE',
            ":created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            ":updated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        },
        'Key': {
            'client_id': TEST_CLIENT_ID,
            'item_id': '123123'},
        'UpdateExpression': 'SET #created_at=:created_at,#collection_name=:collection_name,#updated_at=:updated_at REMOVE deleted_at'
    }


def test_add_item_already_exists(mocked_watch_history_db):
    global UPDATE_VALUES
    UPDATE_VALUES = {}
    mocked_watch_history_db.table.update_item = mock_func
    mocked_watch_history_db.table.query.return_value = {
        "Items": [{"exists"}]
    }

    mocked_watch_history_db.add_item(TEST_CLIENT_ID, "MOVIE", "123123")

    assert UPDATE_VALUES == {
        'ExpressionAttributeNames': {
            '#collection_name': 'collection_name',
            '#updated_at': 'updated_at'
        },
        'ExpressionAttributeValues': {
            ':collection_name': 'MOVIE',
            ':updated_at': datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        },
        'Key': {
            'client_id': 'TEST_CLIENT_ID',
            'item_id': '123123'
        },
        'UpdateExpression': 'SET #collection_name=:collection_name,#updated_at=:updated_at REMOVE deleted_at'
    }


def test_update_item(mocked_watch_history_db):
    global UPDATE_VALUES
    UPDATE_VALUES = {}
    mocked_watch_history_db.table.update_item = mock_func

    mocked_watch_history_db.add_item(TEST_CLIENT_ID, "MOVIE", "123123")

    assert UPDATE_VALUES == {
        'ExpressionAttributeNames': {
            '#collection_name': 'collection_name',
            '#updated_at': 'updated_at'
        },
        'ExpressionAttributeValues': {
            ':collection_name': 'MOVIE',
            ":updated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        },
        'Key': {
            'client_id': TEST_CLIENT_ID,
            'item_id': '123123'},
        'UpdateExpression': 'SET #collection_name=:collection_name,#updated_at=:updated_at REMOVE deleted_at'
    }


def test_delete_item(mocked_watch_history_db):
    global UPDATE_VALUES
    UPDATE_VALUES = {}
    mocked_watch_history_db.table.update_item = mock_func

    mocked_watch_history_db.delete_item(TEST_CLIENT_ID, "MOVIE", "123123")

    assert UPDATE_VALUES == {
        'ExpressionAttributeNames': {
            '#collection_name': 'collection_name',
            '#deleted_at': 'deleted_at',
            '#updated_at': 'updated_at'
        },
        'ExpressionAttributeValues': {
            ':collection_name': 'MOVIE',
            ':deleted_at': int(time.time()),
            ':updated_at': datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        },
        'Key': {
            'client_id': TEST_CLIENT_ID,
            'item_id': '123123'
        },
        'UpdateExpression': 'SET #deleted_at=:deleted_at,#collection_name=:collection_name,#updated_at=:updated_at'
    }


def test_add_item_exists(mocked_watch_history_db):
    global UPDATE_VALUES
    UPDATE_VALUES = {}
    mocked_watch_history_db.table.update_item = mock_func
    mocked_watch_history_db.table.query.return_value = {
        "Items": [{"item_data"}]
    }

    mocked_watch_history_db.add_item(TEST_CLIENT_ID, "MOVIE", "123123")

    assert UPDATE_VALUES == {
        'ExpressionAttributeNames': {
            '#collection_name': 'collection_name',
            '#updated_at': 'updated_at'
        },
        'ExpressionAttributeValues': {
            ':collection_name': 'MOVIE',
            ':updated_at': datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        },
        'Key': {
            'client_id': TEST_CLIENT_ID, 'item_id': '123123'},
        'UpdateExpression': 'SET #collection_name=:collection_name,#updated_at=:updated_at REMOVE deleted_at'}


def test_get_item(mocked_watch_history_db):
    global MOCK_RETURN
    MOCK_RETURN = {"Items": [{"collection_name": "ANIME", "item_id": 123}]}

    mocked_watch_history_db.table.query = mock_func

    ret = mocked_watch_history_db.get_item(TEST_CLIENT_ID, "MOVIE", "123123")

    assert ret == {'collection_name': 'ANIME', 'item_id': 123}


def test_get_item_not_found(mocked_watch_history_db):
    mocked_watch_history_db.table.query.return_value = {"Items": []}

    with pytest.raises(mocked_watch_history_db.NotFoundError):
        mocked_watch_history_db.get_item(TEST_CLIENT_ID, "MOVIE", "123123")
