import json
import os
from json import JSONDecodeError

import decimal_encoder
import logger
import jwt_utils
import schema
import episodes_db

log = logger.get_logger("episode_by_collection_item")

CURRENT_DIR = os.path.dirname(os.path.realpath(__file__))
POST_SCHEMA_PATH = os.path.join(CURRENT_DIR, "post.json")


def handle(event, context):
    log.debug(f"Received event: {event}")
    auth_header = event["headers"]["authorization"]
    username = jwt_utils.get_username(auth_header)

    collection_name = event["pathParameters"].get("collection_name")
    item_id = event["pathParameters"].get("item_id")

    method = event["requestContext"]["http"]["method"]

    if method == "GET":
        query_params = event.get("queryStringParameters")
        return _get_episodes(username, item_id, collection_name, query_params)
    elif method == "POST":
        body = event.get("body")
        return _post_episode(username, item_id, collection_name, body)


def _get_episodes(username, item_id, collection_name, query_params):
    limit = 100
    start = 1
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

    if limit > 100:
        limit = 100

    try:
        episodes = episodes_db.get_episodes(username, item_id, collection_name, limit=limit, start=start)
        return {"statusCode": 200, "body": json.dumps(episodes, cls=decimal_encoder.DecimalEncoder)}
    except episodes_db.NotFoundError:
        return {"statusCode": 200, "body": json.dumps({"episodes": []})}


def _post_episode(username, item_id, collection_name, body):
    try:
        body = json.loads(body)
    except (TypeError, JSONDecodeError):
        log.debug(f"Invalid body: {body}")
        return {
            "statusCode": 400,
            "body": "Invalid post body"
        }

    if collection_name not in schema.COLLECTION_NAMES:
        return {
            "statusCode": 400,
            "body": json.dumps({"message": f"Invalid collection name, allowed values: {schema.COLLECTION_NAMES}"})
        }

    try:
        schema.validate_schema(POST_SCHEMA_PATH, body)
    except schema.ValidationException as e:
        return {"statusCode": 400, "body": json.dumps({"message": "Invalid post schema", "error": str(e)})}

    episodes_db.add_episode(username, item_id, collection_name, body["episode_id"])
    return {"statusCode": 204}
