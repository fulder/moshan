from fastapi import HTTPException

import logger
import tvmaze
import watch_history_db

tvmaze_api = tvmaze.TvMazeApi()
log = logger.get_logger(__name__)


def get_item(username, api_name, api_id):
    try:
        if api_name == "tvmaze":
            tvmaze_api.get_show(api_id)
        else:
            raise HTTPException(status_code=501)
    except tvmaze.HTTPError as e:
        err_msg = f"Could not get item from {api_name} api with id: {api_id}"
        log.error(f"{err_msg}. Error: {str(e)}")
        raise HTTPException(status_code=e.code)

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
    try:
        if api_name == "tvmaze":
            res = tvmaze_api.get_show_episodes_count(api_id)
        else:
            raise HTTPException(status_code=501)
    except tvmaze.HTTPError as e:
        err_msg = f"Could not get show episodes in add_item func" \
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

    data["ep_count"] = res.get("ep_count", 0)
    data["special_count"] = res.get("special_count", 0)
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

    watch_history_db.add_item_v2(
        username,
        api_name,
        api_id,
        data
    )


def delete_item(username, api_name, api_id):
    collection_name, item_id = watch_history_db.get_collection_and_item_id(
        api_name,
        api_id,
    )
    watch_history_db.delete_item(username, collection_name, item_id)
