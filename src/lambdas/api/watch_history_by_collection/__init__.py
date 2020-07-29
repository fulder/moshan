import json
import os
from json import JSONDecodeError

import decimal_encoder
import logger
import jwt_utils
import schema
import watch_history_db
import anime_api

log = logger.get_logger("watch_history")

CURRENT_DIR = os.path.dirname(os.path.realpath(__file__))
POST_SCHEMA_PATH = os.path.join(CURRENT_DIR, "post.json")


def handle(event, context):
    log.debug(f"Received event: {event}")
    auth_header = event["headers"]["authorization"]
    client_id = jwt_utils.get_username(auth_header)

    collection_name = event["pathParameters"].get("collection_name")

    method = event["requestContext"]["http"]["method"]

    if method == "GET":
        query_params = event.get("queryStringParameters")
        return _get_watch_history(client_id, collection_name, query_params, auth_header)
    elif method == "POST":
        body = event.get("body")
        return _post_collection_item(client_id, collection_name, body, auth_header)


def _get_watch_history(client_id, collection_name, query_params, token):
    sort = None
    if query_params:
        sort = query_params.get("sort")

    if sort and sort not in schema.ALLOWED_SORT:
        return {
            "statusCode": 400,
            "body": json.dumps({"error": f"Invalid sort specified. Allowed values: {schema.ALLOWED_SORT}"})
        }

    limit = 20
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

    if limit > 20:
        limit = 20

    try:
        watch_history = watch_history_db.get_watch_history(client_id, collection_name=collection_name, index_name=sort,
                                                           limit=limit, start=start)

        # Fetch anime posters for all items in returned watch_history items
        if collection_name == "anime":
            anime = anime_api.get_anime(watch_history["items"].keys(), token)

            for anime_id in anime:
                watch_history["items"][anime_id] = anime[anime_id]

        return {"statusCode": 200, "body": json.dumps(watch_history, cls=decimal_encoder.DecimalEncoder)}
    except watch_history_db.NotFoundError:
        return {"statusCode": 404}


def _post_collection_item(client_id, collection_name, body, token):
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

    item_id = None
    if collection_name == "anime":
        try:
            item_id = anime_api.post_anime(body["item_add_id"], token)
        except anime_api.HttpError as e:
            return {"statusCode": 503, "body": json.dumps({"message": "Error during anime post", "error": str(e)})}
    elif collection_name == "show":
        return {"statusCode": 501}  # TODO: Implement
    elif collection_name == "movie":
        return {"statusCode": 501}  # TODO: Implement

    watch_history_db.add_item(client_id, collection_name, item_id)
    return {"statusCode": 204}
