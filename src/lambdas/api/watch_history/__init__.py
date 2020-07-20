import json

import logger
import jwt_utils
import watch_history_db

log = logger.get_logger("watch_history")

ALLOWED_SORT = ["rating", "date_watched", "state"]

def handle(event, context):
    auth_header = event["headers"]["authorization"]
    client_id = jwt_utils.get_client_id(auth_header)

    sort = None
    query_params = event.get("queryStringParameters")
    if query_params:
        sort = query_params.get("sort")

    if sort and sort not in ALLOWED_SORT:
        return {
            "statusCode": 400,
            "body": json.dumps({"error": f"Invalid sort specified. Allowed values: {ALLOWED_SORT}"})
        }

    watch_history = watch_history_db.get_watch_history(client_id, index_name=sort)



