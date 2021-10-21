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

        if "ep_progress" not in item["ep_progress"]:
            item["ep_progress"] = 0
            item["watched_eps"] = 0
            item["special_progress"] = 0
            item["watched_special"] = 0

        item["ep_count"] = show["ep_count"]
        ep_progress = item["watched_eps"] / item["ep_count"]
        item["ep_progress"] = str(round(ep_progress * 100, 2))

        item["special_count"] = show["special_count"]
        special_progress = item["special_eps"] / item["special_count"]
        item["special_progress"] = str(round(special_progress * 100, 2))

        watch_history_db.put_item(item)
