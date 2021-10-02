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

    if collection_name not in schema.COLLECTION_NAMES:
        msg = f"Invalid collection name, allowed values: " \
              f"{schema.COLLECTION_NAMES}"
        return {
            "statusCode": 400,
            "body": json.dumps({"message": msg})}

    if method == "GET":
        query_params = event.get("queryStringParameters", {})
        return _get(username, collection_name,
                    item_id, auth_header, query_params)
    elif method == "POST":
        body = event.get("body")
        return _post_episode(username, collection_name,
                             item_id, body, auth_header)


def _get(username, collection_name, item_id, auth_header, query_params):
    if "api_name" in query_params and "api_id" in query_params:
        api_name = query_params["api_name"]
        api_id = query_params["api_id"]
        return _get_episode_by_api_id(
            collection_name, item_id, api_name, api_id, username,
            auth_header)
    else:
        return _get_episodes(username, collection_name, item_id, query_params)


def _get_episode_by_api_id(collection_name, item_id, api_name, api_id,
                           username, token):
    s_ret = None
    try:
        if collection_name == "anime":
            s_ret = anime_api.get_episode_by_api_id(item_id, api_name, api_id,
                                                  token)
        elif collection_name == "show":
            s_ret = shows_api.get_episode_by_api_id(api_name, api_id)
    except api_errors.HttpError as e:
        err_msg = f"Could not get {collection_name} episode"
        log.error(f"{err_msg}. Error: {str(e)}")
        return {"statusCode": e.status_code,
                "body": json.dumps({"message": err_msg}), "error": str(e)}

    try:
        w_ret = episodes_db.get_episode(username, collection_name, s_ret["id"])
        ret = {**w_ret, **s_ret}
        return {"statusCode": 200,
                "body": json.dumps(ret, cls=decimal_encoder.DecimalEncoder)}
    except episodes_db.NotFoundError:
        return {
            "statusCode": 404
        }


def _get_episodes(username, collection_name, item_id, query_params):
    limit = 100
    start = 1
    if query_params and "limit" in query_params:
        limit = query_params.get("limit")
    if query_params and "start" in query_params:
        start = query_params.get("start")

    try:
        limit = int(limit)
    except ValueError:
        return {"statusCode": 400,
                "body": json.dumps({"message": "Invalid limit type"})}
    try:
        start = int(start)
    except ValueError:
        return {"statusCode": 400,
                "body": json.dumps({"message": "Invalid start type"})}

    if limit > 100:
        limit = 100

    try:
        episodes = episodes_db.get_episodes(username, collection_name, item_id,
                                            limit=limit, start=start)
        return {"statusCode": 200, "body": json.dumps(episodes,
                                                      cls=decimal_encoder.DecimalEncoder)}
    except episodes_db.NotFoundError:
        return {"statusCode": 200, "body": json.dumps({"episodes": []})}


def _post_episode(username, collection_name, item_id, body, token):
    try:
        body = json.loads(body)
    except (TypeError, JSONDecodeError):
        log.debug(f"Invalid body: {body}")
        return {
            "statusCode": 400,
            "body": "Invalid post body"
        }

    try:
        schema.validate_schema(POST_SCHEMA_PATH, body)
    except schema.ValidationException as e:
        return {"statusCode": 400, "body": json.dumps(
            {"message": "Invalid post schema", "error": str(e)})}

    res = None
    try:
        if collection_name == "anime":
            res = anime_api.post_episode(item_id, body, token)
        elif collection_name == "show":
            res = shows_api.post_episode(item_id, body)
    except api_errors.HttpError as e:
        err_msg = f"Could not post {collection_name}"
        log.error(f"{err_msg}. Error: {str(e)}")
        return {"statusCode": e.status_code,
                "body": json.dumps({"message": err_msg}), "error": str(e)}

    episode_id = res["id"]

    episodes_db.add_episode(username, collection_name, item_id, episode_id)
    return {
        "statusCode": 200,
        "body": json.dumps({"id": episode_id})
    }
