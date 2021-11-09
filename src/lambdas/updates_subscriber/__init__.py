import json

import jikan
import tvmaze
import reviews_db

tvmaze_api = tvmaze.TvMazeApi()
jikan_api = jikan.JikanApi()


def handler(event, context):
    message = json.loads(event["Records"][0]["Sns"]["Message"])

    items = reviews_db.get_items(
        message["api_name"],
        message["api_id"]
    )

    if message["api_name"] == "tvmaze":
        api_item = tvmaze_api.get_show_episodes_count(message["api_id"])
    elif message["api_name"] == "mal":
        api_item = jikan_api.get_episode_count(message["api_id"])
    else:
        raise Exception(f"Unexpected api_name: {message['api_name']}")

    for item in items:
        print(f"Updating item: {item}")

        if "watched_eps" not in item:
            item["watched_eps"] = 0
        if "watched_specials" not in item:
            item["watched_specials"] = 0

        item["ep_count"] = api_item["ep_count"]
        if item["ep_count"] == 0:
            ep_progress = 0
        else:
            ep_progress = item["watched_eps"] / item["ep_count"]
        item["ep_progress"] = round(ep_progress * 100, 2)

        item["special_count"] = api_item["special_count"]
        if item["special_count"] == 0:
            special_progress = 0
        else:
            special_progress = item["watched_specials"] / item["special_count"]
        item["special_progress"] = round(special_progress * 100, 2)

        reviews_db.put_item(item)
