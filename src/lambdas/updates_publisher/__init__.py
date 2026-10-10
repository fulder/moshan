import reviews_db
import tenrai
import tmdb
import tvmaze
import updates
from log import setup_logger

setup_logger()

tmdb_api = tmdb.TmdbApi()
tvmaze_api = tvmaze.TvMazeApi()
tenrai_api = tenrai.TenraiApi()


def handler(event, context):
    _check_tmdb_updates()

    _check_tvmaze_updates()

    _check_mal_updates()

    _check_mal_sequels()


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
    airing = tenrai_api.get_schedules()
    scheduled = {str(a["mal_id"]) for a in airing}

    for mal_id in scheduled:
        try:
            reviews_db.get_items("mal", mal_id)
        except reviews_db.NotFoundError:
            continue

        updates.publish_show_update("mal", mal_id)

    # Cached as airing but off the schedule: finished (or not started yet).
    # Refresh once so the finale is counted and the status turns finished.
    for mal_id in reviews_db.get_cached_airing_mal_ids() - scheduled:
        updates.publish_show_update("mal", mal_id)


# Relations lookups per run; the first run has ~500 season anime to check
SEQUEL_CHECKS_PER_RUN = 300


def _check_mal_sequels():
    """Finds new anime seasons whose prequel is in someone's list.

    Each season anime's prequels are looked up once and remembered; known
    ones are re-published daily so start dates stay current.
    """
    candidates = {str(a["mal_id"]): a for a in tenrai_api.get_season_anime()}
    checked = reviews_db.get_checked_sequels()

    unchecked = [i for i in candidates if i not in checked]
    for mal_id in unchecked[:SEQUEL_CHECKS_PER_RUN]:
        relations = tenrai_api.get_relations(mal_id)
        checked[mal_id] = tenrai_api.prequel_ids(relations)
    if unchecked:
        reviews_db.put_checked_sequels(checked)

    for mal_id, anime in candidates.items():
        for prequel_id in checked.get(mal_id, []):
            try:
                reviews_db.get_items("mal", prequel_id)
            except reviews_db.NotFoundError:
                continue

            updates.publish_sequel(
                prequel_id,
                {
                    "mal_id": int(mal_id),
                    "title": anime.get("title"),
                    "start": (anime.get("aired") or {}).get("from"),
                    "status": anime.get("status"),
                },
            )
