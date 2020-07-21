import json
import os

import logger
import jwt_utils
import schema
import watch_history_db

log = logger.get_logger("watch_history")

ALLOWED_SORT = ["rating", "date_watched", "state"]
CURRENT_DIR = os.path.dirname(os.path.realpath(__file__))
POST_SCHEMA_PATH = os.path.join(CURRENT_DIR, "post.json")


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
        body = event.get("body")
        try:
            schema.validate_schema(POST_SCHEMA_PATH, body)
        except schema.ValidationException as e:
            return {"statusCode": 400, "body": json.dumps({"message": "Invalid post schema", "error": str(e)})}
        watch_history_db.update_item(client_id, collection_name, item_id, body)
        return {"statusCode": 204}
    elif method == "DELETE":
        watch_history_db.delete_item(client_id, collection_name, item_id)
        return {"statusCode": 204}
