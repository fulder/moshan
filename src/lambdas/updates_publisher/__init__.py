from datetime import datetime

import jikan
import tmdb
import tvmaze
import updates
import reviews_db

tmdb_api = tmdb.TmdbApi()
tvmaze_api = tvmaze.TvMazeApi()
jikan_api = jikan.JikanApi()


def handler(event, context):
    _check_tmdb_updates()

    _check_tvmaze_updates()

    _check_mal_updates()


def _check_tmdb_updates():
    tmdb_updates = tmdb_api.get_all_changes()

    for update in tmdb_updates:
        tmdb_id = update["id"]
        try:
            reviews_db.get_items("tmdb", tmdb_id)
        except reviews_db.NotFoundError:
            # Show not present in db, exclude it from updates
            continue

        # Post to SNS topic
        updates.publish_show_update("tmdb", tmdb_id)


def _check_tvmaze_updates():
    tvmaze_updates = tvmaze_api.get_day_updates()

    for tvmaze_id in tvmaze_updates:
        try:
            reviews_db.get_items("tvmaze", tvmaze_id)
        except reviews_db.NotFoundError:
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
            reviews_db.get_items("mal", mal_id)
        except reviews_db.NotFoundError:
            continue

        updates.publish_show_update("mal", mal_id)
