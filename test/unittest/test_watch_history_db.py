import time
from datetime import datetime
from unittest.mock import MagicMock

import pytest

TEST_USERNAME = "TEST_USERNAME"


class MockFunc:
    def __init__(self, mock_return=[]):
        self.mock_return = mock_return
        self.update_values = {}

    def f(self, **kwargs):
        self.update_values = kwargs
        return self.mock_return

    @property
    def exp_res(self):
        exp_res = []
        for r in self.mock_return:
            exp_res += r["Items"]
        return exp_res


def test_get_watch_history(mocked_watch_history_db):
    mock_func = MockFunc([
        {"Items": [{"collection_name": "ANIME", "item_id": 123}]},
        {"Items": [{"collection_name": "MOVIE", "item_id": 123}]}
    ])
    m = MagicMock()
    mocked_watch_history_db.client.get_paginator.return_value = m
    m.paginate = mock_func.f

    res = mocked_watch_history_db.get_watch_history(TEST_USERNAME)

    assert mock_func.update_values == {
        "TableName": None,
        "KeyConditionExpression": "username = :username",
        "ExpressionAttributeValues": {":username": {"S": "TEST_USERNAME"}},
        "ScanIndexForward": False,
        'FilterExpression': 'attribute_not_exists(deleted_at)',
    }
    assert res == mock_func.exp_res


def test_get_watch_history_by_collection_name(mocked_watch_history_db):
    mock_func = MockFunc([
        {"Items": [{"collection_name": "ANIME", "item_id": 123}]}
    ])
    m = MagicMock()
    mocked_watch_history_db.client.get_paginator.return_value = m
    m.paginate = mock_func.f

    res = mocked_watch_history_db.get_watch_history(TEST_USERNAME,
                                                    collection_name="anime")

    assert mock_func.update_values == {
        "ExpressionAttributeValues": {
            ":username": {"S": "TEST_USERNAME"},
            ":collection_name": {"S": "anime"}
        },
        "FilterExpression": "attribute_not_exists(deleted_at) and collection_name = :collection_name",
        "KeyConditionExpression": "username = :username",
        "ScanIndexForward": False,
        "TableName": None,
    }
    assert res == mock_func.exp_res


def test_get_watch_history_by_collection_and_index(mocked_watch_history_db):
    mock_func = MockFunc([
        {"Items": [{"collection_name": "ANIME", "item_id": 123}]}
    ])
    m = MagicMock()
    mocked_watch_history_db.client.get_paginator.return_value = m
    m.paginate = mock_func.f

    res = mocked_watch_history_db.get_watch_history(TEST_USERNAME,
                                              collection_name="ANIME",
                                              index_name="test_index")

    assert mock_func.update_values == {
        "ExpressionAttributeValues": {
            ":username": {"S": "TEST_USERNAME"},
            ":collection_name": {"S": "ANIME"}
        },
        "FilterExpression": "attribute_not_exists(deleted_at) and collection_name = :collection_name",
        "KeyConditionExpression": "username = :username",
        "IndexName": "test_index",
        "ScanIndexForward": False,
        "TableName": None
    }
    assert res == mock_func.exp_res


