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
