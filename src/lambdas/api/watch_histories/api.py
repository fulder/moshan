from fastapi import HTTPException

import logger
import tvmaze
import watch_history_db

tvmaze_api = tvmaze.TvMazeApi()
log = logger.get_logger(__name__)


def get_item(username, api_name, api_id):
    api_ret = _get_api_res(api_name, api_id)

    try:
        w_ret = watch_history_db.get_item_by_api_id(
            username,
            f"{api_name}_{api_id}",
        )
        return {**w_ret, api_name: {**api_ret}}
    except watch_history_db.NotFoundError:
        raise HTTPException(status_code=404)


def add_item(username, api_name, api_id, data):
    _get_api_res(api_name, api_id)

    watch_history_db.add_item_v2(
        username,
        api_name,
        api_id,
        data
    )


def _get_api_res(api_name, api_id):
    try:
        if api_name == "tvmaze":
            return tvmaze_api.get_show(api_id)
        else:
            raise HTTPException(status_code=501)
    except tvmaze.HTTPError as e:
        err_msg = f"Could not get item from {api_name} api with id: {api_id}"
        log.error(f"{err_msg}. Error: {str(e)}")
        raise HTTPException(status_code=e.code)
