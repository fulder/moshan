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


def test_get_watch_dates(mocker):
    client = MagicMock()
    mocker.patch.object(reviews_db, "_get_client", return_value=client)
    client.get_paginator.return_value.paginate.return_value = [
        {
            "Items": [
                {
                    "api_info": {"S": "e_mal_1_4"},
                    "dates_watched": {"L": [{"S": "2026-10-01T20:00:00Z"}]},
                },
                {
                    "api_info": {"S": "i_tmdb_550"},
                    "dates_watched": {
                        "L": [
                            {"S": "2020-01-01T20:00:00Z"},
                            {"S": "2025-01-01"},
                        ]
                    },
                },
            ]
        }
    ]

    res = reviews_db.get_watch_dates("me")

    assert res == [
        {"api_name": "mal", "api_id": "1", "date": "2026-10-01T20:00:00Z"},
        {"api_name": "tmdb", "api_id": "550", "date": "2020-01-01T20:00:00Z"},
        {"api_name": "tmdb", "api_id": "550", "date": "2025-01-01"},
    ]


def test_get_all_items_filter_without_sort(mocker):
    table = _update_kwargs(mocker)
    table.query.return_value = {
        "Items": [{"api_info": "i_mal_1", "status": "following"}]
    }

    res = reviews_db.get_all_items("me", filter="in_progress")

    assert "IndexName" not in table.query.call_args.kwargs
    assert res["items"][0]["api_id"] == "1"


def test_get_all_items_projects_list_fields(mocker):
    table = _update_kwargs(mocker)
    table.query.return_value = {"Items": []}

    reviews_db.get_all_items("me", sort="rating", filter="only_backlog")

    kwargs = table.query.call_args.kwargs
    assert "#review" not in kwargs["ProjectionExpression"]
    assert kwargs["ExpressionAttributeNames"]["#api_cache"] == "api_cache"
