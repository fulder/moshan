import json
import os

import decimal_encoder
import logger
import jwt_utils
import schema
import watch_history_db

log = logger.get_logger("watch_history")


CURRENT_DIR = os.path.dirname(os.path.realpath(__file__))
POST_SCHEMA_PATH = os.path.join(CURRENT_DIR, "post.json")


def handle(event, context):
    auth_header = event["headers"]["authorization"]
    client_id = jwt_utils.get_client_id(auth_header)

    collection_name = event["pathParameters"].get("collection_name")

    method = event["requestContext"]["http"]["method"]

    if method == "GET":
        query_params = event.get("queryStringParameters")
        return _get_watch_history(client_id, collection_name, query_params)
    elif method == "POST":
        body = event.get("body")
        return _post_collection_item(client_id, collection_name, body)


def _get_watch_history(client_id, collection_name, query_params):
    sort = None
    if query_params:
        sort = query_params.get("sort")

    if sort and sort not in schema.ALLOWED_SORT:
        return {
            "statusCode": 400,
            "body": json.dumps({"error": f"Invalid sort specified. Allowed values: {schema.ALLOWED_SORT}"})
        }

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

    try:
        watch_history = watch_history_db.get_watch_history(client_id, collection_name=collection_name, index_name=sort,
                                                           limit=limit, start=start)
        return {"statusCode": 200, "body": json.dumps(watch_history, cls=decimal_encoder.DecimalEncoder)}
    except watch_history_db.NotFoundError:
        return {"statusCode": 404}


def _post_collection_item(client_id, collection_name, body):
    if collection_name not in schema.COLLECTION_NAMES:
        return {
            "statusCode": 400,
            "body": json.dumps({"message": f"Invalid collection name, allowed values: {schema.COLLECTION_NAMES}"})
        }

    try:
        schema.validate_schema(POST_SCHEMA_PATH, body)
    except schema.ValidationException as e:
        return {"statusCode": 400, "body": json.dumps({"message": "Invalid post schema", "error": str(e)})}
