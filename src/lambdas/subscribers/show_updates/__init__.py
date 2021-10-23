import json

import shows_api
import watch_history_db


def handle(event, context):
    message = json.loads(event["Records"][0]["Sns"]["Message"])

    show = shows_api.get_show_by_api_id(
        message["api_name"],
        message["api_id"],
    )

    items = watch_history_db.get_items_by_id(show["id"])
    for item in items:
        print(f"Updating item: {item}")

        if "ep_progress" not in item:
            item["ep_progress"] = 0
            item["watched_eps"] = 0
            item["special_progress"] = 0
            item["watched_specials"] = 0

        item["ep_count"] = show["ep_count"]
        if item["ep_count"] == 0:
            ep_progress = 0
        else:
            ep_progress = item["watched_eps"] / item["ep_count"]
        item["ep_progress"] = str(round(ep_progress * 100, 2))

        item["special_count"] = show["special_count"]
        if item["special_count"] == 0:
            special_progress = 0
        else:
            special_progress = item["watched_specials"] / item["special_count"]
        item["special_progress"] = str(round(special_progress * 100, 2))

        watch_history_db.put_item(item)
