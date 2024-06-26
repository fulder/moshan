import json
from datetime import datetime
from decimal import Decimal

import jikan
import reviews_db
import tmdb
import tvmaze
from log import setup_logger
from loguru import logger

setup_logger()

tmdb_api = tmdb.TmdbApi()
tvmaze_api = tvmaze.TvMazeApi()
jikan_api = jikan.JikanApi()


def handler(event, context):
    message = json.loads(event["Records"][0]["Sns"]["Message"])
    api_name = message["api_name"]
    api_id = message["api_id"]

    episodes_info = {}
    cache_updated = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    if api_name == "tmdb":
        api_item = tmdb_api.get_item(api_id)
        api_cache = {
            "title": api_item.get("title"),
            "release_date": api_item.get("release_date"),
            "status": api_item.get("status"),
            "cache_updated": cache_updated,
            "image_url": api_item.get("poster_path"),
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
            "cache_updated": cache_updated,
            "image_url": api_item.get("image", {}).get("original"),
        }
    elif api_name == "mal":
        api_item = jikan_api.get_item(api_id).get("data", {})
        api_ep_count = api_item.get("episodes")
        if api_ep_count is None:
            api_ep_count = 0
        episodes_info = jikan_api.get_episode_count(api_id)
        ep_count = max(api_ep_count, episodes_info.get("ep_count", 0))
        api_cache = {
            "title": api_item.get("title"),
            "release_date": api_item.get("aired", {}).get("from"),
            "status": api_item.get("status"),
            "ep_count": ep_count,
            "special_count": episodes_info.get("special_count", 0),
            "cache_updated": cache_updated,
            "image_url": api_item.get("images", {})
            .get("jpg", {})
            .get("image_url"),
        }
    else:
        raise Exception(f"Unexpected api_name: {message['api_name']}")

    items = reviews_db.get_items(message["api_name"], message["api_id"])

    for item in items:
        logger.bind(
            apiId=message["api_id"],
            apiName=message["api_name"],
            username=item["username"],
            apiCache=item["api_cache"],
        ).debug("Updating item")

        watched_eps = item.get("watched_eps", 0)
        watched_specials = item.get("watched_specials", 0)

        count_info = _get_item_counts(
            episodes_info, watched_eps, watched_specials
        )
        item = {
            **item,
            **count_info,
            "api_cache": api_cache,
        }

        reviews_db.put_item(item)


def _get_item_counts(episodes_info, watched_eps, watched_specials):
    counts = {}
    if "ep_count" in episodes_info:
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

    return Decimal(round(progress * 100, 2))
