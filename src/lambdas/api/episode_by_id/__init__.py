import json
import os
from json import JSONDecodeError

import decimal_encoder
import logger
import jwt_utils
import schema
import episodes_db

log = logger.get_logger("episodes_by_id")

CURRENT_DIR = os.path.dirname(os.path.realpath(__file__))
PATCH_SCHEMA_PATH = os.path.join(CURRENT_DIR, "patch.json")


def handle(event, context):
    log.debug(f"Received event: {event}")

    auth_header = event["headers"]["authorization"]
    username = jwt_utils.get_username(auth_header)

    method = event["requestContext"]["http"]["method"]
    collection_name = event["pathParameters"].get("collection_name")
    item_id = event["pathParameters"].get("item_id")
    episode_id = event["pathParameters"].get("episode_id")

    if collection_name not in schema.COLLECTION_NAMES:
        return {"statusCode": 400, "body": json.dumps({"message": f"Invalid collection name, allowed values: {schema.COLLECTION_NAMES}"})}

    if method == "GET":
        return _get_episode(username, collection_name, item_id, episode_id)
    elif method == "PATCH":
        body = event.get("body")
        return _patch_episode(username, collection_name, item_id, episode_id, body)
    elif method == "DELETE":
        return _delete_episode(username, collection_name, item_id, episode_id)


def _get_episode(username, collection_name, item_id, episode_id):
    try:
        ret = episodes_db.get_episode(username, collection_name, item_id, episode_id)
        return {"statusCode": 200, "body": json.dumps(ret, cls=decimal_encoder.DecimalEncoder)}
    except episodes_db.NotFoundError as e:
        log.debug(f"Not found episode. Error: {e}")
        return {"statusCode": 404}


def _patch_episode(username, collection_name, item_id, episode_id, body):
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
    episodes_db.update_episode(username, collection_name, item_id, episode_id, body)
    return {"statusCode": 204}


def _delete_episode(username, collection_name, item_id, episode_id):
    episodes_db.delete_episode(username, collection_name, item_id, episode_id)
    return {"statusCode": 204}
