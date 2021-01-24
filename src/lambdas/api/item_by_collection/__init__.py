import json
import os
from json import JSONDecodeError

import anime_api
import api_errors
import decimal_encoder
import logger
import jwt_utils
import movie_api
import schema
import shows_api
import watch_history_db

log = logger.get_logger("watch_history")

CURRENT_DIR = os.path.dirname(os.path.realpath(__file__))
PATCH_SCHEMA_PATH = os.path.join(CURRENT_DIR, "patch.json")


def handle(event, context):
    log.debug(f"Received event: {event}")

    auth_header = event["headers"]["authorization"]
    username = jwt_utils.get_username(auth_header)

    method = event["requestContext"]["http"]["method"]
    collection_name = event["pathParameters"].get("collection_name")
    item_id = event["pathParameters"].get("item_id")

    if collection_name not in schema.COLLECTION_NAMES:
        return {"statusCode": 400, "body": json.dumps({"message": f"Invalid collection name, allowed values: {schema.COLLECTION_NAMES}"})}

    if method == "GET":
        return _get_item(username, collection_name, item_id)
    elif method == "PATCH":
        body = event.get("body")
        return _patch_item(username, collection_name, item_id, body, auth_header)
    elif method == "DELETE":
        return _delete_item(username, collection_name, item_id)


def _get_item(username, collection_name, item_id):
    try:
        ret = watch_history_db.get_item(username, collection_name, item_id)
        return {"statusCode": 200, "body": json.dumps(ret, cls=decimal_encoder.DecimalEncoder)}
    except watch_history_db.NotFoundError:
        return {"statusCode": 404}


def _patch_item(username, collection_name, item_id, body, token):
    try:
        body = json.loads(body)
    except (TypeError, JSONDecodeError):
        return {
            "statusCode": 400,
            "body": "Invalid patch body"
        }

    try:
        schema.validate_schema(PATCH_SCHEMA_PATH, body)
    except schema.ValidationException as e:
        return {"statusCode": 400, "body": json.dumps({"message": "Invalid post schema", "error": str(e)})}

    try:
        if collection_name == "anime":
            anime_api.get_anime(item_id, token)
        elif collection_name == "show":
            shows_api.get_show(item_id, token)
        elif collection_name == "movie":
            movie_api.get_movie(item_id, token)
    except api_errors.HttpError as e:
        err_msg = f"Could not get {collection_name}"
        log.error(f"{err_msg}. Error: {str(e)}")
        return {"statusCode": e.status_code, "body": json.dumps({"message": err_msg}), "error": str(e)}

    watch_history_db.update_item(username, collection_name, item_id, body)
    return {"statusCode": 204}


def _delete_item(username, collection_name, item_id):
    watch_history_db.delete_item(username, collection_name, item_id)
    return {"statusCode": 204}
