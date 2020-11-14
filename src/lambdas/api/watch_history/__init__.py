import json

import decimal_encoder
import logger
import jwt_utils
import watch_history_db

log = logger.get_logger("watch_history")

ALLOWED_SORT = ["rating", "date_watched", "state"]


def handle(event, context):
    auth_header = event["headers"]["authorization"]
    username = jwt_utils.get_username(auth_header)

    sort = None
    query_params = event.get("queryStringParameters")
    if query_params:
        sort = query_params.get("sort")

    if sort and sort not in ALLOWED_SORT:
        return {
            "statusCode": 400,
            "body": json.dumps({"error": f"Invalid sort specified. Allowed values: {ALLOWED_SORT}"})
        }

    limit = 100
    start = 1

    query_params = event.get("queryStringParameters")
    if query_params and "limit" in query_params:
        limit = query_params.get("limit")
    if query_params and "start" in query_params:
        start = query_params.get("start")

    try:
        limit = int(limit)
    except ValueError:
        return {"statusCode": 400, "body": json.dumps({"message": "Invalid limit type"})}
    try:
        start = int(start)
    except ValueError:
        return {"statusCode": 400, "body": json.dumps({"message": "Invalid start type"})}

    try:
        watch_history = watch_history_db.get_watch_history(username, index_name=sort, limit=limit, start=start)
        return {"statusCode": 200, "body": json.dumps(watch_history, cls=decimal_encoder.DecimalEncoder)}
    except watch_history_db.NotFoundError:
        return {"statusCode": 200, "body": json.dumps({"items": []})}


