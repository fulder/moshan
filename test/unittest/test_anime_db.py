import pytest



def test_get_watch_history_not_found(mocked_watch_history_db):
    mocked_watch_history_db.table.query.return_value = {
        "Items": []
    }

    with pytest.raises(mocked_watch_history_db.NotFoundError):
        mocked_watch_history_db.get_watch_history("123")


def test_get_watch_history_by_collection_not_found(mocked_watch_history_db):
    mocked_watch_history_db.table.query.return_value = {
        "Items": []
    }

    with pytest.raises(mocked_watch_history_db.NotFoundError):
        mocked_watch_history_db.get_watch_history_by_collection("123", "ANIME")


