import json

import anime_api
import api_errors
import decimal_encoder
import logger
import jwt_utils
import movie_api
import shows_api
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
        new_items = []
        for i in items:
            s_ret = None
            try:
                if i["collection_name"] == "movie":
                    s_ret = movie_api.get_movie(i["item_id"], auth_header)
                if i["collection_name"] == "show":
                    s_ret = shows_api.get_show(i["item_id"], auth_header)
                elif i["collection_name"] == "anime":
                    s_ret = anime_api.get_anime(i["item_id"], auth_header)
            except api_errors.HttpError as e:
                err_msg = f"Could not get {i['collection_name']} item: {i['item_id']}"
                log.error(f"{err_msg}. Error: {str(e)}")
                return {"statusCode": e.status_code,
                        "body": json.dumps({"message": err_msg}),
                        "error": str(e)}

            del i["username"]
            del i["item_id"]
            if status_filter is not None:
                del i["status"]
            new_items.append({**s_ret, **i})

        return {
            "statusCode": 200,
            "body": json.dumps({"items": new_items}, cls=decimal_encoder.DecimalEncoder)
        }
    except watch_history_db.NotFoundError:
        return {
            "statusCode": 200,
            "body": json.dumps({"items": []})
        }