def test_add_item(mocked_watch_history_db):
    mock_func = MockFunc()
    mocked_watch_history_db.table.update_item = mock_func.f
    mocked_watch_history_db.table.query.side_effect = mocked_watch_history_db.NotFoundError

    mocked_watch_history_db.add_item(TEST_USERNAME, "MOVIE", "123123")

    assert mock_func.update_values == {
        'ExpressionAttributeNames': {
            '#collection_name': 'collection_name',
            '#created_at': 'created_at',
            '#deleted_at': 'deleted_at',
            '#latest_watch_date': 'latest_watch_date',
            '#updated_at': 'updated_at',
        },
        'ExpressionAttributeValues': {
            ':collection_name': 'MOVIE',
            ":created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            ':latest_watch_date': '0',
            ":updated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        },
        'Key': {
            'username': TEST_USERNAME,
            'item_id': '123123'},
        'UpdateExpression': 'SET #latest_watch_date=:latest_watch_date,#created_at=:created_at,#collection_name=:collection_name,#updated_at=:updated_at '
                            'REMOVE #deleted_at'
    }


def test_add_item_already_exists(mocked_watch_history_db):
    mock_func = MockFunc()
    mocked_watch_history_db.table.update_item = mock_func.f
    mocked_watch_history_db.table.query.return_value = {
        "Items": [{"exists"}]
    }

    mocked_watch_history_db.add_item(TEST_USERNAME, "MOVIE", "123123")

    assert mock_func.update_values == {
        'ExpressionAttributeNames': {
            '#collection_name': 'collection_name',
            '#deleted_at': 'deleted_at',
            '#latest_watch_date': 'latest_watch_date',
            '#updated_at': 'updated_at'
        },
        'ExpressionAttributeValues': {
            ':collection_name': 'MOVIE',
            ':latest_watch_date': '0',
            ':updated_at': datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        },
        'Key': {
            'username': 'TEST_USERNAME',
            'item_id': '123123'
        },
        'UpdateExpression': 'SET #latest_watch_date=:latest_watch_date,#collection_name=:collection_name,#updated_at=:updated_at '
                            'REMOVE #deleted_at'
    }


def test_update_item(mocked_watch_history_db):
    mock_func = MockFunc()
    mocked_watch_history_db.table.update_item = mock_func.f

    mocked_watch_history_db.update_item(TEST_USERNAME, "MOVIE", "123",
                                        {"review": "review_text"})

    assert mock_func.update_values == {
        'ExpressionAttributeNames': {
            '#collection_name': 'collection_name',
            '#dates_watched': 'dates_watched',
            '#deleted_at': 'deleted_at',
            '#overview': 'overview',
            '#rating': 'rating',
            '#review': 'review',
            '#status': 'status',
            '#updated_at': 'updated_at'
        },
        'ExpressionAttributeValues': {
            ':collection_name': 'MOVIE',
            ":updated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            ":review": "review_text"
        },
        'Key': {
            'username': TEST_USERNAME,
            'item_id': '123'},
        'UpdateExpression': 'SET #review=:review,#collection_name=:collection_name,'
                            '#updated_at=:updated_at '
                            'REMOVE #deleted_at,#overview,#status,#rating,#dates_watched'
    }


def test_update_item_dates_watched(mocked_watch_history_db):
    mock_func = MockFunc()
    mocked_watch_history_db.table.update_item = mock_func.f

    mocked_watch_history_db.update_item(TEST_USERNAME, "MOVIE", "123",
                                        {"dates_watched": [
                                            "2020-12-20T15:30:09.909Z",
                                            "2021-12-20T15:30:09.909Z"
                                        ]})

    assert mock_func.update_values == {
        'ExpressionAttributeNames': {
            '#collection_name': 'collection_name',
            '#updated_at': 'updated_at',
            '#dates_watched': 'dates_watched',
            '#latest_watch_date': 'latest_watch_date',
            '#deleted_at': 'deleted_at',
            '#overview': 'overview',
            '#rating': 'rating',
            '#review': 'review',
            '#status': 'status',
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
            'item_id': '123'},
        'UpdateExpression': 'SET #dates_watched=:dates_watched,#collection_name=:collection_name,'
                            '#updated_at=:updated_at,#latest_watch_date=:latest_watch_date '
                            'REMOVE #deleted_at,#overview,#review,#status,#rating'
    }


def test_update_item_dates_watched_one_date(mocked_watch_history_db):
    mock_func = MockFunc()
    mocked_watch_history_db.table.update_item = mock_func.f

    mocked_watch_history_db.update_item(TEST_USERNAME, "MOVIE", "123", {
        "dates_watched": ["2020-12-20T15:30:09.909Z"]})

    assert mock_func.update_values == {
        'ExpressionAttributeNames': {
            '#collection_name': 'collection_name',
            '#dates_watched': 'dates_watched',
            '#deleted_at': 'deleted_at',
            '#latest_watch_date': 'latest_watch_date',
            '#overview': 'overview',
            '#rating': 'rating',
            '#review': 'review',
            '#status': 'status',
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
            'item_id': '123'},
        'UpdateExpression': 'SET #dates_watched=:dates_watched,#collection_name=:collection_name,'
                            '#updated_at=:updated_at,#latest_watch_date=:latest_watch_date '
                            'REMOVE #deleted_at,#overview,#review,#status,#rating'
    }


def test_delete_item(mocked_watch_history_db):
    mock_func = MockFunc()
    mocked_watch_history_db.table.update_item = mock_func.f

    mocked_watch_history_db.delete_item(TEST_USERNAME, "MOVIE", "123123")

    assert mock_func.update_values == {
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
            'username': TEST_USERNAME,
            'item_id': '123123'
        },
        'UpdateExpression': 'SET #deleted_at=:deleted_at,#collection_name=:collection_name,#updated_at=:updated_at'
    }


def test_add_item_exists(mocked_watch_history_db):
    mock_func = MockFunc()
    mocked_watch_history_db.table.update_item = mock_func.f
    mocked_watch_history_db.table.query.return_value = {
        "Items": [{"item_data"}]
    }

    mocked_watch_history_db.add_item(TEST_USERNAME, "MOVIE", "123123")

    assert mock_func.update_values == {
        'ExpressionAttributeNames': {
            '#collection_name': 'collection_name',
            '#deleted_at': 'deleted_at',
            '#latest_watch_date': 'latest_watch_date',
            '#updated_at': 'updated_at'
        },
        'ExpressionAttributeValues': {
            ':collection_name': 'MOVIE',
            ':latest_watch_date': '0',
            ':updated_at': datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        },
        'Key': {
            'username': TEST_USERNAME, 'item_id': '123123'},
        'UpdateExpression': 'SET #latest_watch_date=:latest_watch_date,#collection_name=:collection_name,#updated_at=:updated_at '
                            'REMOVE #deleted_at'
    }


def test_get_item(mocked_watch_history_db):
    mock_func = MockFunc(
        {"Items": [{"collection_name": "ANIME", "item_id": 123}]},
    )

    mocked_watch_history_db.table.query = mock_func.f

    ret = mocked_watch_history_db.get_item(TEST_USERNAME, "MOVIE", "123123")

    assert ret == {'collection_name': 'ANIME', 'item_id': 123}


def test_get_item_not_found(mocked_watch_history_db):
    mocked_watch_history_db.table.query.return_value = {"Items": []}

    with pytest.raises(mocked_watch_history_db.NotFoundError):
        mocked_watch_history_db.get_item(TEST_USERNAME, "MOVIE", "123123")
