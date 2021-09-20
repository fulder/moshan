import json

import decimal_encoder
import logger
import jwt_utils
import watch_history_db

log = logger.get_logger("watch_history")

ALLOWED_SORT = ["rating", "dates_watched", "state"]


def handle(event, context):
    auth_header = event["headers"]["authorization"]
    username = jwt_utils.get_username(auth_header)

    sort = None
    status_filter = None
    query_params = event.get("queryStringParameters")
    if query_params:
        sort = query_params.get("sort")
        status_filter = query_params.get("state")

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
        return {
            "statusCode": 200,
            "body": json.dumps({"items": items}, cls=decimal_encoder.DecimalEncoder)
        }
    except watch_history_db.NotFoundError:
        return {
            "statusCode": 200,
            "body": json.dumps({"items": []})
        }


