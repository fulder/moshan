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
REVIEW_URL = "https://moshan.fulder.dev/review.html"


def _url(api_name, api_id, episode_id=None):
    url = f"{REVIEW_URL}?api_name={api_name}&api_id={api_id}"
    if episode_id is not None:
        url += f"&episode_api_id={episode_id}"
    return url


def handler(event, context):
    message = json.loads(event["Records"][0]["Sns"]["Message"])
    if message.get("type") == "sequel":
        _handle_sequel(message)
        return

    api_name = message["api_name"]
    api_id = message["api_id"]

    # Counts watched episodes from a user's saved ones (shows with episodes)
    count_watched = None
    # Newest aired episode, linked from the new episode ping
    latest_episode = None
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
        api_episodes = tvmaze_api.get_show_episodes(api_id)
        episodes_info = tvmaze_api.count_episodes(api_episodes)
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

        count_watched = lambda ids: tvmaze_api.watched_counts(  # noqa: E731
            api_episodes, ids
        )
        aired, _ = tvmaze_api.aired_episode_ids(api_episodes)
        aired_regular = [e["id"] for e in api_episodes if str(e["id"]) in aired]
        if aired_regular:
            latest_episode = aired_regular[-1]

    elif api_name == "mal":
        res = tenrai_api.get_item(api_id)
        if res is None:
            # Gone from Tenrai (e.g. removed or merged on MAL): keep the cache
            logger.bind(apiId=api_id).warning("Anime not found, skipping")
            return
        api_item = res.get("data", {})
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

        count_watched = lambda ids: tenrai_api.watched_counts(  # noqa: E731
            ep_count, ids
        )
        latest_episode = ep_count or None

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
        count_info = {}
        if count_watched is not None:
            # Recount from the saved episodes, fixing any old drift
            saved = reviews_db.get_episodes(
                item["username"], message["api_name"], message["api_id"]
            )
            c = count_watched([e["episode_api_id"] for e in saved])
            count_info = {
                "watched_eps": c["watched_eps"],
                "ep_progress": _get_progress(c["watched_eps"], c["ep_count"]),
                "watched_specials": c["watched_specials"],
                "special_progress": _get_progress(
                    c["watched_specials"], c["special_count"]
                ),
            }
        item = {
            **item,
            **count_info,
            "api_cache": api_cache,
        }

        reviews_db.put_item(item)

        _notify_new_episodes(item, old_ep_count, latest_episode)
        _notify_new_season(item, old_next_episode)


def _notify_new_episodes(item, old_ep_count, latest_episode=None):
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

    _, api_name, api_id = item["api_info"].split("_", 2)
    telegram.send(
        f"{item['api_cache']['title']}: episode {new_ep_count} is out "
        f"({new_ep_count - watched_eps} unseen)\n"
        f"{_url(api_name, api_id, latest_episode)}"
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

    _, api_name, api_id = item["api_info"].split("_", 2)
    telegram.send(
        f"📅 {item['api_cache']['title']}: season {new['season']} starts "
        f"{new['airstamp'][:10]}\n{_url(api_name, api_id)}"
    )


def _handle_sequel(message):
    prequel_id = message["prequel_id"]
    sequel = message["sequel"]
    try:
        items = reviews_db.get_items("mal", prequel_id)
    except reviews_db.NotFoundError:
        return

    for item in items:
        if "deleted_at" in item:
            continue
        old = item.get("api_cache", {}).get("sequel")
        if old == sequel:
            continue

        reviews_db.set_api_cache_fields(
            item["username"], "mal", prequel_id, {"sequel": sequel}
        )
        if old is None or old.get("mal_id") != sequel["mal_id"]:
            _notify_sequel(item, sequel)


def _notify_sequel(item, sequel):
    if item["username"] != NOTIFY_USERNAME:
        return
    if item.get("status") == "dropped":
        return
    try:
        # Already in the list: the calendar shows it anyway
        reviews_db.get_item(item["username"], "mal", sequel["mal_id"])
        return
    except reviews_db.NotFoundError:
        pass

    start = (sequel.get("start") or "")[:10] or "TBA"
    telegram.send(
        f"📅 {sequel['title']} announced "
        f"(after {item['api_cache']['title']}), starts {start}\n"
        f"{_url('mal', sequel['mal_id'])}"
    )


def _get_progress(watched, count):
    progress = 0
    if count != 0:
        progress = watched / count

    return Decimal(round(progress * 100, 2))
