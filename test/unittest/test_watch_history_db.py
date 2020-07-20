import pytest

UPDATE_VALUES = {}
TEST_CLIENT_ID = "TEST_CLIENT_ID"

def mocked_update_item(Key=None, UpdateExpression=None, ExpressionAttributeNames=None, ExpressionAttributeValues=None):
    global UPDATE_VALUES
    UPDATE_VALUES["Key"] = Key
    UPDATE_VALUES["UpdateExpression"] = UpdateExpression
    UPDATE_VALUES["ExpressionAttributeNames"] = ExpressionAttributeNames
    UPDATE_VALUES["ExpressionAttributeValues"] = ExpressionAttributeValues


def test_get_watch_history_not_found(mocked_watch_history_db):
    mocked_watch_history_db.table.query.return_value = {
        "Items": []
    }

    with pytest.raises(mocked_watch_history_db.NotFoundError):
        mocked_watch_history_db.get_watch_history(TEST_CLIENT_ID)


def test_get_watch_history_by_collection_not_found(mocked_watch_history_db):
    mocked_watch_history_db.table.query.return_value = {
        "Items": []
    }

    with pytest.raises(mocked_watch_history_db.NotFoundError):
        mocked_watch_history_db.get_watch_history_by_collection(TEST_CLIENT_ID, "ANIME")


def test_add_item(mocked_watch_history_db):
    mocked_watch_history_db.table.update_item = mocked_update_item

    data = {
        "first": "1",
        "second": "2"
    }
    mocked_watch_history_db.add_item(TEST_CLIENT_ID, "MOVIE", "123123", data)

    assert UPDATE_VALUES["Key"] == {"client_id": TEST_CLIENT_ID}
    assert UPDATE_VALUES["UpdateExpression"] == "SET #first=:first,#second=:second,#item_id=:item_id,#collection_id=:collection_id"
    assert UPDATE_VALUES["ExpressionAttributeNames"] == {'#first': 'first', '#second': 'second', '#item_id': 'item_id', '#collection_id': 'collection_id'}
    assert UPDATE_VALUES["ExpressionAttributeValues"] == {':first': '1', ':second': '2', ':item_id': '123123', ':collection_id': 'MOVIE'}
