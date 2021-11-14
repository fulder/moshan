import json

import jikan
import tmdb
import tvmaze
import reviews_db

tmdb_api = tmdb.TmdbApi()
tvmaze_api = tvmaze.TvMazeApi()
jikan_api = jikan.JikanApi()


def handler(event, context):
    message = json.loads(event["Records"][0]["Sns"]["Message"])
    api_name = message["api_name"]
    api_id = message["api_id"]

    episodes_info = {}
    if api_name == "tmdb":
        api_item = tmdb_api.get_item(api_name)
        api_cache = {
            "title": api_item.get("title"),
            "release_date": api_item.get("release_date"),
            "status": api_item.get("status")
        }
    elif api_name == "tvmaze":
        api_item = tvmaze_api.get_item(api_id)
        episodes_info = tvmaze_api.get_show_episodes_count(api_id)
        api_cache = {
            "title": api_item.get("name"),
            "release_date": api_item.get("premiered"),
            "status": api_item.get("status"),
            "ep_count": episodes_info.get("ep_count", 0),
            "special_count": episodes_info.get("special_count", 0),
        }
    elif api_name == "mal":
        api_item = jikan_api.get_item(api_id)
        episodes_info = jikan_api.get_episode_count(api_id)
        api_cache = {
            "title": api_item.get("title"),
            "release_date": api_item.get("aired", {}).get("from"),
            "status": api_item.get("status"),
            "ep_count": episodes_info.get("ep_count", 0),
            "special_count": episodes_info.get("special_count", 0),
        }
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
            "api_cache": api_cache,
        }

        reviews_db.put_item(item)


def _get_item_counts(episodes_info, watched_eps, watched_specials):
    counts = {}
    if "episodes_count" in episodes_info:
        p = _get_progress(watched_eps, episodes_info["ep_count"])
        counts = {
            "watched_eps": watched_eps,
            "ep_progress": p,
        }

    if "special_count" in episodes_info:
        p = _get_progress(watched_specials, episodes_info["special_count"])
        counts = {
            **counts,
            "watched_specials": watched_specials,
            "special_progress": p,
        }

    return counts


def _get_progress(watched, count):
    progress = 0
    if count != 0:
        progress = watched / count

    return round(progress * 100, 2)
