import json

import logger
import jwt_utils
import watch_history_db

log = logger.get_logger("watch_history")

ALLOWED_SORT = ["rating", "date_watched", "state"]


def handle(event, context):
    auth_header = event["headers"]["authorization"]
    client_id = jwt_utils.get_client_id(auth_header)

    method = event["requestContext"]["http"]["method"]
    collection_name = event["pathParameters"].get("collection_name")
    item_id = event["pathParameters"].get("item_id")

    if method == "GET":
        try:
            ret = watch_history_db.get_item(client_id, collection_name, item_id)
            return {"statusCode": 200, "body": json.dumps(ret)}
        except watch_history_db.NotFoundError:
            return {"statusCode": 404}
    elif method == "POST":
        pass
    elif method == "DELETE":
        watch_history_db.delete_item(client_id, collection_name, item_id)
        return {"statusCode": 204}
