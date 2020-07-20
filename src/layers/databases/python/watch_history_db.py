import os
import time

import boto3
from boto3.dynamodb.conditions import Key, Attr

import logger

DATABASE_NAME = os.getenv("DATABASE_NAME")

table = None

log = logger.get_logger(__name__)


class Error(Exception):
    pass


class NotFoundError(Error):
    pass


def _get_table():
    global table
    if table is None:
        table = boto3.resource("dynamodb").Table(DATABASE_NAME)
    return table


def add_item(client_id, collection_id, item_id, data):
    update_item(client_id, collection_id, item_id, data)


def delete_item(client_id, collection_id, item_id):
    data = {"deleted_at": int(time.time())}
    update_item(client_id, collection_id, item_id, data)


def update_item(client_id, collection_id, item_id, data):
    data["item_id"] = item_id
    data["collection_id"] = collection_id

    items = ','.join(f'#{k}=:{k}' for k in data)
    update_expression = f"SET {items}"
    expression_attribute_names = {f'#{k}': k for k in data}
    expression_attribute_values = {f':{k}': v for k, v in data.items()}

    log.debug("Running update_item")
    log.debug(f"Update expression: {update_expression}")
    log.debug(f"Expression attribute names: {expression_attribute_names}")
    log.debug(f"Expression attribute values: {expression_attribute_values}")

    _get_table().update_item(
        Key={"client_id": client_id},
        UpdateExpression=update_expression,
        ExpressionAttributeNames=expression_attribute_names,
        ExpressionAttributeValues=expression_attribute_values
    )


def get_watch_history(client_id, index_name=None):
    res = _get_table().query(
        IndexName=index_name,
        KeyConditionExpression=Key('client_id').eq(client_id)
    )

    log.debug(f"get_watch_history res: {res}")

    if not res["Items"]:
        raise NotFoundError(f"Watch history for client with id: {client_id} not found")

    return res["Item"]


def get_watch_history_by_collection(client_id, collection_id, index_name=None):
    res = _get_table().query(
        IndexName=index_name,
        KeyConditionExpression=Key("client_id").eq(client_id),
        FilterExpression=Attr("collection_id").eq(collection_id)
    )

    log.debug(f"get_watch_history_by_collection res: {res}")

    if not res["Items"]:
        raise NotFoundError(f"Watch history for client with id: {client_id} and collection: {collection_id} not found")

    return res["Item"]
