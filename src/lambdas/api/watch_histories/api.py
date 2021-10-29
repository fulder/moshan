import json

from fastapi import HTTPException

import decimal_encoder
import logger
import tvmaze
import watch_history_db

tvmaze_api = tvmaze.TvMazeApi()
log = logger.get_logger(__name__)


def get_item(username, api_name, api_id):
    try:
        if api_name == "tvmaze":
            api_ret = tvmaze_api.get_show(api_id)
        else:
            raise HTTPException(status_code=501)
    except tvmaze.HTTPError as e:
        err_msg = f"Could not get item from {api_name} api with id: {api_id}"
        log.error(f"{err_msg}. Error: {str(e)}")
        raise HTTPException(status_code=e.code)

    try:
        w_ret = watch_history_db.get_item_by_api_id(username, api_id)
        ret = {**w_ret, api_name: {**api_ret}}
        return {json.dumps(ret, cls=decimal_encoder.DecimalEncoder)}
    except watch_history_db.NotFoundError:
        raise HTTPException(status_code=404)
