import json
import os
from datetime import datetime
from decimal import Decimal

import reviews_db
import telegram
import tenrai
import tmdb
import tvmaze
from log import setup_logger
from loguru import logger

setup_logger()

tmdb_api = tmdb.TmdbApi()
tvmaze_api = tvmaze.TvMazeApi()
tenrai_api = tenrai.TenraiApi()

NOTIFY_USERNAME = os.getenv("TELEGRAM_USERNAME")


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
            "next_episode": tvmaze_api.next_episode(api_item),
        }
    elif api_name == "mal":
        api_item = tenrai_api.get_item(api_id).get("data", {})
        ep_count = tenrai_api.get_item_ep_count(api_id, api_item)
        api_cache = {
            "title": api_item.get("title"),
            "release_date": api_item.get("aired", {}).get("from"),
            "status": api_item.get("status"),
            "ep_count": ep_count,
            "special_count": 0,
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

        old_ep_count = item["api_cache"].get("ep_count")
        old_next_episode = item["api_cache"].get("next_episode")
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

        _notify_new_episodes(item, old_ep_count)
        _notify_new_season(item, old_next_episode)


def _notify_new_episodes(item, old_ep_count):
    if item["username"] != NOTIFY_USERNAME:
        return
    if item.get("status") not in ("following", "watching"):
        return

    new_ep_count = item["api_cache"].get("ep_count")
    if old_ep_count is None or new_ep_count is None:
        return
    if new_ep_count <= old_ep_count:
        return

    watched_eps = item.get("watched_eps", 0)
    if watched_eps >= new_ep_count:
        return

    telegram.send(
        f"{item['api_cache']['title']}: episode {new_ep_count} is out "
        f"({new_ep_count - watched_eps} unseen)"
    )


def _notify_new_season(item, old_next_episode):
    if item["username"] != NOTIFY_USERNAME:
        return
    if item.get("status") == "dropped":
        return

    new = item["api_cache"].get("next_episode")
    if not new or new.get("number") != 1:
        return
    if old_next_episode and old_next_episode.get("season") == new["season"]:
        return

    telegram.send(
        f"📅 {item['api_cache']['title']}: season {new['season']} starts "
        f"{new['airstamp'][:10]}"
    )


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
