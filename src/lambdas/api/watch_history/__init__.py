import json

import anime_api
import api_errors
import decimal_encoder
import logger
import jwt_utils
import movie_api
import shows_api
import utils
import watch_history_db
from schema import ALLOWED_SORT

log = logger.get_logger("watch_history")


def handle(event, context):
    auth_header = event["headers"]["authorization"]
    username = jwt_utils.get_username(auth_header)

    sort = None
    status_filter = None
    query_params = event.get("queryStringParameters")
    if query_params:
        sort = query_params.get("sort")
        status_filter = query_params.get("status")

    if sort and sort not in ALLOWED_SORT:
        return {
            "statusCode": 400,
            "body": json.dumps({"error": f"Invalid sort specified. Allowed values: {ALLOWED_SORT}"})
        }

    try:
        items = watch_history_db.get_watch_history(
            username,
            index_name=sort,
            status_filter=status_filter
        )

        remove_status = status_filter is not None
        utils.merge_media_api_info_from_items(items, remove_status, auth_header)
        return {
            "statusCode": 200,
            "body": json.dumps({"items": items},
                               cls=decimal_encoder.DecimalEncoder)
        }
    except api_errors.HttpError as e:
        err_msg = f"Could not get item from media API"
        log.error(f"{err_msg}. Error: {str(e)}")
        return {"statusCode": e.status_code,
                "body": json.dumps({"message": err_msg}),
                "error": str(e)}


    except watch_history_db.NotFoundError:
        return {
            "statusCode": 200,
            "body": json.dumps({"items": []})
        }


