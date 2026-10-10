import os
import sys

PUB_PATH = os.path.join(
    os.path.dirname(os.path.realpath(__file__)),
    "..",
    "..",
    "src",
    "lambdas",
    "updates_publisher",
)
sys.path.append(PUB_PATH)
sys.path.append(os.path.dirname(PUB_PATH))

import updates_publisher  # noqa: E402


def test_mal_updates_refresh_finished_airing(mocker):
    mocker.patch.object(
        updates_publisher.tenrai_api,
        "get_schedules",
        return_value=[{"mal_id": 1}, {"mal_id": 2}],
    )
    mocker.patch.object(updates_publisher.reviews_db, "get_items")
    # 2 is still on the schedule, 3 just aired its finale
    mocker.patch.object(
        updates_publisher.reviews_db,
        "get_cached_airing_mal_ids",
        return_value={"2", "3"},
    )
    published = mocker.patch.object(
        updates_publisher.updates, "publish_show_update"
    )

    updates_publisher._check_mal_updates()

    assert sorted(c.args[1] for c in published.call_args_list) == [
        "1",
        "2",
        "3",
    ]


def test_mal_sequels_checks_new_and_publishes_known(mocker):
    mocker.patch.object(
        updates_publisher.tenrai_api,
        "get_season_anime",
        return_value=[
            {"mal_id": 10, "title": "S2", "aired": {"from": "2027-01-05"}},
            {"mal_id": 20, "title": "Other", "aired": {"from": None}},
        ],
    )
    # 10 is new: its prequel 5 is in a list; 20 was checked before
    mocker.patch.object(
        updates_publisher.reviews_db,
        "get_checked_sequels",
        return_value={"20": []},
    )
    relations = mocker.patch.object(
        updates_publisher.tenrai_api,
        "get_relations",
        return_value=[
            {"relation": "Prequel", "entry": [{"mal_id": 5, "type": "anime"}]}
        ],
    )
    put = mocker.patch.object(
        updates_publisher.reviews_db, "put_checked_sequels"
    )
    mocker.patch.object(updates_publisher.reviews_db, "get_items")
    published = mocker.patch.object(updates_publisher.updates, "publish_sequel")

    updates_publisher._check_mal_sequels()

    relations.assert_called_once_with("10")
    put.assert_called_once_with({"20": [], "10": ["5"]})
    published.assert_called_once_with(
        "5",
        {"mal_id": 10, "title": "S2", "start": "2027-01-05", "status": None},
    )
