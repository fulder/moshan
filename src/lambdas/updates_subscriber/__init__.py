import json

import jikan
import tvmaze
import reviews_db

tvmaze_api = tvmaze.TvMazeApi()
jikan_api = jikan.JikanApi()


def handler(event, context):
    message = json.loads(event["Records"][0]["Sns"]["Message"])

    if message["api_name"] == "tvmaze":
        episodes_info = tvmaze_api.get_show_episodes_count(message["api_id"])
    elif message["api_name"] == "mal":
        episodes_info = jikan_api.get_episode_count(message["api_id"])
    else:
        raise Exception(f"Unexpected api_name: {message['api_name']}")

    items = reviews_db.get_items(
        message["api_name"],
        message["api_id"]
    )

    for item in items:
        print(f"Updating item: {item}")

        watched_eps = item.get("watched_eps", 0)
        watched_specials = item.get("watched_specials", 0)

        count_info = _get_item_counts(
            episodes_info,
            watched_eps,
            watched_specials
        )
        item = {
            **item,
            **count_info,
        }

        reviews_db.put_item(item)


def _get_item_counts(episodes_info, watched_eps, watched_specials):
    ep_count = episodes_info["ep_count"]
    counts = {
        "watched_eps": watched_eps,
        "ep_count": ep_count,
        "ep_progress": _get_progress(watched_eps, ep_count),
    }

    if "special_count" in episodes_info:
        special_count = episodes_info["special_count"]
        counts = {
            **counts,
            "watched_specials": watched_specials,
            "special_count": special_count,
            "special_progress": _get_progress(watched_specials, special_count),
        }

    return counts


def _get_progress(watched, count):
    progress = 0
    if count != 0:
        progress = watched / count

    return round(progress * 100, 2)
