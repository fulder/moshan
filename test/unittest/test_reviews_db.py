from unittest.mock import MagicMock

import reviews_db


def _update_kwargs(mocker):
    table = MagicMock()
    mocker.patch.object(reviews_db, "_get_table", return_value=table)
    return table


def test_update_sets_missing_created_at(mocker):
    table = _update_kwargs(mocker)

    reviews_db.update_episode("me", "mal", "1", "4", {"rating": 8})

    kwargs = table.update_item.call_args.kwargs
    assert (
        "#created_at=if_not_exists(#created_at,:updated_at)"
        in kwargs["UpdateExpression"]
    )
    assert ":updated_at" in kwargs["ExpressionAttributeValues"]


def test_add_keeps_given_created_at(mocker):
    table = _update_kwargs(mocker)
    mocker.patch.object(
        reviews_db, "_get_review", side_effect=reviews_db.NotFoundError
    )

    reviews_db.add_episode("me", "mal", "1", "4")

    kwargs = table.update_item.call_args.kwargs
    assert "if_not_exists" not in kwargs["UpdateExpression"]
    assert "#created_at=:created_at" in kwargs["UpdateExpression"]


def test_set_watched_eps_refreshes_cache_fields(mocker):
    table = _update_kwargs(mocker)

    reviews_db.set_watched_eps(
        "me",
        "mal",
        "1",
        6,
        0,
        {"ep_count": 12, "special_count": 0, "status": "Finished Airing"},
    )

    kwargs = table.update_item.call_args.kwargs
    assert kwargs["ExpressionAttributeValues"][":ep"] == 50
    # Reserved words like status go through attribute names
    names = kwargs["ExpressionAttributeNames"]
    assert "status" in names.values()
    assert "#api_cache.#c2=:c2" in kwargs["UpdateExpression"]
