import json
import os
from json import JSONDecodeError

import decimal_encoder
import api_errors
import logger
import jwt_utils
import movie_api
import schema
import shows_api
import media_request_thread
import watch_history_db
import anime_api

log = logger.get_logger("watch_history")

CURRENT_DIR = os.path.dirname(os.path.realpath(__file__))
POST_SCHEMA_PATH = os.path.join(CURRENT_DIR, "post.json")


def handle(event, context):
    log.debug(f"Received event: {event}")
    auth_header = event["headers"]["authorization"]
    username = jwt_utils.get_username(auth_header)

    collection_name = event["pathParameters"].get("collection_name")

    method = event["requestContext"]["http"]["method"]

    if collection_name not in schema.COLLECTION_NAMES:
        err = f"Invalid collection name, " \
              f"allowed values: {schema.COLLECTION_NAMES}"
        return {
            "statusCode": 400,
            "body": json.dumps({"message": err})
        }

    if method == "GET":
        query_params = event.get("queryStringParameters", {})
        return _get(username, collection_name, auth_header, query_params, auth_header)
    elif method == "POST":
        body = event.get("body")
        return _post_collection_item(username, collection_name, body,
                                     auth_header)


def _get(username, collection_name, auth_header, query_params, token):
    if "api_name" in query_params and "api_id" in query_params:
        api_name = query_params["api_name"]
        api_id = query_params["api_id"]
        return _get_by_api_id(collection_name, api_name, api_id, username,
                              auth_header)
    else:
        return _get_watch_history(username, collection_name, query_params, token)


def _get_by_api_id(collection_name, api_name, api_id, username, token):
    s_ret = None
    try:
        if collection_name == "anime":
            s_ret = anime_api.get_anime_by_api_id(api_name, api_id, token)
        elif collection_name == "show":
            s_ret = shows_api.get_show_by_api_id(api_name, api_id)
        elif collection_name == "movie":
            s_ret = movie_api.get_movie_by_api_id(api_name, api_id, token)
    except api_errors.HttpError as e:
        err_msg = f"Could not get {collection_name}"
        log.error(f"{err_msg}. Error: {str(e)}")
        return {"statusCode": e.status_code,
                "body": json.dumps({"message": err_msg}), "error": str(e)}

    try:
        w_ret = watch_history_db.get_item(username, collection_name,
                                          s_ret["id"])
        ret = {**w_ret, **s_ret}
        return {"statusCode": 200,
                "body": json.dumps(ret, cls=decimal_encoder.DecimalEncoder)}
    except watch_history_db.NotFoundError:
        return {
            "statusCode": 404
        }


def _get_watch_history(username, collection_name, query_params, token):
    sort = None
    if query_params:
        sort = query_params.get("sort")

    if sort and sort not in schema.ALLOWED_SORT:
        err = f"Invalid sort specified. Allowed values: {schema.ALLOWED_SORT}"
        return {
            "statusCode": 400,
            "body": json.dumps({"error": err})
        }

    try:
        items = watch_history_db.get_watch_history(
            username,
            collection_name=collection_name,
            index_name=sort
        )

        items = media_request_thread.merge_media_api_info_from_items(items, True, token)

        return {
                "statusCode": 200, "body":
                    json.dumps({"items": items}, cls=decimal_encoder.DecimalEncoder)
            }
    except watch_history_db.NotFoundError:
        return {"statusCode": 200, "body": json.dumps({"items": []})}
    except watch_history_db.InvalidStartOffset:
        return {
            "statusCode": 400,
            "body": json.dumps({"message": "Invalid start offset"})
        }


def _post_collection_item(username, collection_name, body, token):
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
            res = anime_api.post_anime(body, token)
        elif collection_name == "show":
            res = shows_api.post_show(body)
        elif collection_name == "movie":
            res = movie_api.post_movie(body, token)
    except api_errors.HttpError as e:
        err_msg = f"Could not post {collection_name}"
        log.error(f"{err_msg}. Error: {str(e)}")
        return {"statusCode": e.status_code,
                "body": json.dumps({"message": err_msg}), "error": str(e)}

    item_id = res["id"]
    watch_history_db.add_item(username, collection_name, item_id)
    return {
        "statusCode": 200,
        "body": json.dumps({"id": item_id})
    }
