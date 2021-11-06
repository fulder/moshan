import json
import os
from json import JSONDecodeError

import decimal_encoder
import utils
import logger
import jwt_utils
import schema
import watch_history_db

log = logger.get_logger("watch_history")

CURRENT_DIR = os.path.dirname(os.path.realpath(__file__))
POST_SCHEMA_PATH = os.path.join(CURRENT_DIR, "post.json")


def handle(event, context):
    log.debug(f"Received event: {event}")
    auth_header = event["headers"]["authorization"]
    username = jwt_utils.get_username(auth_header)

    collection_name = event["pathParameters"].get("collection_name")

    method = event["requestContext"]["http"]["method"]
    query_params = event.get("queryStringParameters", {})

    if collection_name not in schema.COLLECTION_NAMES:
        err = f"Invalid collection name, " \
              f"allowed values: {schema.COLLECTION_NAMES}"
        return {
            "statusCode": 400,
            "body": json.dumps({"message": err})
        }

    if method == "GET":
        return _get_watch_history(username, collection_name,
                                  query_params, auth_header)


def _get_watch_history(username, collection_name, query_params, token):
    sort = None
    show_api = None
    if query_params:
        sort = query_params.get("sort")
        show_api = query_params.get("show_api")

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

        items = utils.merge_media_api_info_from_items(
            items,
            True,
            token,
            show_api=show_api,
        )

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
