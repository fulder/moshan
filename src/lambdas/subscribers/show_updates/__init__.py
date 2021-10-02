import json

import shows_api
import watch_history_db


def handler(event, context):
    message = json.loads(event["Records"][0]["Sns"]["Message"])

    show = shows_api.get_episode_by_api_id(
        message["api_name"],
        message["api_id"]
    )

    items = watch_history_db.get_items_by_id(show["item_id"])
    for item in items:
        if "ep_progress" not in item["ep_progress"]:
            item["ep_progress"] = 0
            item["watched_eps"] = 0


            item["specials_progress"] = 0
            item["watched_specials"] = 0




