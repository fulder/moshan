import updates
import watch_history_db

from tvmaze import TvMazeApi, HTTPError


def handle(event, context):
    tvmaze_api = TvMazeApi()
    tvmaze_updates = tvmaze_api.get_day_updates()

    for tvmaze_id in tvmaze_updates:
        try:
            watch_history_db.get_items_by_api_id("tvmaze", tvmaze_id)
        except HTTPError:
            # Show not present in db, exclude it from updates
            continue

        # Post to SNS topic
        updates.publish_show_update("tvmaze", tvmaze_id)
