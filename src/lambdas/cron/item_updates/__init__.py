from datetime import datetime

import jikan
import tvmaze
import updates
import utils
import watch_history_db

tvmaze_api = tvmaze.TvMazeApi()
jikan_api = jikan.JikanApi()


def handle(event, context):
    _check_tvmaze_updates()

    _check_mal_updates()


def _check_tvmaze_updates():
    tvmaze_updates = tvmaze_api.get_day_updates()

    for tvmaze_id in tvmaze_updates:
        try:
            watch_history_db.get_items_by_api_id("tvmaze", tvmaze_id)
        except watch_history_db.NotFoundError:
            # Show not present in db, exclude it from updates
            continue

        # Post to SNS topic
        updates.publish_show_update("tvmaze", tvmaze_id)


def _check_mal_updates():
    day_of_week = datetime.today().strftime('%A').lower()
    airing = jikan_api.get_schedule(day_of_week)[day_of_week]

    for a in airing:
        mal_id = a["mal_id"]
        try:
            watch_history_db.get_items_by_api_id("mal", mal_id)
        except watch_history_db.NotFoundError:
            continue

        updates.publish_show_update("mal", mal_id)
