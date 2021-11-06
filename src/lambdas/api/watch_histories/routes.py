import episodes_db
import jikan
import tmdb
import utils
from fastapi import HTTPException
import dateutil.parser

import logger
import tvmaze
import watch_history_db

tmdb_api = tmdb.TmdbApi()
tvmaze_api = tvmaze.TvMazeApi()
jikan_api = jikan.JikanApi()
log = logger.get_logger(__name__)


def get_item(username, api_name, api_id):
    # try:
    #     if api_name == "tvmaze":
    #         tvmaze_api.get_show(api_id)
    #     else:
    #         raise HTTPException(status_code=501)
    # except tvmaze.HTTPError as e:
    #     err_msg = f"Could not get item from {api_name} api with id: {api_id}"
    #     log.error(f"{err_msg}. Error: {str(e)}")
    #     raise HTTPException(status_code=e.code)

    try:
        w_ret = watch_history_db.get_item_by_api_id(
            username,
            api_name,
            api_id,
        )
        return w_ret
    except watch_history_db.NotFoundError:
        raise HTTPException(status_code=404)


def add_item(username, api_name, api_id, data):
    ep_count_res = None
    try:
        if api_name == "tmdb":
            tmdb_api.get_item(api_id)
        elif api_name == "tvmaze":
            ep_count_res = tvmaze_api.get_show_episodes_count(api_id)
        elif api_name == "mal":
            ep_count_res = jikan_api.get_episode_count(api_id)
    except utils.HttpError as e:
        err_msg = f"Could not validate item in add_item" \
                  f" from {api_name} api with id: {api_id}"
        log.error(f"{err_msg}. Error: {str(e)}")
        raise HTTPException(status_code=e.code)

    try:
        current_item = watch_history_db.get_item_by_api_id(
            username,
            api_name,
            api_id,
            include_deleted=True,
        )
    except watch_history_db.NotFoundError:
        current_item = {}

    if ep_count_res is not None:
        data["ep_count"] = ep_count_res.get("ep_count", 0)
        data["special_count"] = ep_count_res.get("special_count", 0)
        data["ep_progress"] = current_item.get("ep_progress", 0)
        data["special_progress"] = current_item.get("special_progress", 0)
        data["watched_eps"] = current_item.get("watched_eps", 0)
        data["watched_special"] = current_item.get("watched_special", 0)

    watch_history_db.add_item_v2(
        username,
        api_name,
        api_id,
        data
    )


def update_item(username, api_name, api_id, data):
    all_none = True
    for v in data.values():
        if v is not None:
            all_none = False
    if all_none:
        raise HTTPException(
            status_code=400,
            detail="Please specify at least one of the optional fields"
        )

    watch_history_db.update_item_v2(
        username,
        api_name,
        api_id,
        data
    )


def delete_item(username, api_name, api_id):
    watch_history_db.delete_item_v2(username, api_name, api_id)


def get_episodes(username, api_name, api_id):
    return episodes_db.get_episodes(
        username,
        api_name,
        api_id,
    )


def get_episode(username, api_name, item_api_id, episode_api_id):
    try:
        w_ret = episodes_db.get_episode_by_api_id(
            username,
            api_name,
            item_api_id,
            episode_api_id,
        )
        return w_ret
    except episodes_db.NotFoundError:
        raise HTTPException(status_code=404)


def add_episode(username, api_name, item_api_id, episode_api_id, data):
    try:
        if api_name == "tvmaze":
            api_res = tvmaze_api.get_episode(episode_api_id)
            is_special = api_res["type"] != "regular"
        elif api_name == "mal":
            api_res = jikan_api.get_episode(item_api_id, episode_api_id)
            is_special = False  # mal items are special not episodes
        else:
            raise HTTPException(status_code=501)
    except utils.HttpError as e:
        err_msg = f"Could not get show episode in add_episode func" \
                  f" from {api_name} api with id: {episode_api_id}"
        log.error(f"{err_msg}. Error: {str(e)}")
        raise HTTPException(status_code=e.code)

    try:
        item = watch_history_db.get_item_by_api_id(
            username,
            api_name,
            item_api_id,
        )
    except watch_history_db.NotFoundError:
        err_msg = f"Item with api_id: {item_api_id} not found. " \
                  f"Please add it to the watch-history before posting episode"
        raise HTTPException(status_code=404, detail=err_msg)

    episodes_db.add_episode_v2(
        username,
        api_name,
        item_api_id,
        episode_api_id,
        data
    )

    watch_history_db.change_watched_eps_v2(
        username,
        api_name,
        item_api_id,
        1,
        special=is_special
    )

    if not data.get("dates_watched"):
        return

    _update_latest_watch_date(item, data, username, api_name, item_api_id)


def update_episode(username, api_name, item_api_id, episode_api_id, data):
    try:
        if api_name == "tvmaze":
            tvmaze_api.get_episode(episode_api_id)
        elif api_name == "mal":
            jikan_api.get_episode(item_api_id, episode_api_id)
        else:
            raise HTTPException(status_code=501)
    except utils.HttpError as e:
        err_msg = f"Could not get episode in add_episode func" \
                  f" from {api_name} api with id: {episode_api_id}"
        log.error(f"{err_msg}. Error: {str(e)}")
        raise HTTPException(status_code=e.code)

    try:
        item = watch_history_db.get_item_by_api_id(
            username,
            api_name,
            item_api_id,
        )
    except watch_history_db.NotFoundError:
        err_msg = f"Item with api_id: {item_api_id} not found. " \
                  f"Please add it to the watch-history before posting episode"
        raise HTTPException(status_code=404, detail=err_msg)

    episodes_db.update_episode_v2(
        username,
        api_name,
        item_api_id,
        episode_api_id,
        data
    )

    if not data.get("dates_watched"):
        return

    _update_latest_watch_date(item, data, username, api_name, item_api_id)


def _update_latest_watch_date(item, data, username, api_name, item_api_id):
    # If episode watch date is changed check if its larger than current
    # item latest date and update item if that's the case
    ep_date = max([dateutil.parser.parse(d) for d in data["dates_watched"]])

    if (item["latest_watch_date"] == "0" or
        ep_date > dateutil.parser.parse(item["latest_watch_date"])):
        ep_date = ep_date.strftime("%Y-%m-%dT%H:%M:%S.%fZ").replace("000Z", "Z")
        watch_history_db.update_item_v2(
            username,
            api_name,
            item_api_id,
            {"latest_watch_date": f"{ep_date}"},
            clean_whitelist=[],
        )


def delete_episode(username, api_name, item_api_id, episode_api_id):
    try:
        if api_name == "tvmaze":
            api_res = tvmaze_api.get_episode(episode_api_id)
            is_special = api_res["type"] != "regular"
        elif api_name == "mal":
            api_res = jikan_api.get_episode(item_api_id, episode_api_id)
            is_special = False  # mal items are special not episodes
        else:
            raise HTTPException(status_code=501)
    except utils.HttpError as e:
        err_msg = f"Could not get episode in delete_episode func" \
                  f" from {api_name} api with id: {episode_api_id}"
        log.error(f"{err_msg}. Error: {str(e)}")
        raise HTTPException(status_code=e.code)

    episodes_db.delete_episode_v2(
        username,
        api_name,
        item_api_id,
        episode_api_id,
    )

    watch_history_db.change_watched_eps_v2(
        username,
        api_name,
        item_api_id,
        -1,
        special=is_special
    )
