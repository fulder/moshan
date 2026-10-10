from datetime import datetime

import dateutil.parser
import reviews_db
import tenrai
import tmdb
import tvmaze

from .models import ApiNameWithEpisodes

tmdb_api = tmdb.TmdbApi()
tvmaze_api = tvmaze.TvMazeApi()
tenrai_api = tenrai.TenraiApi()


def get_items(username, sort=None, cursor=None, filter=None):
    if sort is not None:
        sort = sort.name
    if filter is not None:
        filter = filter.name

    return reviews_db.get_all_items(
        username,
        sort,
        cursor,
        filter,
    )


def get_item(username, api_name, api_id):
    w_ret = reviews_db.get_item(
        username,
        api_name,
        api_id,
    )
    w_ret["api_name"] = api_name
    w_ret["api_id"] = api_id
    return w_ret


def add_item(username, api_name, api_id, data):
    ep_count_res = None
    api_cache = None
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
        image = api_item.get("image")
        image_url = None
        if image is not None:
            image_url = image.get("original")
        api_cache = {
            "title": api_item.get("name"),
            "release_date": api_item.get("premiered"),
            "status": api_item.get("status"),
            "cache_updated": cache_updated,
            "image_url": image_url,
            "next_episode": tvmaze_api.next_episode(api_item),
        }
        ep_count_res = tvmaze_api.get_show_episodes_count(api_id)
    elif api_name == "mal":
        api_item = tenrai_api.get_item(api_id).get("data", {})
        api_cache = {
            "title": api_item.get("title"),
            "release_date": api_item.get("aired", {}).get("from"),
            "status": api_item.get("status"),
            "cache_updated": cache_updated,
            "image_url": api_item.get("images", {})
            .get("jpg", {})
            .get("image_url"),
        }
        ep_count_res = {
            "ep_count": tenrai_api.get_item_ep_count(api_id, api_item)
        }

    try:
        current_item = reviews_db.get_item(
            username,
            api_name,
            api_id,
            include_deleted=True,
        )
    except reviews_db.NotFoundError:
        current_item = {}

    data["api_cache"] = api_cache

    if ep_count_res is not None:
        data["api_cache"]["ep_count"] = ep_count_res.get("ep_count", 0)
        data["api_cache"]["special_count"] = ep_count_res.get(
            "special_count", 0
        )
        data["ep_progress"] = current_item.get("ep_progress", 0)
        data["special_progress"] = current_item.get("special_progress", 0)
        data["watched_eps"] = current_item.get("watched_eps", 0)
        data["watched_special"] = current_item.get("watched_special", 0)

    reviews_db.add_item(
        username,
        api_name,
        api_id,
        data,
    )


def update_item(username, api_name, api_id, data):
    reviews_db.update_item(
        username,
        api_name,
        api_id,
        data,
    )


def delete_item(username, api_name, api_id):
    reviews_db.delete_item(username, api_name, api_id)


def get_episodes(username, api_name, api_id):
    eps = reviews_db.get_episodes(
        username,
        api_name,
        api_id,
    )
    return {"episodes": eps}


def get_episode(username, api_name, item_api_id, episode_api_id):
    ret = reviews_db.get_episode(
        username,
        api_name,
        item_api_id,
        episode_api_id,
    )
    ret["api_name"] = api_name
    ret["api_id"] = item_api_id
    ret["episode_api_id"] = episode_api_id
    return ret


def add_episode(
    username, api_name: ApiNameWithEpisodes, item_api_id, episode_api_id, data
):
    if api_name == ApiNameWithEpisodes.tvmaze.value:
        tvmaze_api.get_episode(episode_api_id)
    elif api_name == ApiNameWithEpisodes.mal.value:
        tenrai_api.get_episode(item_api_id, episode_api_id)

    item = reviews_db.get_item(
        username,
        api_name,
        item_api_id,
    )

    reviews_db.add_episode(
        username,
        api_name,
        item_api_id,
        episode_api_id,
        data,
    )

    _recount_watched_eps(username, api_name, item_api_id)

    if not data.get("dates_watched"):
        return

    _update_latest_watch_date(item, data, username, api_name, item_api_id)


def update_episode(
    username, api_name: ApiNameWithEpisodes, item_api_id, episode_api_id, data
):
    if api_name == ApiNameWithEpisodes.tvmaze.value:
        tvmaze_api.get_episode(episode_api_id)
    elif api_name == ApiNameWithEpisodes.mal.value:
        tenrai_api.get_episode(item_api_id, episode_api_id)

    item = reviews_db.get_item(
        username,
        api_name,
        item_api_id,
    )

    reviews_db.update_episode(
        username,
        api_name,
        item_api_id,
        episode_api_id,
        data,
    )

    if not data.get("dates_watched"):
        return

    _update_latest_watch_date(item, data, username, api_name, item_api_id)


def _recount_watched_eps(username, api_name, item_api_id):
    # Count from the saved episodes instead of +1/-1, and only those the
    # source lists as aired, so repeated adds, episodes saved early or ones
    # removed upstream can't skew progress. Also refreshes the cached counts:
    # the daily updater skips finished shows, so they can be years old.
    episode_ids = [
        e["episode_api_id"]
        for e in reviews_db.get_episodes(username, api_name, item_api_id)
    ]

    if api_name == ApiNameWithEpisodes.tvmaze.value:
        api_episodes = tvmaze_api.get_show_episodes(item_api_id)
        c = tvmaze_api.watched_counts(api_episodes, episode_ids)
    else:
        api_item = tenrai_api.get_item(item_api_id)["data"]
        ep_count = tenrai_api.get_item_ep_count(item_api_id, api_item)
        c = tenrai_api.watched_counts(ep_count, episode_ids)

    reviews_db.set_watched_eps(
        username,
        api_name,
        item_api_id,
        c["watched_eps"],
        c["watched_specials"],
        {"ep_count": c["ep_count"], "special_count": c["special_count"]},
    )


def _update_latest_watch_date(item, data, username, api_name, item_api_id):
    # If episode watch date is changed check if its larger than current
    # item latest date and update item if that's the case
    ep_date = max([dateutil.parser.parse(d) for d in data["dates_watched"]])

    if (
        "latest_watch_date" not in item
        or item["latest_watch_date"] == "0"
        or ep_date > dateutil.parser.parse(item["latest_watch_date"])
    ):
        ep_date = ep_date.strftime("%Y-%m-%dT%H:%M:%S.%fZ").replace("000Z", "Z")
        reviews_db.update_item(
            username,
            api_name,
            item_api_id,
            {"latest_watch_date": f"{ep_date}"},
            clean_whitelist=[],
        )


def delete_episode(
    username, api_name: ApiNameWithEpisodes, item_api_id, episode_api_id
):
    # No source lookup: episodes removed from TVMaze/Tenrai must stay deletable
    reviews_db.delete_episode(
        username,
        api_name,
        item_api_id,
        episode_api_id,
    )

    _recount_watched_eps(username, api_name, item_api_id)
