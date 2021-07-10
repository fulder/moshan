import json
import os
from json import JSONDecodeError

import anime_api
import api_errors
import decimal_encoder
import logger
import jwt_utils
import schema
import episodes_db
import shows_api

log = logger.get_logger("episodes_by_id")

CURRENT_DIR = os.path.dirname(os.path.realpath(__file__))
PUT_SCHEMA_PATH = os.path.join(CURRENT_DIR, "put.json")


def handle(event, context):
    log.debug(f"Received event: {event}")

    auth_header = event["headers"]["authorization"]
    username = jwt_utils.get_username(auth_header)

    method = event["requestContext"]["http"]["method"]
    collection_name = event["pathParameters"].get("collection_name")
    episode_id = event["pathParameters"].get("episode_id")
    item_id = event["pathParameters"].get("item_id")

    if collection_name not in schema.COLLECTION_NAMES:
        return {"statusCode": 400, "body": json.dumps({"message": f"Invalid collection name, allowed values: {schema.COLLECTION_NAMES}"})}

    if method == "GET":
        return _get_episode(username, collection_name, item_id,
                            episode_id, auth_header)
    elif method == "PATCH":
        body = event.get("body")
        return _put_episode(username, collection_name, item_id, episode_id,
                              body, auth_header)
    elif method == "DELETE":
        return _delete_episode(username, collection_name, episode_id)


def _get_episode(username, collection_name, item_id, episode_id, token):
    s_ret = None
    try:
        if collection_name == "anime":
            s_ret = anime_api.get_episode(item_id, episode_id, token)
        elif collection_name == "show":
            s_ret = shows_api.get_episode(item_id, episode_id, token)
    except api_errors.HttpError as e:
        err_msg = f"Could not get {collection_name} episode for " \
                  f"item: {item_id} and episode_id: {episode_id}"
        log.error(f"{err_msg}. Error: {str(e)}")
        return {"statusCode": e.status_code,
                "body": json.dumps({"message": err_msg}), "error": str(e)}

    try:
        w_ret = episodes_db.get_episode(username, collection_name, episode_id)
        ret = {**w_ret, **s_ret}
        return {
            "statusCode": 200,
            "body": json.dumps(ret, cls=decimal_encoder.DecimalEncoder)
        }
    except episodes_db.NotFoundError as e:
        log.debug(f"Not found episode. Error: {e}")
        return {"statusCode": 404}


def _put_episode(username, collection_name, item_id, episode_id, body, token):
    try:
        body = json.loads(body)
    except (TypeError, JSONDecodeError):
        return {
            "statusCode": 400,
            "body": "Invalid patch body"
        }

    try:
        schema.validate_schema(PUT_SCHEMA_PATH, body)
    except schema.ValidationException as e:
        return {"statusCode": 400, "body": json.dumps({"message": "Invalid post schema", "error": str(e)})}

    try:
        if collection_name == "anime":
            anime_api.get_episode(item_id, episode_id, token)
        elif collection_name == "show":
            shows_api.get_episode(item_id, episode_id, token)
    except api_errors.HttpError as e:
        err_msg = f"Could not get {collection_name} episode for " \
                  f"item: {item_id} and episode_id: {episode_id}"
        log.error(f"{err_msg}. Error: {str(e)}")
        return {"statusCode": e.status_code,
                "body": json.dumps({"message": err_msg}), "error": str(e)}

    episodes_db.update_episode(username, collection_name, episode_id, body)
    return {"statusCode": 204}


def _delete_episode(username, collection_name, episode_id):
    episodes_db.delete_episode(username, collection_name, episode_id)
    return {"statusCode": 204}
