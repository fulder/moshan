import json

import tvmaze
import watch_history_db

tvmaze_api = tvmaze.TvMazeApi()


def handle(event, context):
    message = json.loads(event["Records"][0]["Sns"]["Message"])

    items = watch_history_db.get_items_by_api_id(
        message["api_name"],
        message["api_id"]
    )
    tvmaze_item = tvmaze_api.get_show_episodes_count(message["api_id"])

    for item in items:
        print(f"Updating item: {item}")

        if "watched_eps" not in item:
            item["watched_eps"] = 0
        if "watched_specials" not in item:
            item["watched_specials"] = 0

        item["ep_count"] = tvmaze_item["ep_count"]
        if item["ep_count"] == 0:
            ep_progress = 0
        else:
            ep_progress = item["watched_eps"] / item["ep_count"]
        item["ep_progress"] = round(ep_progress * 100, 2)

        item["special_count"] = tvmaze_item["special_count"]
        if item["special_count"] == 0:
            special_progress = 0
        else:
            special_progress = item["watched_specials"] / item["special_count"]
        item["special_progress"] = round(special_progress * 100, 2)

        watch_history_db.put_item(item)
